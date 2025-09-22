/**
 * Hardware Integration Routes
 * API endpoints for GPS hardware devices
 */

const express = require('express');
const Joi = require('joi');
const { createClient } = require('@supabase/supabase-js');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validation schemas
const gpsDataSchema = Joi.object({
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

/**
 * POST /api/hardware/gps
 * Receive GPS coordinates from hardware devices
 */
router.post('/gps', authenticateApiKey, async (req, res) => {
  try {
    // Validate GPS data
    const { error: validationError, value } = gpsDataSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ 
        error: 'Invalid GPS data',
        details: validationError.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    // Ensure bus is active
    if (req.bus.status !== 'active') {
      return res.status(403).json({ 
        error: 'Bus is not active',
        code: 'BUS_INACTIVE',
        bus_status: req.bus.status
      });
    }

    // Insert telemetry data
    const telemetryData = {
      bus_id: req.bus.id,
      device_id: req.apiKey.key_name,
      ...value,
      timestamp: value.timestamp || new Date().toISOString()
    };

    const { data: telemetry, error } = await supabase
      .from('telemetry')
      .insert([telemetryData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update bus location and status
    const busUpdateData = {
      latitude: value.latitude,
      longitude: value.longitude,
      speed: value.speed || 0,
      heading: value.heading || 0,
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (value.fuel_level !== undefined) {
      busUpdateData.fuel_level = value.fuel_level;
    }
    if (value.passenger_count !== undefined) {
      busUpdateData.current_occupancy = value.passenger_count;
    }

    await supabase
      .from('buses')
      .update(busUpdateData)
      .eq('id', req.bus.id);

    // Check for alerts (low fuel, high temperature, etc.)
    await checkAndCreateAlerts(telemetry);

    res.status(201).json({ 
      success: true,
      message: 'GPS data received successfully',
      data: {
        telemetry_id: telemetry.id,
        bus_number: req.bus.number,
        timestamp: telemetry.timestamp,
        location: {
          latitude: telemetry.latitude,
          longitude: telemetry.longitude
        }
      }
    });

  } catch (error) {
    console.error('GPS data processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process GPS data',
      code: 'PROCESSING_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/hardware/status
 * Get hardware device status and configuration
 */
router.get('/status', authenticateApiKey, async (req, res) => {
  try {
    const { data: config, error } = await supabase
      .from('hardware_config')
      .select('*')
      .eq('bus_id', req.bus.id)
      .single();

    res.json({
      success: true,
      data: {
        bus: {
          id: req.bus.id,
          number: req.bus.number,
          route_id: req.bus.route_id,
          status: req.bus.status
        },
        api_key: {
          name: req.apiKey.key_name,
          last_used: req.apiKey.last_used,
          created_at: req.apiKey.created_at
        },
        config: config || {
          update_interval: 10000,
          max_speed_limit: 80,
          fuel_alert_threshold: 20
        }
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * POST /api/hardware/heartbeat
 * Simple heartbeat endpoint for device health monitoring
 */
router.post('/heartbeat', authenticateApiKey, async (req, res) => {
  try {
    const { device_info, system_status } = req.body;

    // Log heartbeat
    await supabase
      .from('device_heartbeats')
      .insert([{
        api_key_id: req.apiKey.id,
        bus_id: req.bus.id,
        device_info: device_info || {},
        system_status: system_status || {},
        timestamp: new Date().toISOString()
      }]);

    res.json({
      success: true,
      message: 'Heartbeat received',
      server_time: new Date().toISOString(),
      next_heartbeat: new Date(Date.now() + 60000).toISOString() // 1 minute
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ 
      error: 'Heartbeat failed',
      code: 'HEARTBEAT_ERROR'
    });
  }
});

// Alert checking function
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

    // Speed alerts
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
      await supabase.from('alerts').insert(alerts);
    }
  } catch (error) {
    console.error('Error creating alerts:', error);
  }
}

module.exports = router;