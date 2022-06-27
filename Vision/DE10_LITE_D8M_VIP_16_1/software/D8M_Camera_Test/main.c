#include <stdio.h>
#include "I2C_core.h"
#include "terasic_includes.h"
#include "mipi_camera_config.h"
#include "mipi_bridge_config.h"

#include "auto_focus.h"
#include<stdlib.h>
#include <fcntl.h>
#include <unistd.h>

//EEE_IMGPROC defines
#define EEE_IMGPROC_MSG_START ('R'<<16 | 'B'<<8 | 'B')

//offsets
#define EEE_IMGPROC_STATUS 0
#define EEE_IMGPROC_MSG 1
#define EEE_IMGPROC_ID 2
#define EEE_IMGPROC_BBCOL 3

#define EXPOSURE_INIT 0x002000
#define EXPOSURE_STEP 0x100
#define GAIN_INIT 0x340
#define GAIN_STEP 0x010
#define DEFAULT_LEVEL 3
#define MWB_INIT 0x400
#define MWB_STEP 0x010

#define MIPI_REG_PHYClkCtl		0x0056
#define MIPI_REG_PHYData0Ctl	0x0058
#define MIPI_REG_PHYData1Ctl	0x005A
#define MIPI_REG_PHYData2Ctl	0x005C
#define MIPI_REG_PHYData3Ctl	0x005E
#define MIPI_REG_PHYTimDly		0x0060
#define MIPI_REG_PHYSta			0x0062
#define MIPI_REG_CSIStatus		0x0064
#define MIPI_REG_CSIErrEn		0x0066
#define MIPI_REG_MDLSynErr		0x0068
#define MIPI_REG_FrmErrCnt		0x0080
#define MIPI_REG_MDLErrCnt		0x0090

int col[7] = {0};
int median_x[7] = {0};
int median_y[7] = {0};
int median_x_build = 0;
int median_y_build = 0;
int median_size_build = 0;

void mipi_clear_error(void){
	MipiBridgeRegWrite(MIPI_REG_CSIStatus,0x01FF); // clear error
	MipiBridgeRegWrite(MIPI_REG_MDLSynErr,0x0000); // clear error
	MipiBridgeRegWrite(MIPI_REG_FrmErrCnt,0x0000); // clear error
	MipiBridgeRegWrite(MIPI_REG_MDLErrCnt, 0x0000); // clear error

  	MipiBridgeRegWrite(0x0082,0x00);
  	MipiBridgeRegWrite(0x0084,0x00);
  	MipiBridgeRegWrite(0x0086,0x00);
  	MipiBridgeRegWrite(0x0088,0x00);
  	MipiBridgeRegWrite(0x008A,0x00);
  	MipiBridgeRegWrite(0x008C,0x00);
  	MipiBridgeRegWrite(0x008E,0x00);
  	MipiBridgeRegWrite(0x0090,0x00);
}

void mipi_show_error_info(void){

	alt_u16 PHY_status, SCI_status, MDLSynErr, FrmErrCnt, MDLErrCnt;

	PHY_status = MipiBridgeRegRead(MIPI_REG_PHYSta);
	SCI_status = MipiBridgeRegRead(MIPI_REG_CSIStatus);
	MDLSynErr = MipiBridgeRegRead(MIPI_REG_MDLSynErr);
	FrmErrCnt = MipiBridgeRegRead(MIPI_REG_FrmErrCnt);
	MDLErrCnt = MipiBridgeRegRead(MIPI_REG_MDLErrCnt);
	printf("PHY_status=%xh, CSI_status=%xh, MDLSynErr=%xh, FrmErrCnt=%xh, MDLErrCnt=%xh\r\n", PHY_status, SCI_status, MDLSynErr,FrmErrCnt, MDLErrCnt);
}

void mipi_show_error_info_more(void){
    printf("FrmErrCnt = %d\n",MipiBridgeRegRead(0x0080));
    printf("CRCErrCnt = %d\n",MipiBridgeRegRead(0x0082));
    printf("CorErrCnt = %d\n",MipiBridgeRegRead(0x0084));
    printf("HdrErrCnt = %d\n",MipiBridgeRegRead(0x0086));
    printf("EIDErrCnt = %d\n",MipiBridgeRegRead(0x0088));
    printf("CtlErrCnt = %d\n",MipiBridgeRegRead(0x008A));
    printf("SoTErrCnt = %d\n",MipiBridgeRegRead(0x008C));
    printf("SynErrCnt = %d\n",MipiBridgeRegRead(0x008E));
    printf("MDLErrCnt = %d\n",MipiBridgeRegRead(0x0090));
    printf("FIFOSTATUS = %d\n",MipiBridgeRegRead(0x00F8));
    printf("DataType = 0x%04x\n",MipiBridgeRegRead(0x006A));
    printf("CSIPktLen = %d\n",MipiBridgeRegRead(0x006E));
}



bool MIPI_Init(void){
	bool bSuccess;


	bSuccess = oc_i2c_init_ex(I2C_OPENCORES_MIPI_BASE, 50*1000*1000,400*1000); //I2C: 400K
	if (!bSuccess)
		printf("failed to init MIPI- Bridge i2c\r\n");

    usleep(50*1000);
    MipiBridgeInit();

    usleep(500*1000);

//	bSuccess = oc_i2c_init_ex(I2C_OPENCORES_CAMERA_BASE, 50*1000*1000,400*1000); //I2C: 400K
//	if (!bSuccess)
//		printf("failed to init MIPI- Camera i2c\r\n");

    MipiCameraInit();
    MIPI_BIN_LEVEL(DEFAULT_LEVEL);
//    OV8865_FOCUS_Move_to(340);

//    oc_i2c_uninit(I2C_OPENCORES_CAMERA_BASE);  // Release I2C bus , due to two I2C master shared!


 	usleep(1000);


//    oc_i2c_uninit(I2C_OPENCORES_MIPI_BASE);

	return bSuccess;
}

int distance_calc_x(int width, int right, int condition){
	int center = 0;
	int x_mm, x;
	if(condition){
		// Calculate horizontal distance from building to centre of frame
	    center = right - (width/2);
    	x_mm = ((center - 320)*40)/width;
		x = (x_mm/10) + ((x_mm % 10) > 5);
	}
	else{
		// Calculate horizontal distance from building to centre of frame
	    center = right - (width/2);
    	x_mm = ((center - 320)*20)/width;
		x = (x_mm/10) + ((x_mm % 10) > 5);
	}
	return x;
}

int distance_calc_y(int width, int right, int condition){

	int y_mm, y;
	if(condition){
		// Calculate vertical distance from camera to building
        y_mm = (18*(width*width) - 6502*width + 740855)/1000;
    	y = (y_mm/10) + ((y_mm % 10) > 5);
	}
	else{
		// Calculate vertical distance from camera to building
        y_mm = (163*(width*width) - 22407*width + 973560)/1000;
    	y = (y_mm/10) + ((y_mm % 10) > 5);
	}
	return y;
}

int building_size(int edges){
	int circum_um = edges*40000;
	int diameter = 1 + circum_um/31416;
	return diameter;
}

int main()
{

	fcntl(STDIN_FILENO, F_SETFL, O_NONBLOCK);

  printf("DE10-LITE D8M VGA Demo\n");
  printf("Imperial College EEE2 Project version\n");
  IOWR(MIPI_PWDN_N_BASE, 0x00, 0x00);
  IOWR(MIPI_RESET_N_BASE, 0x00, 0x00);

  usleep(2000);
  IOWR(MIPI_PWDN_N_BASE, 0x00, 0xFF);
  usleep(2000);
  IOWR(MIPI_RESET_N_BASE, 0x00, 0xFF);

  printf("Image Processor ID: %x\n",IORD(0x42000,EEE_IMGPROC_ID));
  //printf("Image Processor ID: %x\n",IORD(EEE_IMGPROC_0_BASE,EEE_IMGPROC_ID)); //Don't know why this doesn't work - definition is in system.h in BSP


  usleep(2000);


  // MIPI Init
   if (!MIPI_Init()){
	  printf("MIPI_Init Init failed!\r\n");
  }else{
	  printf("MIPI_Init Init successfully!\r\n");
  }

//   while(1){
 	    mipi_clear_error();
	 	usleep(50*1000);
 	    mipi_clear_error();
	 	usleep(1000*1000);
	    mipi_show_error_info();
//	    mipi_show_error_info_more();
	    printf("\n");
//   }


#if 0  // focus sweep
	    printf("\nFocus sweep\n");
 	 	alt_u16 ii= 350;
 	    alt_u8  dir = 0;
 	 	while(1){
 	 		if(ii< 50) dir = 1;
 	 		else if (ii> 1000) dir =0;

 	 		if(dir) ii += 20;
 	 		else    ii -= 20;

 	    	printf("%d\n",ii);
 	     OV8865_FOCUS_Move_to(ii);
 	     usleep(50*1000);
 	    }
#endif






    //////////////////////////////////////////////////////////
        alt_u16 bin_level = DEFAULT_LEVEL;
        alt_u8  manual_focus_step = 10;
        alt_u16  current_focus = 300;
    	int boundingBoxColour = 0;
    	alt_u32 exposureTime = EXPOSURE_INIT;
    	alt_u16 gain = GAIN_INIT;
    	alt_u16 MWBred = MWB_INIT;
    	alt_u16 MWBgreen = MWB_INIT;
    	alt_u16 MWBblue = MWB_INIT;

        OV8865SetExposure(exposureTime);
        OV8865SetGain(gain);
        Focus_Init();

        FILE* ser = fopen("/dev/uart_0", "rb+");
        if(ser){
        	printf("Opened UART\n");
        } else {
        	printf("Failed to open UART\n");
        	while (1);
        }

  while(1){

       // touch KEY0 to trigger Auto focus
	   if((IORD(KEY_BASE,0)&0x03) == 0x02){

    	   current_focus = Focus_Window(320,240);
       }
	   // touch KEY1 to ZOOM
	         if((IORD(KEY_BASE,0)&0x03) == 0x01){
	      	   if(bin_level == 3 )bin_level = 1;
	      	   else bin_level ++;
	      	   printf("set bin level to %d\n",bin_level);
	      	   MIPI_BIN_LEVEL(bin_level);
	      	 	usleep(500000);

	         }


	#if 0
       if((IORD(KEY_BASE,0)&0x0F) == 0x0E){

    	   current_focus = Focus_Window(320,240);
       }

       // touch KEY1 to trigger Manual focus  - step
       if((IORD(KEY_BASE,0)&0x0F) == 0x0D){

    	   if(current_focus > manual_focus_step) current_focus -= manual_focus_step;
    	   else current_focus = 0;
    	   OV8865_FOCUS_Move_to(current_focus);

       }

       // touch KEY2 to trigger Manual focus  + step
       if((IORD(KEY_BASE,0)&0x0F) == 0x0B){
    	   current_focus += manual_focus_step;
    	   if(current_focus >1023) current_focus = 1023;
    	   OV8865_FOCUS_Move_to(current_focus);
       }

       // touch KEY3 to ZOOM
       if((IORD(KEY_BASE,0)&0x0F) == 0x07){
    	   if(bin_level == 3 )bin_level = 1;
    	   else bin_level ++;
    	   printf("set bin level to %d\n",bin_level);
    	   MIPI_BIN_LEVEL(bin_level);
    	   usleep(500000);

       }
	#endif
       int width, right, width_build;
	   int ball_id = 0;
	   int build_id = 0;
	   int x = 0;
	   int y = 0;
	   int size = 0;
	   int id;
	   int ball_size = 4;
	   int indx = 0;
	   int colour_count = 0;
       int build_count = 0;

       //Read messages from the image processor and print them on the terminal
       while ((IORD(0x42000,EEE_IMGPROC_STATUS)>>8) & 0xff) { 	//Find out if there are words to read
        	int word = IORD(0x42000,EEE_IMGPROC_MSG); 			//Get next word from message buffer
        	if((ball_id == 0) && (word == 82 || word == 76 || word == 66 || word == 71 || word == 80 || word == 89)){ //R,G,B,L,P,Y - FSM ID
        		id = word;
				printf("\n\n");
				printf("%c", id);
				ball_id = 1;
			}
			else if((ball_id == 1)){ // FSM Width and Right
				width = (word & 0x0000FFFF); // LSB
				right = (word & 0xFFFF0000) >> 16; // MSB
				printf("\n");
				printf("Pixel Width of ball is %d", width);
				printf("\n");
				printf("Right of ball is %d", right);
				if ((width >= 50) && (width <= 175)){ //Validity Check
					x = distance_calc_x(width, right, 1);
					y = distance_calc_y(width, right, 1);

					// Printing horizontal and vertical distance to Nios2
					printf("\n");
					printf("x (cm) = %d", x);
					printf("\n");
					printf("y (cm) = %d",y);


					if(id==66)
						indx=0;
					else if(id==71)
						indx=1;
					else if(id==76)
						indx=2;
					else if(id==80)
						indx=3;
					else if(id==82)
						indx=4;
					else if(id==89)
						indx=5;

					col[indx]=(col[indx]+1)%11;
					if(col[indx] == 6){
						median_x[indx] = x;
						median_y[indx] = y;
					}

					// Send horizontal and vertical distance to ESP32
					if(col[indx]==0){
						printf("\n");
						printf("Writing to ESP32");
						printf("\n\n");
						printf("x is %d", x);
						printf("\n");
						printf("y is %d", y);
						printf("\n");
						printf("median_x is %d", median_x[indx]);
						printf("\n");
						printf("median_y is %d", median_y[indx]);
						printf("\n\n");
						fwrite(&id, 1, 1, ser);
						fwrite(&median_x[indx], 1, 1, ser);
						fwrite(&median_y[indx], 1, 1, ser);
						fwrite(&ball_size, 1, 1, ser);
					}
                    colour_count = 0;
				}
				else{
					colour_count += 1;
					printf("colour count: ,%d",colour_count);
				}
				ball_id = 0;
			}
			else if((build_id == 0) && (word == 69)){ //E - FSM Build ID
				id = word;
				printf("\n\n");
				printf("%c", id);
				build_id = 1;
			}
			else if((build_id == 1)){ // FSM Building Width and Right
				width = (word & 0x000007FF); // [15:0]
				right = (word & 0x003FF800) >> 11; // [26:16]
				width_build = (word & 0xFFC00000) >> 22; // [31:27]
				printf("\n");
				printf("Pixel width of stripe is %d", width);
				printf("\n");
				printf("Right of stripe is %d", right);
				printf("\n");
				printf("Width of building is %d", width_build);
				if((width >= 15) && (width <= 95)){ //Validity Check
					x = distance_calc_x(width, right, 0);
					y = distance_calc_y(width, right, 0);
					size = ((width_build/width) + 1)*3;
					// Printing horizontal and vertical distance to Nios2
					printf("\n");
					printf("x (cm) = %d", x);
					printf("\n");
					printf("y (cm) = %d", y);
					printf("\n");
					printf("size (cm) = %d", size);
					col[6] = (col[6]+1)%11;
					// Send horizontal and vertical distance to ESP32
					if(col[6] == 6){
						median_x_build = x;
						median_y_build = y;
						median_size_build = size;
					}
					else if(col[6] == 0){
						printf("\n");
						printf("Writing to ESP32");
						printf("\n\n");
						printf("x is %d", x);
						printf("\n");
						printf("y is %d", y);
						printf("\n");
						printf("size is %d", size);
						printf("\n");
						printf("median_x is %d", median_x_build);
						printf("\n");
						printf("median_y is %d", median_y_build);
						printf("\n");
						printf("median_y is %d", median_size_build);
						printf("\n\n");
						fwrite(&id, 1, 1, ser);
						fwrite(&median_x_build, 1, 1, ser);
						fwrite(&median_y_build, 1, 1, ser);
						fwrite(&median_size_build, 1, 1, ser);
					}
                    build_count = 0;
				}
				else{
					if(colour_count == 6){
						printf("\n");
						printf("Nothing is shown");
						printf("\n");
						id = 110;
						x = 0;
						fwrite(&id, 1, 1,ser);
						fwrite(&x, 1, 1,ser);
						fwrite(&x, 1, 1,ser);
						fwrite(&x, 1, 1,ser);
					}
					build_count += 1;
					printf("build count: ,%d",build_count);
				}
				build_id = 0;
			}
       }

       //Update the bounding box colour
       boundingBoxColour = ((boundingBoxColour + 1) & 0xff);
       IOWR(0x42000, EEE_IMGPROC_BBCOL, (boundingBoxColour << 8) | (0xff - boundingBoxColour));

       //Process input commands
       int in = getchar();
       switch (in) {
       	   case 'e': {
       		   exposureTime += EXPOSURE_STEP;
       		   OV8865SetExposure(exposureTime);
       		   printf("\nExposure = %x ", exposureTime);
       	   	   break;}
       	   case 'd': {
       		   exposureTime -= EXPOSURE_STEP;
       		   OV8865SetExposure(exposureTime);
       		   printf("\nExposure = %x ", exposureTime);
       	   	   break;}
       	   case 't': {
       		   gain += GAIN_STEP;
       		   OV8865SetGain(gain);
       		   printf("\nGain = %x ", gain);
       	   	   break;}
       	   case 'g': {
       		   gain -= GAIN_STEP;
       		   OV8865SetGain(gain);
       		   printf("\nGain = %x ", gain);
       	   	   break;}
       	   case 'r': {
        	   current_focus += manual_focus_step;
        	   if(current_focus >1023) current_focus = 1023;
        	   OV8865_FOCUS_Move_to(current_focus);
        	   printf("\nFocus = %x ",current_focus);
       	   	   break;}
       	   case 'f': {
        	   if(current_focus > manual_focus_step) current_focus -= manual_focus_step;
        	   OV8865_FOCUS_Move_to(current_focus);
        	   printf("\nFocus = %x ",current_focus);
       	   	   break;}
       	   case 'y': {
       		   MWBred += MWB_STEP;
       		   OV8865SetRedMWBGain(MWBred);
       		   printf("\nRedGain = %x ", MWBred);
       		   break;
       	   	   }
       	   case 'h': {
       		   MWBred -= MWB_STEP;
       		   OV8865SetRedMWBGain(MWBred);
       		   printf("\nRedGain = %x ", MWBred);
       		   break;
       	   	   }
       	   case 'u': {
       		   MWBgreen += MWB_STEP;
       		   OV8865SetGreenMWBGain(MWBgreen);
       		   printf("\nGreenGain = %x ", MWBgreen);
       		   break;
       	   	   }
       	   case 'j': {
       		   MWBgreen -= MWB_STEP;
       		   OV8865SetGreenMWBGain(MWBgreen);
       		   printf("\nGreenGain = %x ", MWBgreen);
       		   break;
       	   	   }
       	   case 'i': {
       		   MWBblue += MWB_STEP;
       		   OV8865SetBlueMWBGain(MWBblue);
       		   printf("\nBlueGain = %x ", MWBblue);
       		   break;
       	   	   }
       	   case 'k': {
       		   MWBblue -= MWB_STEP;
       		   OV8865SetBlueMWBGain(MWBblue);
       		   printf("\nBlueGain = %x ", MWBblue);
       		   break;
       	   	   }
       	   }


	   //Main loop delay
	   usleep(10000);

   };
  return 0;
}
