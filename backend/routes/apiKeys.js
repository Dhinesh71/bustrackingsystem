/**
 * API Key Management Routes
 * Admin endpoints for managing hardware API keys
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // For demo purposes, we'll use a simple check
    // In production, implement proper admin authentication
    if (token !== process.env.ADMIN_TOKEN && token !== 'admin-demo-token') {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * POST /api/admin/api-keys
 * Generate new API key for hardware device
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { bus_id, key_name, expires_in_days } = req.body;

    if (!bus_id || !key_name) {
      return res.status(400).json({ 
        error: 'bus_id and key_name are required' 
      });
    }

    // Verify bus exists
    const { data: bus, error: busError } = await supabase
      .from('buses')
      .select('id, number')
      .eq('id', bus_id)
      .single();

    if (busError || !bus) {
      return res.status(404).json({ 
        error: 'Bus not found' 
      });
    }

    // Generate API key
    const apiKey = uuidv4();
    const expiresAt = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    // Insert API key
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .insert([{
        api_key: apiKey,
        key_name,
        bus_id,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
        usage_count: 0
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        id: keyData.id,
        api_key: apiKey,
        key_name: keyData.key_name,
        bus_id: keyData.bus_id,
        bus_number: bus.number,
        expires_at: keyData.expires_at,
        created_at: keyData.created_at
      },
      integration_info: {
        endpoint: `${req.protocol}://${req.get('host')}/api/hardware/gps`,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        sample_payload: {
          latitude: 11.3410,
          longitude: 77.7172,
          speed: 35.5,
          heading: 90,
          fuel_level: 75.5,
          passenger_count: 23
        }
      }
    });

  } catch (error) {
    console.error('API key generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate API key',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/api-keys
 * List all API keys
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        key_name,
        bus_id,
        is_active,
        usage_count,
        last_used,
        created_at,
        expires_at,
        buses (
          number,
          route_id,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: keys.map(key => ({
        ...key,
        api_key: '***hidden***' // Don't expose actual keys
      }))
    });

  } catch (error) {
    console.error('API keys list error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch API keys',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/api-keys/:id/toggle
 * Activate/deactivate API key
 */
router.put('/:id/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: currentKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('is_active, key_name')
      .eq('id', id)
      .single();

    if (fetchError || !currentKey) {
      return res.status(404).json({ 
        error: 'API key not found' 
      });
    }

    // Toggle status
    const { data: updatedKey, error } = await supabase
      .from('api_keys')
      .update({ is_active: !currentKey.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `API key ${updatedKey.is_active ? 'activated' : 'deactivated'}`,
      data: {
        id: updatedKey.id,
        key_name: updatedKey.key_name,
        is_active: updatedKey.is_active
      }
    });

  } catch (error) {
    console.error('API key toggle error:', error);
    res.status(500).json({ 
      error: 'Failed to toggle API key',
      details: error.message
    });
  }
});

/**
 * DELETE /api/admin/api-keys/:id
 * Delete API key
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('API key deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete API key',
      details: error.message
    });
  }
});

module.exports = router;