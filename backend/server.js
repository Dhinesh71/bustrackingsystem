/**
 * Smart Bus Tracking System - Main Server
 * Handles telemetry data, real-time updates, and API endpoints
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const cron = require('node-cron');

// Import new route handlers
const hardwareRoutes = require('./routes/hardware');
const apiKeyRoutes = require('./routes/apiKeys');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Validation schemas
const telemetrySchema = Joi.object({
  bus_id: Joi.string().uuid().required(),
  device_id: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0).max(200).default(0),
  heading: Joi.number().min(0).max(360).default(0),
  altitude: Joi.number().optional(),
  accuracy: Joi.number().min(0).optional(),
  fuel_level: Joi.number().min(0).max(100).optional(),
  engine_temperature: Joi.number().optional(),
  door_status: Joi.object({
    front: Joi.boolean().default(false),
    rear: Joi.boolean().default(false)
  }).optional(),
  passenger_count: Joi.number().min(0).optional(),
  timestamp: Joi.date().iso().optional()
});

const busRegistrationSchema = Joi.object({
  number: Joi.string().required(),
  license_plate: Joi.string().required(),
  route_id: Joi.string().uuid().required(),
  driver_name: Joi.string().required(),
  driver_phone: Joi.string().optional(),
  capacity: Joi.number().min(1).max(200).default(50),
  device_id: Joi.string().required()
});

// JWT Authentication middleware
const authenticateDevice = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify device exists in database
    const { data: bus, error } = await supabase
      .from('buses')
      .select('id, number, device_id, status')
      .eq('device_id', decoded.device_id)
      .single();

    if (error || !bus) {
      return res.status(401).json({ 
        error: 'Invalid device credentials',
        code: 'INVALID_DEVICE'
      });
    }

    req.bus = bus;
    req.device = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// ETA Calculation utility
class ETACalculator {
  static async calculateETA(busId, targetStopId) {
    try {
      // Get latest telemetry for the bus
      const { data: telemetry, error: telemetryError } = await supabase
        .from('telemetry')
        .select('latitude, longitude, speed')
        .eq('bus_id', busId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (telemetryError || !telemetry) {
        throw new Error('No telemetry data available');
      }

      // Get target stop coordinates
      const { data: stop, error: stopError } = await supabase
        .from('bus_stops')
        .select('latitude, longitude')
        .eq('id', targetStopId)
        .single();

      if (stopError || !stop) {
        throw new Error('Stop not found');
      }

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        telemetry.latitude, telemetry.longitude,
        stop.latitude, stop.longitude
      );

      // Get average speed for the route (fallback to current speed)
      const currentSpeed = telemetry.speed || 25; // Default 25 km/h
      const averageSpeed = await this.getRouteAverageSpeed(busId) || currentSpeed;

      // Calculate ETA in minutes
      const etaMinutes = (distance / averageSpeed) * 60;
      
      // Add buffer time for stops and traffic (20% buffer)
      const bufferedETA = etaMinutes * 1.2;

      return {
        distance_km: Math.round(distance * 100) / 100,
        eta_minutes: Math.round(bufferedETA),
        average_speed_kmh: averageSpeed,
        estimated_arrival: new Date(Date.now() + bufferedETA * 60 * 1000)
      };
    } catch (error) {
      console.error('ETA calculation error:', error);
      throw error;
    }
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static async getRouteAverageSpeed(busId) {
    try {
      const { data, error } = await supabase
        .from('telemetry')
        .select('speed')
        .eq('bus_id', busId)
        .gt('speed', 0)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        return null;
      }

      const totalSpeed = data.reduce((sum, record) => sum + record.speed, 0);
      return totalSpeed / data.length;
    } catch (error) {
      console.error('Error calculating average speed:', error);
      return null;
    }
  }
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Device authentication endpoint
app.post('/api/auth/device', async (req, res) => {
  try {
    const { device_id, secret } = req.body;

    if (!device_id || !secret) {
      return res.status(400).json({ 
        error: 'Device ID and secret are required' 
      });
    }

    // In production, verify device credentials against a secure store
    // For demo purposes, we'll use a simple check
    if (secret !== process.env.DEVICE_SECRET && secret !== 'demo-device-secret') {
      return res.status(401).json({ 
        error: 'Invalid device credentials' 
      });
    }

    // Verify device exists in database
    const { data: bus, error } = await supabase
      .from('buses')
      .select('id, number, device_id')
      .eq('device_id', device_id)
      .single();

    if (error || !bus) {
      return res.status(404).json({ 
        error: 'Device not registered' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        device_id,
        bus_id: bus.id,
        bus_number: bus.number
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ 
      token,
      bus: {
        id: bus.id,
        number: bus.number
      },
      expires_in: process.env.JWT_EXPIRES_IN || '24h'
    });
  } catch (error) {
    console.error('Device authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Register new bus device
app.post('/api/buses/register', async (req, res) => {
  try {
    const { error: validationError, value } = busRegistrationSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const { data: bus, error } = await supabase
      .from('buses')
      .insert([value])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          error: 'Bus number or device ID already exists' 
        });
      }
      throw error;
    }

    res.status(201).json({ 
      message: 'Bus registered successfully',
      bus: {
        id: bus.id,
        number: bus.number,
        device_id: bus.device_id
      }
    });
  } catch (error) {
    console.error('Bus registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Receive telemetry data from buses
app.post('/api/telemetry', authenticateDevice, async (req, res) => {
  try {
    const { error: validationError, value } = telemetrySchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ 
        error: 'Invalid telemetry data',
        details: validationError.details.map(d => d.message)
      });
    }

    // Ensure bus_id matches authenticated device
    if (value.bus_id !== req.bus.id) {
      return res.status(403).json({ 
        error: 'Bus ID mismatch' 
      });
    }

    // Insert telemetry data
    const { data: telemetry, error } = await supabase
      .from('telemetry')
      .insert([{
        ...value,
        timestamp: value.timestamp || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Check for alerts (low fuel, high temperature, etc.)
    await checkAndCreateAlerts(telemetry);

    // Clean up old telemetry data (keep last 7 days)
    await cleanupOldTelemetry();

    res.status(201).json({ 
      message: 'Telemetry data received successfully',
      id: telemetry.id,
      timestamp: telemetry.timestamp
    });
  } catch (error) {
    console.error('Telemetry processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process telemetry data',
      details: error.message
    });
  }
});

// Get latest telemetry for a bus
app.get('/api/buses/:busId/telemetry/latest', async (req, res) => {
  try {
    const { busId } = req.params;

    const { data, error } = await supabase
      .from('telemetry')
      .select('*')
      .eq('bus_id', busId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'No telemetry data found for this bus' 
        });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ 
      error: 'Failed to fetch telemetry data',
      details: error.message
    });
  }
});

// Get ETA for a bus to a specific stop
app.get('/api/buses/:busId/eta/:stopId', async (req, res) => {
  try {
    const { busId, stopId } = req.params;

    const eta = await ETACalculator.calculateETA(busId, stopId);
    
    res.json({
      bus_id: busId,
      stop_id: stopId,
      ...eta
    });
  } catch (error) {
    console.error('ETA calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate ETA',
      details: error.message
    });
  }
});

// Get all active buses with latest telemetry
app.get('/api/buses/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buses')
      .select(`
        *,
        routes (name, code, color),
        telemetry (
          latitude, longitude, speed, heading, 
          fuel_level, passenger_count, timestamp
        )
      `)
      .eq('status', 'active')
      .order('telemetry.timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    // Get only the latest telemetry for each bus
    const busesWithLatestTelemetry = data.map(bus => ({
      ...bus,
      latest_telemetry: bus.telemetry?.[0] || null,
      telemetry: undefined
    }));

    res.json(busesWithLatestTelemetry);
  } catch (error) {
    console.error('Error fetching active buses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active buses',
      details: error.message
    });
  }
});

// Get route information with stops
app.get('/api/routes/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;

    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops (
          stop_order,
          distance_from_start,
          estimated_travel_time,
          bus_stops (*)
        )
      `)
      .eq('id', routeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Route not found' 
        });
      }
      throw error;
    }

    // Sort stops by order
    data.route_stops.sort((a, b) => a.stop_order - b.stop_order);

    res.json(data);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch route data',
      details: error.message
    });
  }
});

// Hardware integration routes
app.use('/api/hardware', hardwareRoutes);

// API key management routes (admin only)
app.use('/api/admin/api-keys', apiKeyRoutes);

// Utility functions

async function checkAndCreateAlerts(telemetry) {
  try {
    const alerts = [];

    // Low fuel alert
    if (telemetry.fuel_level && telemetry.fuel_level < 20) {
      alerts.push({
        type: 'maintenance',
        severity: telemetry.fuel_level < 10 ? 'high' : 'medium',
        bus_id: telemetry.bus_id,
        title: 'Low Fuel Level',
        message: `Bus fuel level is at ${telemetry.fuel_level}%`,
        location_lat: telemetry.latitude,
        location_lng: telemetry.longitude
      });
    }

    // High engine temperature alert
    if (telemetry.engine_temperature && telemetry.engine_temperature > 90) {
      alerts.push({
        type: 'breakdown',
        severity: telemetry.engine_temperature > 100 ? 'critical' : 'high',
        bus_id: telemetry.bus_id,
        title: 'High Engine Temperature',
        message: `Engine temperature is ${telemetry.engine_temperature}°C`,
        location_lat: telemetry.latitude,
        location_lng: telemetry.longitude
      });
    }

    // Speed alerts (too fast or stopped for too long)
    if (telemetry.speed > 80) {
      alerts.push({
        type: 'traffic',
        severity: 'medium',
        bus_id: telemetry.bus_id,
        title: 'Excessive Speed',
        message: `Bus is traveling at ${telemetry.speed} km/h`,
        location_lat: telemetry.latitude,
        location_lng: telemetry.longitude
      });
    }

    // Insert alerts if any
    if (alerts.length > 0) {
      const { error } = await supabase
        .from('alerts')
        .insert(alerts);

      if (error) {
        console.error('Error creating alerts:', error);
      } else {
        console.log(`Created ${alerts.length} alerts for bus ${telemetry.bus_id}`);
      }
    }
  } catch (error) {
    console.error('Error in alert checking:', error);
  }
}

async function cleanupOldTelemetry() {
  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const { error } = await supabase
      .from('telemetry')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up old telemetry:', error);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Scheduled cleanup job (runs daily at 2 AM)
cron.schedule('0 2 * * *', () => {
  console.log('Running daily cleanup...');
  cleanupOldTelemetry();
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      // Handle subscription requests
      if (data.type === 'subscribe') {
        ws.subscriptions = data.channels || [];
        ws.send(JSON.stringify({
          type: 'subscription_success',
          channels: ws.subscriptions
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Broadcast telemetry updates to WebSocket clients
function broadcastTelemetryUpdate(telemetry) {
  const message = JSON.stringify({
    type: 'telemetry_update',
    data: telemetry
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!client.subscriptions || 
          client.subscriptions.includes('telemetry') || 
          client.subscriptions.includes(`bus_${telemetry.bus_id}`)) {
        client.send(message);
      }
    }
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚌 Smart Bus Tracking Server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port 8080`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Supabase URL: ${process.env.SUPABASE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});