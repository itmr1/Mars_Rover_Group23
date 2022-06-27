#include <Wire.h>
#include <INA219_WE.h>
#include <SPI.h>
#include <SD.h>

#define PWM_PIN 6

//-----------Variables for SD card and INA219-----------

INA219_WE ina219;
Sd2Card card;
SdVolume volume;
SdFile root;



//-----------Initiating variables-----------
double Time, LastTime;
float slow_loop_duration = 86;
float T_slow_loop = 200-slow_loop_duration;
const int     chipSelect = 10;                      // hardwired chip select for the SD card
const int     arraySize = 5;
double        count_check = 0;
unsigned int  loop_trigger;
unsigned int  count = 0, delay_counter = 0;                            // a variables to count the interrupts. Used for program debugging.
int           state = 0, next_state = 0;
float         V_supply = 4690;                      // Supply Voltage in mV
float         curMaxPin;
double        pwm_out, pwm_old, pwm_start;
double        Va,   Vb,   Vpd,  Pin,   Iin;
double        Pold = 0,   Pdiff = 0, Pdiff_percent = 0;
double        duty_step_large = 0.01, duty_step_small = 0.005;                      //Step by which the duty cycle is perturbed
double        Array[arraySize];
boolean       x = 1;                                 //Type of last duty cycle perturbation: 0 - decrease, 1 - increase
boolean       peakReached = 0;
String        dataString, MPPT_String;
double        t = 0;
bool initiate_slow_loop = 0;

//-----------SETUP LOOP-----------

void setup() {

  
  //-----------Some General Setup Stuff-----------
  
  Wire.begin(); // We need this for the i2c comms for the current sensor
  Wire.setClock(700000); // set the comms speed for i2c
  ina219.init(); // this initiates the current sensor
  Serial.begin(9600); // USB Communications




  //-----------Check for the SD Card-----------
  
  Serial.println("\nInitializing SD card...");
  if(!SD.begin(chipSelect)) {
    Serial.println("* is a card inserted?");
    while (true) {} //It will stick here FOREVER if no SD is in on boot
  }else{
    Serial.println("Wiring is correct and a card is present.");
  }
  if(SD.exists("Sol_Test.txt")) { // Wipe the datalog when starting
    SD.remove("Sol_Test.txt");
  }

   if(SD.exists("MPPT.txt")) { // Wipe the datalog when starting
    SD.remove("MPPT.txt");
  }



  //-----------SMPS Pins-----------
  
  pinMode(13, OUTPUT); // Using the LED on Pin D13 to indicate status
  pinMode(2, INPUT_PULLUP); // Pin 2 is the input from the CL/OL switch
  pinMode(PWM_PIN, OUTPUT); // This is the PWM Pin
  pinMode(7, OUTPUT); //error led
  pinMode(5, OUTPUT); //some other digital out
  pinMode(A0, INPUT);
  pinMode(8, OUTPUT);
  pinMode(4, OUTPUT);
  digitalWrite(4, LOW);
  digitalWrite(8, LOW);
  //analogReference(EXTERNAL); // We are using an external analogue reference for the ADC




  //-----------TimerA0 initialization for 1kHz control-loop interrupt-----------
  
  noInterrupts(); //disable all interrupts
  TCA0.SINGLE.PER = 999; //
  TCA0.SINGLE.CMP1 = 999; //
  TCA0.SINGLE.CTRLA = TCA_SINGLE_CLKSEL_DIV16_gc | TCA_SINGLE_ENABLE_bm; //16 prescaler, 1M.
  TCA0.SINGLE.INTCTRL = TCA_SINGLE_CMP1_bm;
  interrupts();  //enable interrupts.



  //-----------TimerB0 initialization for PWM output-----------
  
  TCB0.CTRLA = TCB_CLKSEL_CLKDIV1_gc | TCB_ENABLE_bm; //62.5kHz



  
  //-----------Test solar conditions and set initial conditions for MPPT-----------
  test_solar_conditions();
  analogWrite(PWM_PIN, (int)(255 - pwm_out * 255));
  delay(250);
  Serial.println("Solar Conditions Tested");
  Serial.println("Performing MPPT");
  pwm_out = pwm_start; //Set initial duty cycle to 50%
  Serial.println("Initial Starting Duty Cycle: " + String(pwm_start) + " [%]");
  sample();      //Sample the initial PV parameters

  

}
//-----------END OF SETUP LOOP-----------







//-----------MAIN LOOP-----------

void loop() {
  
  if (loop_trigger == 1){
  //-----------FAST LOOP (1kHZ)-----------
  loop_trigger = 0;
  count++; 
  analogWrite(PWM_PIN, (int)(255 - pwm_out * 255));
 
  }

  //-----------SLOW LOOP (20HZ)-----------
if (count == T_slow_loop-1){
  count = 0;
  digitalWrite(4, HIGH);
  t += (T_slow_loop + slow_loop_duration)/1000;
  count_check += (T_slow_loop + slow_loop_duration)/1000;
  File MPPTFile = SD.open("MPPT.txt", FILE_WRITE);
  MPPT_String = String(t,2) + "," + String(Pin);
  MPPTFile.println(MPPT_String); // print the data
  MPPTFile.close();
  digitalWrite(4, LOW);
  Serial.print("Time: " +  String(t) + " s   Power Input: " + String(Pin) + " W   Old Power Input: " + String(Pold) + " W   Power change: ");
  Serial.print(String(Pdiff_percent)+ " %  Duty Cycle: " + String(pwm_out) + " %  Peak Reached:");
  Serial.print(String(peakReached) + "  Output Voltage: ");
  Serial.println(Va);
  if(count_check >= 300){
     count_check = 0;
     Serial.println("Planned Conditions Check");
     state = 5;
    }else{state = next_state;}
  perform_MPPT(state);
}
 
}
//-----------END OF MAIN LOOP-----------








//-----------ADDITIONAL FUNCTIONS-----------


//-----------Timer A CMP1 interrupt. Every 1000us the program enters this interrupt. This is the fast 1kHz loop-----------

ISR(TCA0_CMP1_vect) {
  TCA0.SINGLE.INTFLAGS |= TCA_SINGLE_CMP1_bm; //clear interrupt flag
  loop_trigger = 1; //trigger the loop when we are back in normal flow
}





//-----------Saturate to ensure that the given parameter does not exceed desired range-----------

float saturation( float sat_input, float uplim, float lowlim) { // Saturation function
  if (sat_input > uplim) sat_input = uplim;
  else if (sat_input < lowlim ) sat_input = lowlim;
  else;
  return sat_input;
}





//-----------Sample the input/output voltages/currents to the Arduino-----------

void sample(){
Vpd = map(analogRead(A3),0,1023,0,V_supply);
Vb = map(analogRead(A0),0,1023,0,V_supply);
Vpd = Vpd/1000;
Va = Vpd * 2 * 890 / 330;
Vb = Vb/250;
Iin = (ina219.getCurrent_mA()); // sample the inductor current (via the sensor chip)
Iin = -Iin/1000;
Pin = Iin * Vb;
}




//-----------Test the initial solar conditions-----------

void test_solar_conditions(){
curMaxPin = 0;
analogWrite(6, 0); //a default state to start with
delay(500);
File dataFile = SD.open("Sol_Test.txt", FILE_WRITE);
dataFile.println("Duty,Va,Vb,Iin,Pin");
for(float i = 99; i > 1; i-=5){
//if(Va > 7.7){
//  i = 30;
//}else{
  pwm_out = i/100; 
//}
//if(Va > 5.6 && Va < 7.6){
  if(Pin > curMaxPin){
    curMaxPin = Pin;
    pwm_start = pwm_out;
  }
//}
analogWrite(PWM_PIN, (int)(255 - pwm_out * 255));
delay(150);
sample();
dataString = String(pwm_out,2) + "," + String(Va,3) + "," + String(Vb,3) + "," + String(Iin,3) + "," + String(Pin,3);
Serial.println(dataString); // send it to serial as well in case a computer is connected
dataFile.println(dataString); // print the data
}
analogWrite(PWM_PIN, (int)(255 - pwm_start * 255));
delay(500);
dataFile.close(); // close the file
}





//-----------FSM for MPPT-----------

void perform_MPPT(int state){

    switch (state) {
      
      case 0:{
          pwm_old = pwm_out;
          Pold = Pin;
          if(x == 1)  {next_state = 1;}
          else        {next_state = 2;}
        break;
      }
      
      case 1:{
          if(peakReached){pwm_out = pwm_old + duty_step_large;}
          else{pwm_out = pwm_old + duty_step_small;}
          pwm_out = saturation(pwm_out, 0.99, 0.33);
          x = 1;
          next_state = 3;        
        break;
      }
      
      case 2:{
          if(peakReached){pwm_out = pwm_old - duty_step_large;}
          else{pwm_out = pwm_old - duty_step_small;}
          pwm_out = saturation(pwm_out, 0.99, 0.33);
          x = 0;
          next_state = 3;   
        break;        
      }
      
      case 3: {
          sample();
          if(Va > 7.8){
          Serial.println("Trigger");
          next_state = 6;  
          }else{
          if(Pin < 0.01){next_state = 3;}
          else if(Pin > 4.5){next_state = 3;}
          else{
          Pdiff = Pin - Pold;
          Pdiff_percent = 100 * Pdiff/Pold;
         
          if(abs(Pdiff_percent) < 50){peakReached = detectPeak(Pold);}
          
          if(Pdiff >= 0){
            next_state = 0;
          }else{
              if(abs(Pdiff_percent) < 7){next_state = 4;} 
              else{next_state = 0;}           
              }
          }
          }
        break;
      
      }
      
      case 4: {
          pwm_out = pwm_old;
          if(x == 1){next_state = 2;}
          else      {next_state = 1;}
        break;
      }

      case 5: {
          test_solar_conditions();
          Pdiff = 0;
          Pdiff_percent = 0;
          pwm_out = pwm_start; 
          Serial.println("Initial Starting Duty Cycle: " + String(pwm_start) + " [%]");
          next_state = 0;
      }

      case 6: {
        Serial.println("State 6");
        pwm_out += 0.01;
        next_state = 7;
      }

      case 7: {
        sample();
        if(Va > 7.8){
          next_state = 6;
        }
        else{
          next_state = 0;
        }
      }
      
      default :{
        next_state = 3; 
        Serial.println("Error, entered MPPT default state");
      }    
    }
  
}


bool detectPeak(double P){
float maxP, minP, Perror;
for(int i = arraySize - 1; i > 0; i--){
  Array[i] = Array[i-1];
}
  Array [0] = P;
  
minP = Array[0];
maxP = Array[0];

for(int i = 1; i < arraySize; i++){
  maxP = max(maxP, Array[i]);
  minP = min(minP, Array[i]);
}

Perror = 100*(maxP-minP)/maxP;
if(Perror < 5){
  return 1;
}else{
  return 0;
}

}
