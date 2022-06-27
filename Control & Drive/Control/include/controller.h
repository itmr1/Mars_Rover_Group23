#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <PID_v1.h>
#include <RunningMedian.h>

#define MOTOR_A_IN1 15
#define MOTOR_A_IN2 13
#define MOTOR_A_ENA 2

#define MOTOR_B_IN1 14
#define MOTOR_B_IN2 12
#define MOTOR_B_ENA 4


class controller {
    public:
    RunningMedian offsetSamples = RunningMedian(30);
    RunningMedian gyroSamples = RunningMedian(5);
    RunningMedian lastError = RunningMedian(5);

    double MOTOR_DELTAMAX = 0;
    double MOTOR_NOMINAL = 0;
    int MOTOR_NOMINAL_TURN = 0;
    int MOTOR_NOMINAL_DRIVE = 60;
    int MOTOR_DELTAMAX_TURN = 60;
    int MOTOR_DELTAMAX_DRIVE = 40;
    // Set motor A to given speed (-255..+255); 0 switches off
    void motor_A_set( double speed ) {
        if( speed==0 ) {
            digitalWrite( MOTOR_A_IN1, HIGH );
            digitalWrite( MOTOR_A_IN2, HIGH );
            analogWrite(MOTOR_A_ENA, 0);
        }
        else if( speed>0 ) {
            digitalWrite( MOTOR_A_IN1, HIGH );
            digitalWrite( MOTOR_A_IN2, LOW );
            analogWrite ( MOTOR_A_ENA, speed);
        } 
        else {
            digitalWrite( MOTOR_A_IN1, LOW );
            digitalWrite( MOTOR_A_IN2, HIGH );
            analogWrite ( MOTOR_A_ENA, -speed);
        }
    }
    // Set motor B to given speed (-255..+255); 0 switches off
    void motor_B_set( double speed ) {
        if( speed==0 ) {
            digitalWrite( MOTOR_B_IN1, HIGH );
            digitalWrite( MOTOR_B_IN2, HIGH );
            analogWrite(MOTOR_B_ENA, 0);
        } 
        else if( speed>0 ) {
            digitalWrite( MOTOR_B_IN1, HIGH );
            digitalWrite( MOTOR_B_IN2, LOW );
            analogWrite ( MOTOR_B_ENA, speed);
        } 
        else {
            digitalWrite( MOTOR_B_IN1, LOW );
            digitalWrite( MOTOR_B_IN2, HIGH );
            analogWrite ( MOTOR_B_ENA, -speed);
        }
    }

    void motor_off() {
        motor_A_set(0);
        motor_B_set(0);
    }

    // Switches both motors to forward (to speed MOTOR_NOMINAL), but B motor 'delta'
    // faster than A motor (delta in range -MOTOR_DELTAMAX..+-MOTOR_DELTAMAX)

    void motor_forward(int delta) {
        if( delta>+MOTOR_DELTAMAX ) delta= +MOTOR_DELTAMAX;
        if( delta<-MOTOR_DELTAMAX ) delta= -MOTOR_DELTAMAX;

        motor_A_set(MOTOR_NOMINAL+delta);
        motor_B_set(MOTOR_NOMINAL-delta);

    }

    Adafruit_MPU6050 mpu;
    double gyro_offset;
    double pi = 3.14159;

    double find_gyro_offset(){
        double offset;
        for(int i = 0; i < 100; i++){
            sensors_event_t a, g, temp;
            mpu.getEvent(&a, &g, &temp);
            if(abs(g.gyro.z) < 0.03 && abs(g.gyro.z) > 0.019){
                offsetSamples.add(g.gyro.z);
                Serial.println(g.gyro.z,4);
                delay(10);
            }
        }
        offset = offsetSamples.getMedian();
        Serial.println("Offset equal to: " + String(offset,4));
        return offset;
    }


        double angle_PID_to_user (double angle_x){
         int number_of_repetitions = abs(angle_x)/360;
         double positive_remainder = abs(angle_x) - number_of_repetitions * 360;
  
        if(angle_x >= 0 ){
        if(number_of_repetitions == 0){return angle_x;}
        else                          {return positive_remainder;}
        }
        else{
             if(number_of_repetitions == 0){return angle_x + 360;}
            else                          {return 360 - positive_remainder;}
        } 
    }
    



// Command ===================================================
    bool task_finished = 1 , turn = 0, drive = 0, off = 0; 
    String txt;
    int val = 0;

// PID ===================================================
    double Kp_turn=7, Ki_turn=0.005, Kd_turn=0.01;
    double Kp_drive=3.4, Ki_drive=0, Kd_drive=0.02;
    double target_angle = 90, user_angle = 90, current_angle = 90, angleCorrection = 0, current_angular_velocity = 0, median_angular_velocity = 0;
    double limit = 0;
    double error, medianError;
    int countLoops = 0;
    bool distance_reached;

    int old_distance_y = 0;
    int distance_y_covered = 0;

    void loopdrive1(String Direction, PID turnPID, PID drivePID, int total_y){
            if(countLoops == 4){
                if(turn == 1){
                    if(limit > MOTOR_DELTAMAX_TURN){
                        limit = MOTOR_DELTAMAX_TURN;
                        turnPID.SetOutputLimits(-limit, limit);
                    }else{
                        limit += 1;
                        turnPID.SetOutputLimits(-limit, limit);
                    }  
                    Serial.println("Median Angular Velocity: " + String(median_angular_velocity,3) + " Current Angle: " + String(current_angle,3) + " Steer Correction: " + String(angleCorrection, 3));
                    turnPID.Compute();
                    motor_forward(angleCorrection); //Correction negative - turn left  
                    if(medianError >= 0.5 && medianError < 7){
                        turnPID.SetOutputLimits(-40, 40);
                        if(angleCorrection > 0)   {angleCorrection = map(angleCorrection, 0, 40, 37, 40);}
                        else                      {angleCorrection = map(angleCorrection, -40, 0, -40, -37);}
                    } 
                    if(medianError < 1){
                        task_finished = 1;
                        Direction="";
                        motor_off();
                        Serial.println("Turn Completed");
                    }  
                    countLoops = 0;
                    
                }
                
                else if(drive == 1){ 
            
                if(MOTOR_NOMINAL < MOTOR_NOMINAL_DRIVE){
                    MOTOR_NOMINAL += 0.5;
                    }else{
                    MOTOR_NOMINAL = MOTOR_NOMINAL_DRIVE;
                    }  
                    if(limit > MOTOR_DELTAMAX_DRIVE){
                    limit = MOTOR_DELTAMAX_DRIVE;
                    drivePID.SetOutputLimits(-limit, limit);
                    }else{
                    limit += 1.5;
                    drivePID.SetOutputLimits(-limit,limit);
                    }       
                    Serial.println("Median Angular Velocity: " + String(median_angular_velocity,3) + " Current Angle: " + String(current_angle,3) + " Steer Correction: " + String(angleCorrection, 3));
                    drivePID.Compute();
                    motor_forward(angleCorrection); //Correction positive - turn left
                    countLoops = 0;
                    distance_y_covered= total_y-old_distance_y;
                
                if(distance_reached==true){
                        motor_off();
                        Serial.println("Distance achieved");
                        task_finished = 1;
                        Direction="";
                        distance_reached=false;
                        old_distance_y=total_y;
                        distance_y_covered=0;
                    }
                }

                else if(off == 1){
                    motor_off();
                    task_finished = 1;
                    Serial.println("Off Completed");
                }
                
            }  
                    

            }
        void loopdrive2(String Direction, int angle_from_user){
            if( Direction== "drive"){
                target_angle = current_angle;
                MOTOR_NOMINAL = 0;
                MOTOR_DELTAMAX = MOTOR_DELTAMAX_DRIVE;
                drive = 1;
                turn = 0;
                off = 0;
                limit = 0;
                angleCorrection = 0;
                task_finished = 0;
                }
                else if(Direction == "turn"){
                target_angle=current_angle+angle_from_user;
                MOTOR_NOMINAL = 0;
                MOTOR_DELTAMAX = MOTOR_DELTAMAX_TURN;
                limit = 0;
                drive = 0;
                turn = 1;
                off = 0;
                angleCorrection = 0;
                task_finished = 0;
                }
                else if(Direction == "off"){
                MOTOR_NOMINAL = 0;
                MOTOR_DELTAMAX = 0;
                drive = 0;
                turn = 0;
                off = 1;
                limit = 0;
                angleCorrection = 0;
                task_finished = 1;
                }

        }
    



            


};