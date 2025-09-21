/**
 * Smart Bus Tracking System - Database Setup Script
 * Initializes the database with sample data for testing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DatabaseSetup {
  constructor() {
    this.routes = [];
    this.stops = [];
    this.buses = [];
  }

  async setupSampleData() {
    console.log('🚀 Setting up sample data for Smart Bus Tracking System...');

    try {
      // Clear existing data (optional - comment out for production)
      await this.clearExistingData();

      // Insert sample data
      await this.insertRoutes();
      await this.insertBusStops();
      await this.insertRouteStops();
      await this.insertBuses();
      await this.insertSchedules();

      console.log('✅ Database setup completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   Routes: ${this.routes.length}`);
      console.log(`   Bus Stops: ${this.stops.length}`);
      console.log(`   Buses: ${this.buses.length}`);
      console.log('\n🔧 Next steps:');
      console.log('   1. Update simulator.js with the actual bus IDs from the database');
      console.log('   2. Start the backend server: npm start');
      console.log('   3. Run the simulator: npm run simulate');

    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');

    const tables = ['telemetry', 'trip_logs', 'alerts', 'user_alarms', 'schedules', 'route_stops', 'buses', 'bus_stops', 'routes'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        console.warn(`⚠️  Warning clearing ${table}:`, error.message);
      }
    }

    console.log('✅ Existing data cleared');
  }

  async insertRoutes() {
    console.log('🛣️  Inserting routes...');

    const routesData = [
      {
        name: 'Downtown Express',
        code: 'A1',
        color: '#2563EB',
        description: 'Express service connecting downtown area with major business districts',
        total_distance: 15.5,
        estimated_duration: 45,
        fare: 2.50,
        status: 'active'
      },
      {
        name: 'University Loop',
        code: 'B2',
        color: '#059669',
        description: 'Circular route serving university campus and surrounding areas',
        total_distance: 12.3,
        estimated_duration: 35,
        fare: 2.00,
        status: 'active'
      },
      {
        name: 'Airport Shuttle',
        code: 'C3',
        color: '#DC2626',
        description: 'Direct service between city center and airport terminal',
        total_distance: 25.8,
        estimated_duration: 60,
        fare: 5.00,
        status: 'active'
      },
      {
        name: 'Shopping Circuit',
        code: 'D4',
        color: '#7C3AED',
        description: 'Connects major shopping centers and retail districts',
        total_distance: 8.7,
        estimated_duration: 25,
        fare: 1.50,
        status: 'active'
      }
    ];

    const { data, error } = await supabase
      .from('routes')
      .insert(routesData)
      .select();

    if (error) throw error;

    this.routes = data;
    console.log(`✅ Inserted ${data.length} routes`);
  }

  async insertBusStops() {
    console.log('🚏 Inserting bus stops...');

    const stopsData = [
      {
        name: 'Central Station',
        code: 'CS01',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main Street, Downtown',
        amenities: ['shelter', 'bench', 'digital_display', 'wheelchair_accessible'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements', 'braille_signage']
      },
      {
        name: 'University Campus',
        code: 'UC01',
        latitude: 40.7589,
        longitude: -73.9851,
        address: '456 College Avenue',
        amenities: ['shelter', 'bench', 'digital_display', 'bike_rack'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements']
      },
      {
        name: 'Shopping Mall',
        code: 'SM01',
        latitude: 40.7505,
        longitude: -73.9934,
        address: '789 Commerce Boulevard',
        amenities: ['shelter', 'bench', 'digital_display', 'parking'],
        accessibility_features: ['wheelchair_ramp', 'tactile_paving']
      },
      {
        name: 'Airport Terminal',
        code: 'AT01',
        latitude: 40.6892,
        longitude: -74.1745,
        address: '321 Sky Way',
        amenities: ['shelter', 'bench', 'digital_display', 'luggage_storage', 'wifi'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements', 'braille_signage', 'elevator_access']
      },
      {
        name: 'City Hospital',
        code: 'CH01',
        latitude: 40.7831,
        longitude: -73.9712,
        address: '654 Health Street',
        amenities: ['shelter', 'bench', 'digital_display', 'emergency_phone'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements', 'priority_seating']
      },
      {
        name: 'Tech District',
        code: 'TD01',
        latitude: 40.7282,
        longitude: -74.0776,
        address: '987 Innovation Drive',
        amenities: ['shelter', 'bench', 'digital_display', 'bike_rack', 'wifi'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements']
      },
      {
        name: 'Sports Complex',
        code: 'SC01',
        latitude: 40.7400,
        longitude: -73.9900,
        address: '555 Athletic Way',
        amenities: ['shelter', 'bench', 'digital_display', 'large_capacity'],
        accessibility_features: ['wheelchair_ramp', 'wide_platform']
      },
      {
        name: 'Residential Plaza',
        code: 'RP01',
        latitude: 40.7650,
        longitude: -73.9800,
        address: '222 Community Street',
        amenities: ['shelter', 'bench', 'lighting'],
        accessibility_features: ['wheelchair_ramp']
      }
    ];

    const { data, error } = await supabase
      .from('bus_stops')
      .insert(stopsData)
      .select();

    if (error) throw error;

    this.stops = data;
    console.log(`✅ Inserted ${data.length} bus stops`);
  }

  async insertRouteStops() {
    console.log('🔗 Inserting route-stop relationships...');

    const routeStopsData = [];

    // Route A1 (Downtown Express)
    const routeA1 = this.routes.find(r => r.code === 'A1');
    const a1Stops = [
      { code: 'CS01', order: 1, distance: 0.0, time: 0 },
      { code: 'TD01', order: 2, distance: 3.2, time: 8 },
      { code: 'SM01', order: 3, distance: 7.8, time: 12 },
      { code: 'UC01', order: 4, distance: 12.1, time: 15 },
      { code: 'SC01', order: 5, distance: 15.5, time: 18 }
    ];

    for (const stop of a1Stops) {
      const busStop = this.stops.find(s => s.code === stop.code);
      if (busStop) {
        routeStopsData.push({
          route_id: routeA1.id,
          stop_id: busStop.id,
          stop_order: stop.order,
          distance_from_start: stop.distance,
          estimated_travel_time: stop.time
        });
      }
    }

    // Route B2 (University Loop)
    const routeB2 = this.routes.find(r => r.code === 'B2');
    const b2Stops = [
      { code: 'UC01', order: 1, distance: 0.0, time: 0 },
      { code: 'CH01', order: 2, distance: 4.5, time: 10 },
      { code: 'RP01', order: 3, distance: 7.2, time: 15 },
      { code: 'CS01', order: 4, distance: 12.3, time: 25 }
    ];

    for (const stop of b2Stops) {
      const busStop = this.stops.find(s => s.code === stop.code);
      if (busStop) {
        routeStopsData.push({
          route_id: routeB2.id,
          stop_id: busStop.id,
          stop_order: stop.order,
          distance_from_start: stop.distance,
          estimated_travel_time: stop.time
        });
      }
    }

    // Route C3 (Airport Shuttle)
    const routeC3 = this.routes.find(r => r.code === 'C3');
    const c3Stops = [
      { code: 'CS01', order: 1, distance: 0.0, time: 0 },
      { code: 'SM01', order: 2, distance: 8.5, time: 15 },
      { code: 'AT01', order: 3, distance: 25.8, time: 45 }
    ];

    for (const stop of c3Stops) {
      const busStop = this.stops.find(s => s.code === stop.code);
      if (busStop) {
        routeStopsData.push({
          route_id: routeC3.id,
          stop_id: busStop.id,
          stop_order: stop.order,
          distance_from_start: stop.distance,
          estimated_travel_time: stop.time
        });
      }
    }

    const { data, error } = await supabase
      .from('route_stops')
      .insert(routeStopsData)
      .select();

    if (error) throw error;

    console.log(`✅ Inserted ${data.length} route-stop relationships`);
  }

  async insertBuses() {
    console.log('🚌 Inserting buses...');

    const busesData = [
      {
        number: '101',
        license_plate: 'BUS-101-NY',
        route_id: this.routes.find(r => r.code === 'A1').id,
        driver_name: 'John Smith',
        driver_phone: '+1-555-0101',
        capacity: 50,
        current_occupancy: 0,
        fuel_capacity: 200.00,
        fuel_level: 85.5,
        last_maintenance_date: '2024-01-15',
        next_maintenance_date: '2024-04-15',
        status: 'active',
        device_id: 'GPS-DEVICE-001'
      },
      {
        number: '102',
        license_plate: 'BUS-102-NY',
        route_id: this.routes.find(r => r.code === 'A1').id,
        driver_name: 'Jane Doe',
        driver_phone: '+1-555-0102',
        capacity: 50,
        current_occupancy: 0,
        fuel_capacity: 200.00,
        fuel_level: 92.3,
        last_maintenance_date: '2024-01-20',
        next_maintenance_date: '2024-04-20',
        status: 'active',
        device_id: 'GPS-DEVICE-002'
      },
      {
        number: '201',
        license_plate: 'BUS-201-NY',
        route_id: this.routes.find(r => r.code === 'B2').id,
        driver_name: 'Mike Johnson',
        driver_phone: '+1-555-0201',
        capacity: 45,
        current_occupancy: 0,
        fuel_capacity: 180.00,
        fuel_level: 78.9,
        last_maintenance_date: '2024-01-10',
        next_maintenance_date: '2024-04-10',
        status: 'active',
        device_id: 'GPS-DEVICE-003'
      },
      {
        number: '301',
        license_plate: 'BUS-301-NY',
        route_id: this.routes.find(r => r.code === 'C3').id,
        driver_name: 'Sarah Wilson',
        driver_phone: '+1-555-0301',
        capacity: 60,
        current_occupancy: 0,
        fuel_capacity: 250.00,
        fuel_level: 95.1,
        last_maintenance_date: '2024-01-25',
        next_maintenance_date: '2024-04-25',
        status: 'active',
        device_id: 'GPS-DEVICE-004'
      },
      {
        number: '401',
        license_plate: 'BUS-401-NY',
        route_id: this.routes.find(r => r.code === 'D4').id,
        driver_name: 'David Brown',
        driver_phone: '+1-555-0401',
        capacity: 40,
        current_occupancy: 0,
        fuel_capacity: 160.00,
        fuel_level: 67.8,
        last_maintenance_date: '2024-01-05',
        next_maintenance_date: '2024-04-05',
        status: 'maintenance',
        device_id: 'GPS-DEVICE-005'
      }
    ];

    const { data, error } = await supabase
      .from('buses')
      .insert(busesData)
      .select();

    if (error) throw error;

    this.buses = data;
    console.log(`✅ Inserted ${data.length} buses`);

    // Print bus IDs for simulator configuration
    console.log('\n📋 Bus IDs for simulator configuration:');
    this.buses.forEach(bus => {
      console.log(`   Bus ${bus.number} (${bus.device_id}): ${bus.id}`);
    });
  }

  async insertSchedules() {
    console.log('📅 Inserting schedules...');

    const schedulesData = [];

    // Create schedules for each active bus
    const activeBuses = this.buses.filter(b => b.status === 'active');

    for (const bus of activeBuses) {
      // Morning schedule
      schedulesData.push({
        route_id: bus.route_id,
        bus_id: bus.id,
        departure_time: '06:00:00',
        arrival_time: '07:00:00',
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        is_active: true
      });

      // Afternoon schedule
      schedulesData.push({
        route_id: bus.route_id,
        bus_id: bus.id,
        departure_time: '14:00:00',
        arrival_time: '15:00:00',
        days_of_week: [1, 2, 3, 4, 5, 6, 7], // All days
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        is_active: true
      });

      // Evening schedule
      schedulesData.push({
        route_id: bus.route_id,
        bus_id: bus.id,
        departure_time: '18:30:00',
        arrival_time: '19:30:00',
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        is_active: true
      });
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert(schedulesData)
      .select();

    if (error) throw error;

    console.log(`✅ Inserted ${data.length} schedules`);
  }

  async verifySetup() {
    console.log('🔍 Verifying database setup...');

    const tables = ['routes', 'bus_stops', 'route_stops', 'buses', 'schedules'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Error verifying ${table}:`, error);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    }
  }
}

// Main execution
async function main() {
  try {
    const setup = new DatabaseSetup();
    await setup.setupSampleData();
    await setup.verifySetup();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Configuration notes:');
    console.log('   - Update the bus IDs in simulator.js with the actual UUIDs printed above');
    console.log('   - Make sure your .env file has the correct Supabase credentials');
    console.log('   - The DEVICE_SECRET should match between .env and simulator');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = DatabaseSetup;