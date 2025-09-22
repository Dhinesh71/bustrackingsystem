#!/usr/bin/env python3
"""
Smart Bus Tracking System - Python Hardware Integration
For Raspberry Pi or other Python-capable hardware
"""

import requests
import json
import time
import random
from datetime import datetime
import logging

# Configuration - UPDATE THESE VALUES
SERVER_URL = "http://localhost:3001"  # Change to your server URL
API_KEY = "your-generated-api-key-here"  # Get from admin panel
UPDATE_INTERVAL = 10  # seconds

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BusTracker:
    def __init__(self, api_key, server_url):
        self.api_key = api_key
        self.server_url = server_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
        
        # Simulate initial position (replace with actual GPS)
        self.latitude = 11.3410
        self.longitude = 77.7172
        self.fuel_level = 100.0
        
    def test_connection(self):
        """Test API connection"""
        try:
            response = requests.get(
                f"{self.server_url}/api/hardware/status",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("✓ API Connection successful")
                data = response.json()
                logger.info(f"Connected to bus: {data['data']['bus']['number']}")
                return True
            else:
                logger.error(f"✗ API Connection failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Connection error: {e}")
            return False
    
    def read_gps_data(self):
        """Read GPS data (simulate for demo)"""
        # In real implementation, read from GPS module
        # For demo, simulate movement
        self.latitude += random.uniform(-0.0001, 0.0001)
        self.longitude += random.uniform(-0.0001, 0.0001)
        
        return {
            'latitude': round(self.latitude, 6),
            'longitude': round(self.longitude, 6),
            'speed': random.uniform(20, 60),
            'heading': random.uniform(0, 360),
            'altitude': random.uniform(10, 100),
            'accuracy': random.uniform(3, 10)
        }
    
    def read_sensor_data(self):
        """Read sensor data (simulate for demo)"""
        # Simulate fuel consumption
        self.fuel_level = max(0, self.fuel_level - 0.01)
        
        return {
            'fuel_level': round(self.fuel_level, 1),
            'engine_temperature': random.uniform(70, 90),
            'passenger_count': random.randint(0, 45),
            'door_status': {
                'front': random.choice([True, False]),
                'rear': random.choice([True, False])
            }
        }
    
    def send_telemetry(self):
        """Send GPS and sensor data to server"""
        try:
            # Collect all data
            gps_data = self.read_gps_data()
            sensor_data = self.read_sensor_data()
            
            # Combine data
            telemetry_data = {
                **gps_data,
                **sensor_data,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
            # Send to server
            response = requests.post(
                f"{self.server_url}/api/hardware/gps",
                headers=self.headers,
                json=telemetry_data,
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"✓ Telemetry sent - {result['message']}")
                logger.info(f"  Location: {gps_data['latitude']}, {gps_data['longitude']}")
                logger.info(f"  Speed: {gps_data['speed']:.1f} km/h, Passengers: {sensor_data['passenger_count']}")
                return True
            else:
                error_data = response.json()
                logger.error(f"✗ Telemetry failed: {error_data.get('error', 'Unknown error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Network error: {e}")
            return False
        except Exception as e:
            logger.error(f"✗ Unexpected error: {e}")
            return False
    
    def send_heartbeat(self):
        """Send heartbeat to server"""
        try:
            heartbeat_data = {
                'device_info': {
                    'firmware_version': '1.0.0',
                    'hardware_model': 'RaspberryPi-GPS',
                    'signal_strength': random.randint(-80, -30)
                },
                'system_status': {
                    'cpu_usage': random.uniform(20, 80),
                    'memory_usage': random.uniform(30, 70),
                    'storage_usage': random.uniform(10, 50),
                    'battery_level': random.uniform(70, 100)
                }
            }
            
            response = requests.post(
                f"{self.server_url}/api/hardware/heartbeat",
                headers=self.headers,
                json=heartbeat_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("✓ Heartbeat sent successfully")
                return True
            else:
                logger.error(f"✗ Heartbeat failed: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Heartbeat network error: {e}")
            return False
    
    def run(self):
        """Main tracking loop"""
        logger.info("🚌 Starting Bus Tracker...")
        
        # Test connection first
        if not self.test_connection():
            logger.error("❌ Cannot start - API connection failed")
            return
        
        logger.info(f"✅ Tracker started - sending updates every {UPDATE_INTERVAL}s")
        
        update_count = 0
        
        try:
            while True:
                # Send telemetry data
                self.send_telemetry()
                
                # Send heartbeat every 10 updates
                update_count += 1
                if update_count >= 10:
                    self.send_heartbeat()
                    update_count = 0
                
                # Wait for next update
                time.sleep(UPDATE_INTERVAL)
                
        except KeyboardInterrupt:
            logger.info("🛑 Tracker stopped by user")
        except Exception as e:
            logger.error(f"❌ Tracker error: {e}")

def main():
    # Initialize tracker
    tracker = BusTracker(API_KEY, SERVER_URL)
    
    # Run tracking
    tracker.run()

if __name__ == "__main__":
    main()