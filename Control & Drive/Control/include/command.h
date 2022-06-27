#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include <stdint.h>
#include <ArduinoJson.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <NTPClient.h>


class command
{
public:
const char* ssid ="Timur9";
const char* password="1234567890";
const char* host= "192.168.137.166";
String getData;
String GetAddress = "get_name.php";
// String LinkGet= host+GetAddress ;
String LinkGet = "192.168.137.166";
String name;
String table;
bool Pathfinding=0;


int angle_from_user;
int distance_from_user;
String Direction;

bool backtobase; 
bool automate;


void initwiFi(){
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi ..");
    while(WiFi.status() != WL_CONNECTED){
        Serial.print(".");
        delay(1000);

    }
    Serial.println(WiFi.localIP());
}

String http_GET_Request(String serverName,  String getData, String table) {
  WiFiClient client;
  HTTPClient http;
  http.begin(serverName, 5000, table);                                                               //--> Specify request destination
  http.addHeader("Content-Type", "application/json");                                                  //Specify content-type header
  int httpCodeGet = http.POST(getData);                                                                //--> Send the request
  String payload="";
  if (httpCodeGet>0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpCodeGet);
    payload = http.getString();
  }
  else {
    Serial.print(httpCodeGet+"///trying to send");
  }
  http.end();
  return payload;
}

String http_receive_Request(String serverName, String table) {
  DynamicJsonDocument doc(2048);
  WiFiClient client;
  HTTPClient http;
  http.begin(serverName, 5000, table);                                                 //--> Specify request destination
  http.addHeader("Content-Type", "application/json");                                                  //Specify content-type header
  int httpCodeGet = http.GET();                                                                //--> Send the request
  String payload="";
  if (httpCodeGet>0) {
    payload = http.getString();
    Serial.println(payload);
    deserializeJson(doc, payload);
    //Serial.println(obj["type"].as<String>());
    if (doc[0]["type"]=="forward"){
      Serial.println("HERE10");
      distance_from_user = doc[0]["input"];
      //Serial.println(distance_from_user);
      Direction="drive";
    }
    else if (doc[0]["type"]=="rotateCW"){
       //Serial.println("HERE");
       angle_from_user = doc[0]["input"];
       angle_from_user= -angle_from_user;  
       Direction="turn";
    }
    else if(doc[0]["type"]=="rotateACW"){
       angle_from_user = doc[0]["input"];  
       Direction="turn";
    }
    if(doc[0]["type"]=="BackToBase"){
      backtobase=1;
    }
    if(doc[0]["type"]=="AutoSweep"){
      automate=1;
    }
    if (doc[0]["type"]=="Finished"){
      Pathfinding=0;

    }
    if (doc[0]["type"]=="Position"){

    }
    //1 negative x
    //2 negative x
  }
  else {
    Serial.print(httpCodeGet+ "///trying to receive");
  }
  http.end();
  return payload;
}


void Sensor_to_server(int xcoordinate_rover,int ycoordinate_rover,int angle_rover,bool finished){
  table="/data/location";
  StaticJsonDocument<200> doc;
  doc["ID"]="";
  JsonObject location = doc.createNestedObject("Location");
  location["x"]=xcoordinate_rover;
  location["y"]=ycoordinate_rover;
  doc["angle"]=angle_rover;
  doc["finished"]=finished;
  getData="";
  serializeJson(doc,getData);
  name="";
  name = http_GET_Request(LinkGet,getData,table);
  //Serial.println("name: "+name)
  //Status is gpoing to be added to location to say error
}

void FPGA_to_server(int xcoordinate_alien, int ycoordinate_alien, String type_of_obstacle, String colour,int size){
  table="/data/aliens";
  StaticJsonDocument<200> doc;
  doc["ID"]="";
  doc["type"]= type_of_obstacle;
  doc["Colour"]=colour;
  doc["size"]=size;
  JsonObject location = doc.createNestedObject("Location");
  location["x"]=xcoordinate_alien;
  location["y"]=ycoordinate_alien;
  getData="";
  serializeJson(doc, getData);
  name="";
  name = http_GET_Request(LinkGet,getData,table);
  //Serial.println("name: "+name);

}

void Energy_to_server(int percentage){
  table="/data/battery";
  getData = "";
   StaticJsonDocument<200> doc;
   doc["id"]="";
   doc["Health"]= String(percentage);
   getData = "";
   serializeJson(doc, getData);
   name="";
   name = http_GET_Request(LinkGet,getData,table);
  // Serial.println("name: "+name);

}

void Radar_to_server(int xcoordinate_rover, int ycoordinate_rover){
   table="/data/aliens";
   getData="";
   StaticJsonDocument<200> doc;
   doc["ID"]="";
   doc["Colour"]= "";
   doc["type"]="fan";
   JsonObject location = doc.createNestedObject("Location");
   location["x"]=xcoordinate_rover;
   location["y"]=ycoordinate_rover;
   serializeJson(doc, getData);
   name="";
   name = http_GET_Request(LinkGet,getData,table);
   //Serial.println("name: "+name);
}

void autonomous(int x_start, int y_start, int x_end ,int y_end,bool emm_stop,bool done){
  table="/data/auto";
   getData="";
   StaticJsonDocument<200> doc;
   doc["ID"]="";
   JsonObject start = doc.createNestedObject("start");
   start["x"]=x_start;
   start["y"]=y_start;
   JsonObject end = doc.createNestedObject("end");
   end["x"]=x_end;
   end["y"]=y_end;
   doc["stop"]=emm_stop;
   doc["done"]=done;
   serializeJson(doc, getData);
   name="";
   name = http_GET_Request(LinkGet,getData,table);
   //Serial.println("name: "+name);
}

void reconnect (){
    unsigned long currentMillis=millis();
    unsigned long previousMillis=0;
    unsigned long interval=30000;

    if ((WiFi.status()!= WL_CONNECTED) && (currentMillis - previousMillis >= interval)){
        Serial.print(millis());
        Serial.println("Reconnecting to WiFi... ");
        WiFi.disconnect();
        WiFi.reconnect();
        previousMillis=currentMillis;
    }
}

};
