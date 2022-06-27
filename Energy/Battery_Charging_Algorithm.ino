#include <Wire.h>
#include <INA219_WE.h>
#include <SPI.h>


INA219_WE ina219;

int V_supply = 4670;
double Vpd, Vb, Va, Iout, pwm_out, Pout;
bool loop_trigger = 0, in_range = 0;
int count = 0;
double batEnergy = 0;
double batLevel = 0;
bool on = 0;

void setup() {
Wire.begin(); // We need this for the i2c comms for the current sensor
  Wire.setClock(700000); // set the comms speed for i2c
  ina219.init(); // th
noInterrupts(); //disable all interrupts
TCA0.SINGLE.PER = 999; //
TCA0.SINGLE.CMP1 = 999; //
TCA0.SINGLE.CTRLA = TCA_SINGLE_CLKSEL_DIV16_gc | TCA_SINGLE_ENABLE_bm; //16 prescaler, 1M.
TCA0.SINGLE.INTCTRL = TCA_SINGLE_CMP1_bm;
interrupts();  //enable interrupts.



//-----------TimerB0 initialization for PWM output-----------

TCB0.CTRLA = TCB_CLKSEL_CLKDIV1_gc | TCB_ENABLE_bm; //62.5kHz

Serial.begin(9600);
Serial.println("OK");
pinMode(6, OUTPUT);
pinMode(8, OUTPUT);
pinMode(4, INPUT);
pinMode(5, OUTPUT);
digitalWrite(8, LOW);
while(digitalRead(4) == HIGH){}//Wait for the rover to dock
}

void loop() {
if(batLevel < 100){
digitalWrite(5, LOW);
   if (loop_trigger == 1){
    count++;
    loop_trigger = 0;
    pwm_modulate(pwm_out);
    if(digitalRead(4) == HIGH){
    on = 1;
    }
    }

        
  
    //-----------SLOW LOOP (5HZ)-----------
    if (count == 49){
    sample();
    if(on == 1){
    Serial.println(String(Vb) + "," + String(Iout) + "," + String(Pout) + "," + String(batEnergy));
    on = 0;  
    }
    if(Va < 5.5){
    in_range = 0;
    pwm_out = 0.818;
    digitalWrite(8, LOW);
    }
    else if(Va > 8.1){
    in_range = 0;
    pwm_out = 0.649;
    digitalWrite(8, LOW); 
    }
    else{
      in_range = 1;
      pwm_out = (-7.68*Va+124.05)/100;
    }
    if(in_range == 1){
      if(Vb > 5.2 || Vb < 4.5){
      digitalWrite(8, LOW);
      }else{
      batEnergy += Pout * 0.05;
      batLevel = batEnergy / 900;
      digitalWrite(8, HIGH);
      }
    }
    count = 0;
} 

}else{
  digitalWrite(8, LOW);
  digitalWrite(5, HIGH);
}

}



//ADDITIONAL FUNCTIONS ===========================================


ISR(TCA0_CMP1_vect) {
  TCA0.SINGLE.INTFLAGS |= TCA_SINGLE_CMP1_bm; //clear interrupt flag
  loop_trigger = 1; //trigger the loop when we are back in normal flow
}

void sample(){
Vpd = map(analogRead(A0),0,1023,0,V_supply);
Vb = map(analogRead(A3),0,1023,0,V_supply);
Vpd = Vpd/1000;
Va = Vpd * 890 / 330;
Vb = Vb/1000;
Iout = ina219.getCurrent_mA(); // sample the inductor current (via the sensor chip)
Iout = Iout / 1000;
Pout = Vb * Iout;
}

float saturation( float sat_input, float uplim, float lowlim) { // Saturation function
  if (sat_input > uplim) sat_input = uplim;
  else if (sat_input < lowlim ) sat_input = lowlim;
  else;
  return sat_input;
}

void pwm_modulate(float pwm_input){ // PWM function
  analogWrite(6,(int)(255 - pwm_input*255)); 
}
