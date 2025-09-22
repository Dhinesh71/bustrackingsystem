# Hardware Integration Guide

This guide explains how to integrate GPS hardware devices with the Smart Bus Tracking System.

## Overview

The system provides REST API endpoints for GPS hardware devices to send real-time location data, sensor readings, and status updates. Each hardware device must authenticate using a unique API key.

## Getting Started

### 1. Generate API Key

Contact your system administrator to generate an API key for your hardware device. You'll need:
- Device name/identifier
- Associated bus ID
- Optional expiration date

### 2. API Key Format

API keys are UUID format strings:
```
12345678-1234-1234-1234-123456789abc
```

### 3. Base URL

All API endpoints are relative to your server's base URL:
```
https://your-domain.com/api/hardware/
```

## Authentication

Include your API key in every request using the `X-API-Key` header:

```http
X-API-Key: your-api-key-here
Content-Type: application/json
```

## API Endpoints

### Send GPS Data

**Endpoint:** `POST /api/hardware/gps`

**Description:** Send real-time GPS coordinates and sensor data.

**Headers:**
```http
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 11.3410,
  "longitude": 77.7172,
  "speed": 35.5,
  "heading": 90,
  "altitude": 245.5,
  "accuracy": 3.2,
  "fuel_level": 75.5,
  "engine_temperature": 82.3,
  "door_status": {
    "front": false,
    "rear": false
  },
  "passenger_count": 23,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Required Fields:**
- `latitude` (number): GPS latitude (-90 to 90)
- `longitude` (number): GPS longitude (-180 to 180)

**Optional Fields:**
- `speed` (number): Speed in km/h (0-200)
- `heading` (number): Direction in degrees (0-360)
- `altitude` (number): Altitude in meters
- `accuracy` (number): GPS accuracy in meters
- `fuel_level` (number): Fuel level percentage (0-100)
- `engine_temperature` (number): Engine temperature in Celsius
- `door_status` (object): Door open/closed status
- `passenger_count` (number): Number of passengers
- `timestamp` (string): ISO 8601 timestamp (optional, server time used if not provided)

**Response (Success):**
```json
{
  "success": true,
  "message": "GPS data received successfully",
  "data": {
    "telemetry_id": "uuid",
    "bus_number": "101",
    "timestamp": "2024-01-15T10:30:00Z",
    "location": {
      "latitude": 11.3410,
      "longitude": 77.7172
    }
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid GPS data",
  "code": "VALIDATION_ERROR",
  "details": ["latitude is required", "longitude must be between -180 and 180"]
}
```

### Device Status

**Endpoint:** `GET /api/hardware/status`

**Description:** Get device configuration and status information.

**Response:**
```json
{
  "success": true,
  "data": {
    "bus": {
      "id": "uuid",
      "number": "101",
      "route_id": "1",
      "status": "active"
    },
    "api_key": {
      "name": "Bus-101-GPS",
      "last_used": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "config": {
      "update_interval": 10000,
      "max_speed_limit": 80,
      "fuel_alert_threshold": 20
    }
  }
}
```

### Heartbeat

**Endpoint:** `POST /api/hardware/heartbeat`

**Description:** Send periodic heartbeat to indicate device is online.

**Request Body:**
```json
{
  "device_info": {
    "firmware_version": "1.2.3",
    "hardware_model": "GPS-TRACKER-V2",
    "signal_strength": -65
  },
  "system_status": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "storage_usage": 23.1,
    "battery_level": 89.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat received",
  "server_time": "2024-01-15T10:30:00Z",
  "next_heartbeat": "2024-01-15T10:31:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `NO_API_KEY` | API key not provided in request headers |
| `INVALID_FORMAT` | API key format is invalid (not UUID) |
| `INVALID_API_KEY` | API key not found or inactive |
| `EXPIRED_API_KEY` | API key has expired |
| `BUS_INACTIVE` | Associated bus is not active |
| `VALIDATION_ERROR` | Request data validation failed |
| `PROCESSING_ERROR` | Server error processing request |

## Sample Implementation

### Arduino/ESP32 Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";
const char* serverURL = "https://your-domain.com/api/hardware/gps";
const char* apiKey = "your-api-key-here";

void sendGPSData(float lat, float lng, float speed) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);
    
    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["latitude"] = lat;
    doc["longitude"] = lng;
    doc["speed"] = speed;
    doc["timestamp"] = getISOTimestamp();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected to WiFi");
}

void loop() {
  // Get GPS data from your GPS module
  float latitude = getGPSLatitude();
  float longitude = getGPSLongitude();
  float speed = getGPSSpeed();
  
  // Send data every 10 seconds
  sendGPSData(latitude, longitude, speed);
  delay(10000);
}
```

### Python Example

```python
import requests
import json
import time
from datetime import datetime

class BusTracker:
    def __init__(self, api_key, server_url):
        self.api_key = api_key
        self.server_url = server_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def send_gps_data(self, latitude, longitude, **kwargs):
        """Send GPS data to the server"""
        data = {
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Add optional parameters
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        
        try:
            response = requests.post(
                f"{self.server_url}/api/hardware/gps",
                headers=self.headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                print(f"✓ GPS data sent successfully: {result['message']}")
                return True
            else:
                error = response.json()
                print(f"✗ Error: {error.get('error', 'Unknown error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Network error: {e}")
            return False
    
    def send_heartbeat(self, device_info=None, system_status=None):
        """Send heartbeat to server"""
        data = {
            'device_info': device_info or {},
            'system_status': system_status or {}
        }
        
        try:
            response = requests.post(
                f"{self.server_url}/api/hardware/heartbeat",
                headers=self.headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                print("✓ Heartbeat sent successfully")
                return True
            else:
                print(f"✗ Heartbeat failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Heartbeat network error: {e}")
            return False

# Usage example
if __name__ == "__main__":
    tracker = BusTracker(
        api_key="your-api-key-here",
        server_url="https://your-domain.com"
    )
    
    # Simulate GPS tracking
    while True:
        # Get GPS data from your GPS module
        lat = 11.3410  # Replace with actual GPS reading
        lng = 77.7172  # Replace with actual GPS reading
        speed = 35.5   # Replace with actual speed reading
        
        # Send GPS data
        tracker.send_gps_data(
            latitude=lat,
            longitude=lng,
            speed=speed,
            fuel_level=75.5,
            passenger_count=23
        )
        
        # Send heartbeat every 10 updates
        if time.time() % 100 < 10:
            tracker.send_heartbeat(
                device_info={
                    'firmware_version': '1.0.0',
                    'signal_strength': -65
                },
                system_status={
                    'cpu_usage': 45.2,
                    'memory_usage': 67.8
                }
            )
        
        time.sleep(10)  # Wait 10 seconds before next update
```

## Best Practices

### 1. Update Frequency
- Send GPS updates every 10-30 seconds while moving
- Reduce frequency when stationary to save bandwidth
- Send heartbeat every 1-5 minutes

### 2. Error Handling
- Implement retry logic for failed requests
- Store data locally if network is unavailable
- Monitor API key expiration dates

### 3. Data Validation
- Validate GPS coordinates before sending
- Ensure sensor readings are within expected ranges
- Include timestamp for accurate tracking

### 4. Security
- Store API keys securely (not in plain text)
- Use HTTPS for all communications
- Rotate API keys periodically

### 5. Power Management
- Adjust update frequency based on battery level
- Use sleep modes when possible
- Monitor power consumption

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check API key is correct and active
- Verify API key is included in X-API-Key header
- Contact admin if key has expired

**400 Bad Request**
- Validate GPS coordinates are within valid ranges
- Check JSON format is correct
- Ensure required fields are included

**403 Forbidden**
- Bus may be inactive or in maintenance mode
- Contact admin to verify bus status

**500 Server Error**
- Temporary server issue, retry after delay
- Contact support if issue persists

### Testing Your Integration

Use curl to test your API integration:

```bash
# Test GPS data submission
curl -X POST https://your-domain.com/api/hardware/gps \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 11.3410,
    "longitude": 77.7172,
    "speed": 35.5,
    "fuel_level": 75.5
  }'

# Test device status
curl -X GET https://your-domain.com/api/hardware/status \
  -H "X-API-Key: your-api-key-here"

# Test heartbeat
curl -X POST https://your-domain.com/api/hardware/heartbeat \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "device_info": {"firmware_version": "1.0.0"},
    "system_status": {"battery_level": 89.5}
  }'
```

## Support

For technical support or questions about hardware integration:

1. Check this documentation first
2. Review error codes and troubleshooting section
3. Contact your system administrator
4. Provide API key name (not the actual key) and error details

---

**Note:** Keep your API keys secure and never share them in public repositories or documentation.