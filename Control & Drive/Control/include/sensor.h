#include <Arduino.h>
#include <math.h>
#include "SPI.h"

#define PIN_SS        5
#define PIN_MISO      19
#define PIN_MOSI      23
#define PIN_SCK       18

#define PIN_MOUSECAM_RESET     35
#define PIN_MOUSECAM_CS        5

#define ADNS3080_PIXELS_X                 30
#define ADNS3080_PIXELS_Y                 30

#define ADNS3080_PRODUCT_ID            0x00
#define ADNS3080_REVISION_ID           0x01
#define ADNS3080_MOTION                0x02
#define ADNS3080_DELTA_X               0x03
#define ADNS3080_DELTA_Y               0x04
#define ADNS3080_SQUAL                 0x05
#define ADNS3080_PIXEL_SUM             0x06
#define ADNS3080_MAXIMUM_PIXEL         0x07
#define ADNS3080_CONFIGURATION_BITS    0x0a
#define ADNS3080_EXTENDED_CONFIG       0x0b
#define ADNS3080_DATA_OUT_LOWER        0x0c
#define ADNS3080_DATA_OUT_UPPER        0x0d
#define ADNS3080_SHUTTER_LOWER         0x0e
#define ADNS3080_SHUTTER_UPPER         0x0f
#define ADNS3080_FRAME_PERIOD_LOWER    0x10
#define ADNS3080_FRAME_PERIOD_UPPER    0x11
#define ADNS3080_MOTION_CLEAR          0x12
#define ADNS3080_FRAME_CAPTURE         0x13
#define ADNS3080_SROM_ENABLE           0x14
#define ADNS3080_FRAME_PERIOD_MAX_BOUND_LOWER      0x19
#define ADNS3080_FRAME_PERIOD_MAX_BOUND_UPPER      0x1a
#define ADNS3080_FRAME_PERIOD_MIN_BOUND_LOWER      0x1b
#define ADNS3080_FRAME_PERIOD_MIN_BOUND_UPPER      0x1c
#define ADNS3080_SHUTTER_MAX_BOUND_LOWER           0x1e
#define ADNS3080_SHUTTER_MAX_BOUND_UPPER           0x1e
#define ADNS3080_SROM_ID               0x1f
#define ADNS3080_OBSERVATION           0x3d
#define ADNS3080_INVERSE_PRODUCT_ID    0x3f
#define ADNS3080_PIXEL_BURST           0x40
#define ADNS3080_MOTION_BURST          0x50
#define ADNS3080_SROM_LOAD             0x60

#define ADNS3080_PRODUCT_ID_VAL        0x17

#define PI 3.141592654

class sensor {
 public:
    int total_x = 0;
    int total_y = 0;

    int total_x1 = 0;
    int total_y1 = 0;

	double distance_y_used = 0;

    double x=0;
    double y=0;

    int a=0;
    

    double distance_x=0;
    double distance_y=0;

    //int xnow = 0;
    //int ynow = 0;

    volatile byte movementflag=0;
    volatile int xydat[2];


    int convTwosComp(int b){
	//Convert from 2's complement
	    if(b & 0x80){
		    b = -1 * ((b ^ 0xff) + 1);
	    }
	    return -b;
    }
    
    void mousecam_reset()
    {
	    digitalWrite(PIN_MOUSECAM_RESET,HIGH);
	    delay(1); // reset pulse >10us
	    digitalWrite(PIN_MOUSECAM_RESET,LOW);
	    delay(35); // 35ms from reset to functional
    }
    int mousecam_init()
    {
	    pinMode(PIN_MOUSECAM_RESET,OUTPUT);
	    pinMode(PIN_MOUSECAM_CS,OUTPUT);

	    digitalWrite(PIN_MOUSECAM_CS,HIGH);

	    mousecam_reset();
	    return 0;
    }
    void mousecam_write_reg(int reg, int val)
    {
	    digitalWrite(PIN_MOUSECAM_CS, LOW);
	    SPI.transfer(reg | 0x80);
	    SPI.transfer(val);
	    digitalWrite(PIN_MOUSECAM_CS,HIGH);
	    delayMicroseconds(50);
    }
    
    int mousecam_read_reg(int reg)
    {
	    digitalWrite(PIN_MOUSECAM_CS, LOW);
	    SPI.transfer(reg);
	    delayMicroseconds(75);
	    int ret = SPI.transfer(0xff);
	    digitalWrite(PIN_MOUSECAM_CS,HIGH);
	    delayMicroseconds(1);
	    return ret;
    } 
    struct MD
    {
	byte motion;
	char dx, dy;
	byte squal;
	word shutter;
	byte max_pix;
    };
    void mousecam_read_motion(struct MD *p)
    {
	    digitalWrite(PIN_MOUSECAM_CS, LOW);
	    SPI.transfer(ADNS3080_MOTION_BURST);
	    delayMicroseconds(75);
	    p->motion =  SPI.transfer(0xff);
	    p->dx =  SPI.transfer(0xff);
	    p->dy =  SPI.transfer(0xff);
	    p->squal =  SPI.transfer(0xff);
	    p->shutter =  SPI.transfer(0xff)<<8;
	    p->shutter |=  SPI.transfer(0xff);
	    p->max_pix =  SPI.transfer(0xff);
	    digitalWrite(PIN_MOUSECAM_CS,HIGH);
	    delayMicroseconds(5);
    }
    // pdata must point to an array of size ADNS3080_PIXELS_X x ADNS3080_PIXELS_Y
    // you must call mousecam_reset() after this if you want to go back to normal operation
    int mousecam_frame_capture(byte *pdata)
    {
	    mousecam_write_reg(ADNS3080_FRAME_CAPTURE,0x83);

	    digitalWrite(PIN_MOUSECAM_CS, LOW);

	    SPI.transfer(ADNS3080_PIXEL_BURST);
	    delayMicroseconds(50);

	    int pix;
	    byte started = 0;
	    int count;
	    int timeout = 0;
	    int ret = 0;
	    for(count = 0; count < ADNS3080_PIXELS_X * ADNS3080_PIXELS_Y; ){
		    pix = SPI.transfer(0xff);
		    delayMicroseconds(10);
		    if(started==0){
			    if(pix&0x40)
				    started = 1;
			    else{
				    timeout++;
				    if(timeout==100){
					    ret = -1;
					    break;
				        }
			    }
		    }
		    if(started==1){
			    pdata[count++] = (pix & 0x3f)<<2; // scale to normal grayscale byte range
		    }
 	    }

	    digitalWrite(PIN_MOUSECAM_CS,HIGH);
	    delayMicroseconds(14);

	    return ret;
    }

    void print_stars(int val, MD md ){


	    Serial.print("motion: ");
	    Serial.print(md.motion);
	    Serial.print(" max_pix: ");
	    Serial.println(md.max_pix);

	    for(int i=0; i<md.squal/4; i++)
		    Serial.print('*');
	
	    Serial.print(' ');
	    Serial.print((val*100)/351);
	    Serial.print(' ');
	    Serial.print(md.shutter); Serial.print(" (");
	    Serial.print((int)md.dx); Serial.print(',');
	    Serial.print((int)md.dy); Serial.println(')');

		

	    Serial.print('\n');


	    Serial.println("Distance_x = " + String(total_x));

	    Serial.println("Distance_y = " + String(total_y));
	    Serial.print('\n');
	    return;
    }
    
    void motion_detction(){
	    int val = mousecam_read_reg(ADNS3080_PIXEL_SUM);
	    MD md;
	    mousecam_read_motion(&md);

		distance_x = convTwosComp(md.dx)*3.634;  
		distance_y = convTwosComp(md.dy)*3.634;

		distance_y_used = distance_y/157;


		
	    total_x1 = total_x1 + distance_x;
	    total_y1 = total_y1 + distance_y;

	    total_x = total_x1/157;
	    total_y = -total_y1/157;

		//xnow=((int)md.dx);
		//ynow=((int)md.dy);

	    print_stars(val, md);
    }




	void setup(){
		pinMode(PIN_SS,OUTPUT);
		pinMode(PIN_MISO,INPUT);
		pinMode(PIN_MOSI,OUTPUT);
		pinMode(PIN_SCK,OUTPUT);

		SPI.begin();
		SPI.setClockDivider(SPI_CLOCK_DIV32);
		SPI.setDataMode(SPI_MODE3);
		SPI.setBitOrder(MSBFIRST);


		if(mousecam_init()==-1){
			Serial.println("Mouse cam failed to init");
			while(1);
		}
	}
	void update_values(int theta){
		//Serial.print("distance_y_used : ");
		//Serial.println(distance_y_used);
		//Serial.print("distance_y : ");
		//Serial.println(distance_y);

		int phi;
		if (0<=theta && theta<=90){
			x-= distance_y_used* cos((theta*PI)/180);
			y-= distance_y_used* sin((theta*PI)/180);

		}
		else if (90<theta && theta<=180){
			phi= 180-theta;
			y-= distance_y_used* sin((phi*PI)/180);
			x-= -distance_y_used* cos((phi*PI)/180);


		}
		else if (180<theta && theta<=270){
			phi= 270-theta;
			y-=-distance_y_used* cos((phi*PI)/180);
			x-=-distance_y_used* sin((PI*phi)/180);
		
		}
		else if (270<theta && theta<=360){
			phi=360-theta;
			y-=-distance_y_used* sin((phi*PI)/180);
			x-=distance_y_used*cos((phi*PI)/180);

		}
		 //int phi;
		// Serial.print("total_y : ");
		// Serial.println(total_y);

		// Serial.print("angle of rover: ");
		// Serial.println(theta);

		/*if (0<=theta<=90){

		 	y= total_y* sin(theta);
		 	x= total_y* cos(theta);

		 }
		 else if (90<theta<=180){
		 	phi= 180-theta;
		 	y=-total_y* cos(phi);
		 	x= total_y* sin(phi);*/


		// }
		// else if (180<theta<=270){
		// 	phi= 270-theta;
		// 	y+=-distance_y* sin(phi);
		// 	x+=-distance_y* cos(phi);

		// }
		// else if (270<theta<360){
		// 	phi=360-theta;
		// 	y+= distance_y* cos(phi);
		// 	x+=-distance_y*sin(phi);

		// }
		// x -= distance_y * cos(theta*PI/180);
		// y -= distance_y * sin(theta*PI/180);
		
	}


};