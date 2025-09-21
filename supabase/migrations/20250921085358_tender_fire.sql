-- Smart Bus Tracking System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE bus_status AS ENUM ('active', 'inactive', 'maintenance', 'breakdown');
CREATE TYPE route_status AS ENUM ('active', 'suspended', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_type AS ENUM ('delay', 'breakdown', 'route_change', 'maintenance', 'traffic');

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#2563EB',
    description TEXT,
    total_distance DECIMAL(10,2), -- in kilometers
    estimated_duration INTEGER, -- in minutes
    fare DECIMAL(8,2) DEFAULT 0.00,
    status route_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bus stops table
CREATE TABLE IF NOT EXISTS bus_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address TEXT,
    amenities JSONB DEFAULT '[]',
    accessibility_features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route stops junction table (defines stop order and timing)
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES bus_stops(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    distance_from_start DECIMAL(10,2), -- cumulative distance in km
    estimated_travel_time INTEGER, -- minutes from previous stop
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route_id, stop_order),
    UNIQUE(route_id, stop_id)
);

-- Buses table
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(20) UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    capacity INTEGER DEFAULT 50,
    current_occupancy INTEGER DEFAULT 0,
    fuel_capacity DECIMAL(8,2) DEFAULT 100.00,
    fuel_level DECIMAL(5,2) DEFAULT 100.00,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    status bus_status DEFAULT 'inactive',
    device_id VARCHAR(100) UNIQUE, -- GPS device identifier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= capacity),
    CONSTRAINT valid_fuel_level CHECK (fuel_level >= 0 AND fuel_level <= 100)
);

-- Telemetry table (GPS and sensor data)
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2) DEFAULT 0.00, -- km/h
    heading DECIMAL(5,2) DEFAULT 0.00, -- degrees (0-360)
    altitude DECIMAL(8,2), -- meters above sea level
    accuracy DECIMAL(8,2), -- GPS accuracy in meters
    fuel_level DECIMAL(5,2),
    engine_temperature DECIMAL(5,2),
    door_status JSONB DEFAULT '{"front": false, "rear": false}',
    passenger_count INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_coordinates CHECK (
        latitude >= -90 AND latitude <= 90 AND 
        longitude >= -180 AND longitude <= 180
    ),
    CONSTRAINT valid_heading CHECK (heading >= 0 AND heading < 360)
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type alert_type NOT NULL,
    severity alert_severity DEFAULT 'medium',
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip logs table (for analytics)
CREATE TABLE IF NOT EXISTS trip_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    start_location POINT,
    end_location POINT,
    total_distance DECIMAL(10,2),
    average_speed DECIMAL(5,2),
    max_speed DECIMAL(5,2),
    fuel_consumed DECIMAL(8,2),
    passenger_count INTEGER DEFAULT 0,
    delays_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User alarms table (passenger notifications)
CREATE TABLE IF NOT EXISTS user_alarms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Would reference auth.users in production
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES bus_stops(id) ON DELETE CASCADE,
    notification_minutes INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    phone_number VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_bus_id_timestamp ON telemetry(bus_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_location ON telemetry(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_buses_route_id ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_alerts_bus_id ON alerts(bus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved, created_at DESC) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_trip_logs_bus_route ON trip_logs(bus_id, route_id, start_time DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alarms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic public read access for demo)
-- In production, you'd want more restrictive policies

-- Public read access for routes and stops
CREATE POLICY "Public read access for routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read access for bus_stops" ON bus_stops FOR SELECT USING (true);
CREATE POLICY "Public read access for route_stops" ON route_stops FOR SELECT USING (true);

-- Public read access for buses and telemetry
CREATE POLICY "Public read access for buses" ON buses FOR SELECT USING (true);
CREATE POLICY "Public read access for telemetry" ON telemetry FOR SELECT USING (true);

-- Admin write access (you'd implement proper auth in production)
CREATE POLICY "Service role full access buses" ON buses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access telemetry" ON telemetry FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access alerts" ON alerts FOR ALL USING (auth.role() = 'service_role');

-- Functions for common operations

-- Function to update bus location and status
CREATE OR REPLACE FUNCTION update_bus_from_telemetry()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE buses 
    SET 
        current_occupancy = COALESCE(NEW.passenger_count, current_occupancy),
        fuel_level = COALESCE(NEW.fuel_level, fuel_level),
        status = CASE 
            WHEN NEW.speed > 0 THEN 'active'::bus_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.bus_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bus data when telemetry is inserted
CREATE TRIGGER trigger_update_bus_from_telemetry
    AFTER INSERT ON telemetry
    FOR EACH ROW
    EXECUTE FUNCTION update_bus_from_telemetry();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Sample data insertion
INSERT INTO routes (name, code, color, total_distance, estimated_duration, fare) VALUES
('Downtown Express', 'A1', '#2563EB', 15.5, 45, 2.50),
('University Loop', 'B2', '#059669', 12.3, 35, 2.00),
('Airport Shuttle', 'C3', '#DC2626', 25.8, 60, 5.00),
('Shopping Circuit', 'D4', '#7C3AED', 8.7, 25, 1.50);

INSERT INTO bus_stops (name, code, latitude, longitude, address) VALUES
('Central Station', 'CS01', 40.7128, -74.0060, '123 Main Street, Downtown'),
('University Campus', 'UC01', 40.7589, -73.9851, '456 College Avenue'),
('Shopping Mall', 'SM01', 40.7505, -73.9934, '789 Commerce Boulevard'),
('Airport Terminal', 'AT01', 40.6892, -74.1745, '321 Sky Way'),
('City Hospital', 'CH01', 40.7831, -73.9712, '654 Health Street'),
('Tech District', 'TD01', 40.7282, -74.0776, '987 Innovation Drive');

INSERT INTO buses (number, license_plate, route_id, driver_name, capacity, device_id) VALUES
('101', 'BUS-101-NY', (SELECT id FROM routes WHERE code = 'A1'), 'John Smith', 50, 'GPS-DEVICE-001'),
('102', 'BUS-102-NY', (SELECT id FROM routes WHERE code = 'A1'), 'Jane Doe', 50, 'GPS-DEVICE-002'),
('201', 'BUS-201-NY', (SELECT id FROM routes WHERE code = 'B2'), 'Mike Johnson', 45, 'GPS-DEVICE-003'),
('301', 'BUS-301-NY', (SELECT id FROM routes WHERE code = 'C3'), 'Sarah Wilson', 60, 'GPS-DEVICE-004');

-- Create route-stop relationships
INSERT INTO route_stops (route_id, stop_id, stop_order, distance_from_start, estimated_travel_time) VALUES
-- Route A1 stops
((SELECT id FROM routes WHERE code = 'A1'), (SELECT id FROM bus_stops WHERE code = 'CS01'), 1, 0.0, 0),
((SELECT id FROM routes WHERE code = 'A1'), (SELECT id FROM bus_stops WHERE code = 'TD01'), 2, 3.2, 8),
((SELECT id FROM routes WHERE code = 'A1'), (SELECT id FROM bus_stops WHERE code = 'SM01'), 3, 7.8, 12),
((SELECT id FROM routes WHERE code = 'A1'), (SELECT id FROM bus_stops WHERE code = 'UC01'), 4, 12.1, 15),

-- Route B2 stops
((SELECT id FROM routes WHERE code = 'B2'), (SELECT id FROM bus_stops WHERE code = 'UC01'), 1, 0.0, 0),
((SELECT id FROM routes WHERE code = 'B2'), (SELECT id FROM bus_stops WHERE code = 'CH01'), 2, 4.5, 10),
((SELECT id FROM routes WHERE code = 'B2'), (SELECT id FROM bus_stops WHERE code = 'CS01'), 3, 8.9, 8);

COMMENT ON TABLE routes IS 'Bus routes with basic information and fare details';
COMMENT ON TABLE buses IS 'Individual bus vehicles with current status and capacity';
COMMENT ON TABLE telemetry IS 'Real-time GPS and sensor data from buses';
COMMENT ON TABLE bus_stops IS 'Physical bus stop locations and amenities';
COMMENT ON TABLE route_stops IS 'Junction table defining which stops belong to which routes and their order';
COMMENT ON TABLE alerts IS 'System alerts for delays, breakdowns, and other incidents';
COMMENT ON TABLE trip_logs IS 'Historical trip data for analytics and reporting';