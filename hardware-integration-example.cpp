/*
 * Smart Bus Tracking System - Hardware Integration Example
 * ESP32/Arduino implementation for GPS tracking
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

// Configuration - UPDATE THESE VALUES
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* SERVER_URL = "http://localhost:3001";  // Change to your server URL
const char* API_KEY = "your-generated-api-key-here";  // Get from admin panel

// GPS Configuration
SoftwareSerial gpsSerial(4, 2);  // RX, TX pins

// System variables
float latitude = 0.0;
float longitude = 0.0;
float speed = 0.0;
float heading = 0.0;
int passengerCount = 0;
float fuelLevel = 100.0;
float engineTemp = 75.0;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
  
  // Test API connection
  testAPIConnection();
}

void loop() {
  // Read GPS data
  readGPSData();
  
  // Read sensors
  readSensorData();
  
  // Send data to server
  sendTelemetryData();
  
  // Send heartbeat every 10 updates
  static int updateCount = 0;
  if (++updateCount >= 10) {
    sendHeartbeat();
    updateCount = 0;
  }
  
  delay(10000); // Send data every 10 seconds
}

void testAPIConnection() {
  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/hardware/status");
  http.addHeader("X-API-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("API Connection Test: SUCCESS");
    Serial.println("Response: " + response);
  } else {
    Serial.println("API Connection Test: FAILED");
    Serial.println("Error code: " + String(httpResponseCode));
  }
  
  http.end();
}

void readGPSData() {
  // Simulate GPS reading (replace with actual GPS module code)
  // For testing, use fixed coordinates that move slightly
  static float baseLat = 11.3410;
  static float baseLng = 77.7172;
  static float direction = 1.0;
  
  latitude = baseLat + (random(-50, 50) / 100000.0);
  longitude = baseLng + (random(-50, 50) / 100000.0);
  speed = random(20, 60);
  heading = random(0, 360);
  
  Serial.println("GPS Data - Lat: " + String(latitude, 6) + ", Lng: " + String(longitude, 6));
}

void readSensorData() {
  // Simulate sensor readings (replace with actual sensor code)
  passengerCount = random(0, 45);
  fuelLevel = max(0.0, fuelLevel - 0.01); // Gradual fuel consumption
  engineTemp = 75 + random(-5, 15); // Temperature variation
  
  Serial.println("Sensors - Passengers: " + String(passengerCount) + 
                ", Fuel: " + String(fuelLevel) + "%, Temp: " + String(engineTemp) + "°C");
}

void sendTelemetryData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }
  
  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/hardware/gps");
  http.addHeader("X-API-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["latitude"] = latitude;
  doc["longitude"] = longitude;
  doc["speed"] = speed;
  doc["heading"] = heading;
  doc["fuel_level"] = fuelLevel;
  doc["engine_temperature"] = engineTemp;
  doc["passenger_count"] = passengerCount;
  doc["door_status"]["front"] = false;
  doc["door_status"]["rear"] = false;
  doc["timestamp"] = getISOTimestamp();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 201) {
    String response = http.getString();
    Serial.println("✓ Telemetry sent successfully");
    
    // Parse response to get confirmation
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    if (responseDoc["success"]) {
      Serial.println("Server confirmed: " + responseDoc["message"].as<String>());
    }
  } else {
    Serial.println("✗ Failed to send telemetry");
    Serial.println("HTTP Code: " + String(httpResponseCode));
    String errorResponse = http.getString();
    Serial.println("Error: " + errorResponse);
  }
  
  http.end();
}

void sendHeartbeat() {
  HTTPClient http;
  http.begin(String(SERVER_URL) + "/api/hardware/heartbeat");
  http.addHeader("X-API-Key", API_KEY);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["device_info"]["firmware_version"] = "1.0.0";
  doc["device_info"]["hardware_model"] = "ESP32-GPS-TRACKER";
  doc["device_info"]["signal_strength"] = WiFi.RSSI();
  
  doc["system_status"]["cpu_usage"] = random(20, 80);
  doc["system_status"]["memory_usage"] = random(30, 70);
  doc["system_status"]["storage_usage"] = random(10, 50);
  doc["system_status"]["battery_level"] = random(70, 100);
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    Serial.println("✓ Heartbeat sent successfully");
  } else {
    Serial.println("✗ Heartbeat failed: " + String(httpResponseCode));
  }
  
  http.end();
}

String getISOTimestamp() {
  // Get current time in ISO format
  // For ESP32, you might want to use NTP for accurate time
  return "2024-01-15T" + String(random(10, 23)) + ":" + 
         String(random(10, 59)) + ":" + String(random(10, 59)) + "Z";
}