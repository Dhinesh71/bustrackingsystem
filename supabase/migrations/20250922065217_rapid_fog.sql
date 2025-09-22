/*
  # API Key Management System

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `api_key` (text, unique) - The actual API key
      - `key_name` (text) - Human readable name for the key
      - `bus_id` (uuid, foreign key) - Associated bus
      - `is_active` (boolean) - Whether the key is active
      - `usage_count` (integer) - Number of times used
      - `last_used` (timestamptz) - Last usage timestamp
      - `expires_at` (timestamptz) - Expiration date (optional)
      - `created_at` (timestamptz) - Creation timestamp

    - `device_heartbeats`
      - `id` (uuid, primary key)
      - `api_key_id` (uuid, foreign key)
      - `bus_id` (uuid, foreign key)
      - `device_info` (jsonb) - Device information
      - `system_status` (jsonb) - System status data
      - `timestamp` (timestamptz)

    - `hardware_config`
      - `id` (uuid, primary key)
      - `bus_id` (uuid, foreign key)
      - `update_interval` (integer) - GPS update interval in ms
      - `max_speed_limit` (integer) - Speed limit for alerts
      - `fuel_alert_threshold` (integer) - Fuel level alert threshold
      - `config_data` (jsonb) - Additional configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for API key access
    - Add indexes for performance

  3. Functions
    - Function to generate API keys
    - Function to validate API key format
*/

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text UNIQUE NOT NULL,
  key_name text NOT NULL,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create device heartbeats table
CREATE TABLE IF NOT EXISTS device_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
  device_info jsonb DEFAULT '{}',
  system_status jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

-- Create hardware configuration table
CREATE TABLE IF NOT EXISTS hardware_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid UNIQUE REFERENCES buses(id) ON DELETE CASCADE,
  update_interval integer DEFAULT 10000,
  max_speed_limit integer DEFAULT 80,
  fuel_alert_threshold integer DEFAULT 20,
  config_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_bus_id ON api_keys(bus_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_bus_id ON device_heartbeats(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_timestamp ON device_heartbeats(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Service role full access api_keys"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for device_heartbeats
CREATE POLICY "Service role full access device_heartbeats"
  ON device_heartbeats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for hardware_config
CREATE POLICY "Service role full access hardware_config"
  ON hardware_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to validate API key format
CREATE OR REPLACE FUNCTION validate_api_key_format(key_value text)
RETURNS boolean AS $$
BEGIN
  -- Check if the key is a valid UUID format
  RETURN key_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
BEGIN
  RETURN gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hardware_config_updated_at
  BEFORE UPDATE ON hardware_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default hardware configuration for existing buses
INSERT INTO hardware_config (bus_id, update_interval, max_speed_limit, fuel_alert_threshold)
SELECT id, 10000, 80, 20
FROM buses
WHERE id NOT IN (SELECT bus_id FROM hardware_config WHERE bus_id IS NOT NULL)
ON CONFLICT (bus_id) DO NOTHING;