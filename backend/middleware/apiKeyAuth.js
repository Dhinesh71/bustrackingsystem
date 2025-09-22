/**
 * API Key Authentication Middleware for Hardware Devices
 * Validates API keys for GPS hardware integration
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to authenticate API keys from hardware devices
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        code: 'NO_API_KEY',
        message: 'Please provide an API key in the X-API-Key header or Authorization header'
      });
    }

    // Validate API key format (should be UUID format)
    const apiKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!apiKeyRegex.test(apiKey)) {
      return res.status(401).json({ 
        error: 'Invalid API key format',
        code: 'INVALID_FORMAT'
      });
    }

    // Check if API key exists and is active
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        key_name,
        bus_id,
        is_active,
        last_used,
        created_at,
        expires_at,
        buses (
          id,
          number,
          route_id,
          status
        )
      `)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !keyData) {
      return res.status(401).json({ 
        error: 'Invalid or inactive API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if API key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({ 
        error: 'API key has expired',
        code: 'EXPIRED_API_KEY'
      });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ 
        last_used: new Date().toISOString(),
        usage_count: supabase.raw('usage_count + 1')
      })
      .eq('id', keyData.id);

    // Attach API key info to request
    req.apiKey = keyData;
    req.bus = keyData.buses;
    
    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

module.exports = { authenticateApiKey };