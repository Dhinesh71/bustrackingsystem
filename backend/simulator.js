/**
 * Smart Bus Tracking System - Telemetry Simulator
 * Generates realistic GPS and sensor data for testing
 */

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

class BusSimulator {
  constructor(config) {
    this.busId = config.busId;
    this.deviceId = config.deviceId;
    this.routeId = config.routeId;
    this.busNumber = config.busNumber;
    this.apiUrl = config.apiUrl || 'http://localhost:3001';
    this.updateInterval = config.updateInterval || 10000; // 10 seconds
    
    // Route configuration (predefined path)
    this.route = config.route || this.getDefaultRoute();
    this.currentRouteIndex = 0;
    this.direction = 1; // 1 for forward, -1 for backward
    
    // Bus state
    this.currentLocation = this.route[0];
    this.speed = 0;
    this.heading = 0;
    this.fuelLevel = 85 + Math.random() * 15; // 85-100%
    this.engineTemp = 70 + Math.random() * 10; // 70-80°C
    this.passengerCount = Math.floor(Math.random() * 20); // 0-20 passengers initially
    this.doorStatus = { front: false, rear: false };
    
    // Authentication
    this.authToken = null;
    this.isRunning = false;
  }

  getDefaultRoute() {
    // Default route around Manhattan (simplified)
    return [
      { lat: 40.7128, lng: -74.0060, name: "Central Station" },
      { lat: 40.7282, lng: -74.0776, name: "Tech District" },
      { lat: 40.7505, lng: -73.9934, name: "Shopping Mall" },
      { lat: 40.7589, lng: -73.9851, name: "University Campus" },
      { lat: 40.7831, lng: -73.9712, name: "City Hospital" },
      { lat: 40.7589, lng: -73.9851, name: "University Campus" },
      { lat: 40.7505, lng: -73.9934, name: "Shopping Mall" },
      { lat: 40.7282, lng: -74.0776, name: "Tech District" }
    ];
  }

  async authenticate() {
    try {
      console.log(`🔐 Authenticating device ${this.deviceId}...`);
      
      const response = await axios.post(`${this.apiUrl}/api/auth/device`, {
        device_id: this.deviceId,
        secret: process.env.DEVICE_SECRET || 'demo-device-secret'
      });

      this.authToken = response.data.token;
      console.log(`✅ Authentication successful for bus ${this.busNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Authentication failed for bus ${this.busNumber}:`, 
        error.response?.data?.error || error.message);
      return false;
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  calculateHeading(lat1, lng1, lat2, lng2) {
    const dLng = this.toRadians(lng2 - lng1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    let heading = Math.atan2(y, x);
    heading = (heading * 180 / Math.PI + 360) % 360;
    
    return heading;
  }

  updateLocation() {
    const currentPoint = this.route[this.currentRouteIndex];
    const nextIndex = this.currentRouteIndex + this.direction;
    
    // Check if we need to reverse direction
    if (nextIndex >= this.route.length || nextIndex < 0) {
      this.direction *= -1;
      this.currentRouteIndex += this.direction;
    } else {
      this.currentRouteIndex = nextIndex;
    }

    const targetPoint = this.route[this.currentRouteIndex];
    
    // Calculate movement towards target
    const distance = this.calculateDistance(
      this.currentLocation.lat, this.currentLocation.lng,
      targetPoint.lat, targetPoint.lng
    );

    // Simulate realistic movement (small steps towards target)
    const stepSize = 0.0005; // Approximately 50 meters
    const latDiff = targetPoint.lat - this.currentLocation.lat;
    const lngDiff = targetPoint.lng - this.currentLocation.lng;
    
    const totalDiff = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    if (totalDiff > stepSize) {
      // Move towards target
      this.currentLocation.lat += (latDiff / totalDiff) * stepSize;
      this.currentLocation.lng += (lngDiff / totalDiff) * stepSize;
      
      // Calculate speed and heading
      this.speed = 20 + Math.random() * 30; // 20-50 km/h
      this.heading = this.calculateHeading(
        this.currentLocation.lat, this.currentLocation.lng,
        targetPoint.lat, targetPoint.lng
      );
    } else {
      // Arrived at stop - simulate stop behavior
      this.currentLocation = { ...targetPoint };
      this.speed = 0;
      this.simulateStopBehavior();
    }

    // Add some random variation to make it more realistic
    this.currentLocation.lat += (Math.random() - 0.5) * 0.0001;
    this.currentLocation.lng += (Math.random() - 0.5) * 0.0001;
  }

  simulateStopBehavior() {
    // Simulate passenger boarding/alighting
    const passengerChange = Math.floor((Math.random() - 0.5) * 10); // -5 to +5
    this.passengerCount = Math.max(0, Math.min(50, this.passengerCount + passengerChange));
    
    // Open doors at stops
    this.doorStatus = { front: true, rear: true };
    
    // Close doors after a short delay (simulated)
    setTimeout(() => {
      this.doorStatus = { front: false, rear: false };
    }, 2000);
  }

  updateSensorData() {
    // Simulate fuel consumption
    this.fuelLevel -= 0.01 + Math.random() * 0.02; // 0.01-0.03% per update
    this.fuelLevel = Math.max(0, this.fuelLevel);
    
    // Simulate engine temperature variation
    const tempVariation = (Math.random() - 0.5) * 2; // -1 to +1 degree
    this.engineTemp += tempVariation;
    this.engineTemp = Math.max(60, Math.min(110, this.engineTemp));
    
    // Simulate random events
    if (Math.random() < 0.001) { // 0.1% chance
      this.simulateRandomEvent();
    }
  }

  simulateRandomEvent() {
    const events = ['breakdown', 'traffic', 'fuel_low', 'overheating'];
    const event = events[Math.floor(Math.random() * events.length)];
    
    switch (event) {
      case 'breakdown':
        this.speed = 0;
        console.log(`🚨 Bus ${this.busNumber}: Simulating breakdown`);
        break;
      case 'traffic':
        this.speed *= 0.3; // Reduce speed significantly
        console.log(`🚦 Bus ${this.busNumber}: Simulating traffic jam`);
        break;
      case 'fuel_low':
        this.fuelLevel = Math.min(this.fuelLevel, 15);
        console.log(`⛽ Bus ${this.busNumber}: Simulating low fuel`);
        break;
      case 'overheating':
        this.engineTemp = Math.max(this.engineTemp, 95);
        console.log(`🌡️ Bus ${this.busNumber}: Simulating engine overheating`);
        break;
    }
  }

  generateTelemetryData() {
    return {
      bus_id: this.busId,
      device_id: this.deviceId,
      latitude: Math.round(this.currentLocation.lat * 100000) / 100000,
      longitude: Math.round(this.currentLocation.lng * 100000) / 100000,
      speed: Math.round(this.speed * 10) / 10,
      heading: Math.round(this.heading * 10) / 10,
      altitude: 10 + Math.random() * 50, // 10-60 meters
      accuracy: 3 + Math.random() * 7, // 3-10 meters GPS accuracy
      fuel_level: Math.round(this.fuelLevel * 10) / 10,
      engine_temperature: Math.round(this.engineTemp * 10) / 10,
      door_status: this.doorStatus,
      passenger_count: this.passengerCount,
      timestamp: new Date().toISOString()
    };
  }

  async sendTelemetry() {
    try {
      const telemetryData = this.generateTelemetryData();
      
      const response = await axios.post(
        `${this.apiUrl}/api/telemetry`,
        telemetryData,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`📡 Bus ${this.busNumber}: Telemetry sent successfully - ` +
        `Lat: ${telemetryData.latitude}, Lng: ${telemetryData.longitude}, ` +
        `Speed: ${telemetryData.speed} km/h, Passengers: ${telemetryData.passenger_count}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Bus ${this.busNumber}: Failed to send telemetry:`, 
        error.response?.data?.error || error.message);
      
      // Try to re-authenticate if token expired
      if (error.response?.status === 401) {
        console.log(`🔄 Bus ${this.busNumber}: Re-authenticating...`);
        await this.authenticate();
      }
      
      return false;
    }
  }

  async start() {
    console.log(`🚌 Starting simulator for Bus ${this.busNumber} (${this.deviceId})`);
    
    // Authenticate first
    const authenticated = await this.authenticate();
    if (!authenticated) {
      console.error(`❌ Cannot start simulator for Bus ${this.busNumber}: Authentication failed`);
      return;
    }

    this.isRunning = true;
    
    // Main simulation loop
    const simulationLoop = async () => {
      if (!this.isRunning) return;
      
      try {
        // Update bus state
        this.updateLocation();
        this.updateSensorData();
        
        // Send telemetry
        await this.sendTelemetry();
        
        // Schedule next update
        setTimeout(simulationLoop, this.updateInterval);
      } catch (error) {
        console.error(`❌ Bus ${this.busNumber}: Simulation error:`, error.message);
        setTimeout(simulationLoop, this.updateInterval * 2); // Retry with longer delay
      }
    };

    // Start the simulation loop
    simulationLoop();
    
    console.log(`✅ Bus ${this.busNumber}: Simulator started, sending updates every ${this.updateInterval/1000}s`);
  }

  stop() {
    this.isRunning = false;
    console.log(`🛑 Bus ${this.busNumber}: Simulator stopped`);
  }
}

// Multi-bus simulation manager
class SimulationManager {
  constructor() {
    this.simulators = [];
  }

  addBus(config) {
    const simulator = new BusSimulator(config);
    this.simulators.push(simulator);
    return simulator;
  }

  async startAll() {
    console.log(`🚀 Starting ${this.simulators.length} bus simulators...`);
    
    for (const simulator of this.simulators) {
      await simulator.start();
      // Stagger the starts to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ All simulators started successfully`);
  }

  stopAll() {
    console.log(`🛑 Stopping all simulators...`);
    this.simulators.forEach(simulator => simulator.stop());
    this.simulators = [];
  }
}

// Main execution
async function main() {
  const manager = new SimulationManager();

  // Configure buses (these should match your database entries)
  const busConfigs = [
    {
      busId: '00000000-0000-0000-0000-000000000001', // Replace with actual UUIDs from your database
      deviceId: 'GPS-DEVICE-001',
      busNumber: '101',
      routeId: 'A1',
      updateInterval: 10000,
      route: [
        { lat: 40.7128, lng: -74.0060, name: "Central Station" },
        { lat: 40.7282, lng: -74.0776, name: "Tech District" },
        { lat: 40.7505, lng: -73.9934, name: "Shopping Mall" },
        { lat: 40.7589, lng: -73.9851, name: "University Campus" }
      ]
    },
    {
      busId: '00000000-0000-0000-0000-000000000002',
      deviceId: 'GPS-DEVICE-002',
      busNumber: '102',
      routeId: 'A1',
      updateInterval: 12000,
      route: [
        { lat: 40.7589, lng: -73.9851, name: "University Campus" },
        { lat: 40.7831, lng: -73.9712, name: "City Hospital" },
        { lat: 40.7128, lng: -74.0060, name: "Central Station" },
        { lat: 40.7282, lng: -74.0776, name: "Tech District" }
      ]
    },
    {
      busId: '00000000-0000-0000-0000-000000000003',
      deviceId: 'GPS-DEVICE-003',
      busNumber: '201',
      routeId: 'B2',
      updateInterval: 15000,
      route: [
        { lat: 40.7589, lng: -73.9851, name: "University Campus" },
        { lat: 40.7831, lng: -73.9712, name: "City Hospital" },
        { lat: 40.7128, lng: -74.0060, name: "Central Station" }
      ]
    }
  ];

  // Add buses to manager
  busConfigs.forEach(config => {
    manager.addBus(config);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping all simulators...');
    manager.stopAll();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping all simulators...');
    manager.stopAll();
    process.exit(0);
  });

  // Start simulation
  try {
    await manager.startAll();
    
    console.log('\n📊 Simulation Status:');
    console.log('- Press Ctrl+C to stop all simulators');
    console.log('- Check your backend logs for telemetry data');
    console.log('- Monitor the database for real-time updates');
    
  } catch (error) {
    console.error('❌ Failed to start simulation:', error.message);
    process.exit(1);
  }
}

// Run the simulation if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  });
}

module.exports = { BusSimulator, SimulationManager };