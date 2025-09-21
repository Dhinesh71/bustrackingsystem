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
        name: 'Boothapadi - Mpnmjec Route',
        code: '1',
        color: '#2563EB',
        description: 'Daily route from Boothapadi to Mpnmjec College via Erode Bus Stand',
        total_distance: 25.2,
        estimated_duration: 130,
        fare: 15.00,
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
        name: 'Boothapadi',
        code: 'BP01',
        latitude: 11.3410,
        longitude: 77.7172,
        address: 'Boothapadi, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Poonachi',
        code: 'PN01',
        latitude: 11.3420,
        longitude: 77.7180,
        address: 'Poonachi, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements']
      },
      {
        name: 'Chithar',
        code: 'CH01',
        latitude: 11.3430,
        longitude: 77.7190,
        address: 'Chithar, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Bhavani BS',
        code: 'BB01',
        latitude: 11.4448,
        longitude: 77.6882,
        address: 'Bhavani Bus Stand, Erode District',
        amenities: ['shelter', 'bench', 'digital_display', 'ticket_counter'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements']
      },
      {
        name: 'Kalingarayanpalayam',
        code: 'KP01',
        latitude: 11.4500,
        longitude: 77.6900,
        address: 'Kalingarayanpalayam, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Lakshminagar',
        code: 'LN01',
        latitude: 11.4520,
        longitude: 77.6920,
        address: 'Lakshminagar, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements']
      },
      {
        name: 'R.N.pudhur',
        code: 'RN01',
        latitude: 11.4600,
        longitude: 77.7000,
        address: 'R.N.pudhur, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Agraharam',
        code: 'AG01',
        latitude: 11.4650,
        longitude: 77.7050,
        address: 'Agraharam, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Erode BS',
        code: 'EB01',
        latitude: 11.3410,
        longitude: 77.7172,
        address: 'Erode Bus Stand, Erode District',
        amenities: ['shelter', 'bench', 'digital_display', 'ticket_counter', 'waiting_room'],
        accessibility_features: ['wheelchair_ramp', 'audio_announcements', 'braille_signage']
      },
      {
        name: 'Savitha & G.H',
        code: 'SG01',
        latitude: 11.3420,
        longitude: 77.7180,
        address: 'Savitha & G.H, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Diesel Shed',
        code: 'DS01',
        latitude: 11.3430,
        longitude: 77.7190,
        address: 'Diesel Shed, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'ITI & K.K.Nagar',
        code: 'IK01',
        latitude: 11.3440,
        longitude: 77.7200,
        address: 'ITI & K.K.Nagar, Erode District',
        amenities: ['shelter', 'bench'],
        accessibility_features: ['wheelchair_ramp']
      },
      {
        name: 'Mpnmjec',
        code: 'MP01',
        latitude: 11.3450,
        longitude: 77.7210,
        address: 'Mpnmjec College, Erode District',
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

    // Route 1 (Boothapadi - Mpnmjec)
    const route1 = this.routes.find(r => r.code === '1');
    const route1Stops = [
      { code: 'BP01', order: 1, distance: 0.0, time: 0 },    // Boothapadi 7:10
      { code: 'PN01', order: 2, distance: 2.5, time: 10 },  // Poonachi 7:20
      { code: 'CH01', order: 3, distance: 5.0, time: 20 },  // Chithar 7:30
      { code: 'BB01', order: 4, distance: 8.5, time: 30 },  // Bhavani BS 7:40
      { code: 'KP01', order: 5, distance: 12.0, time: 40 }, // Kalingarayanpalayam 7:50
      { code: 'LN01', order: 6, distance: 14.0, time: 45 }, // Lakshminagar 7:55
      { code: 'RN01', order: 7, distance: 18.0, time: 60 }, // R.N.pudhur 8:10
      { code: 'AG01', order: 8, distance: 19.5, time: 65 }, // Agraharam 8:15
      { code: 'EB01', order: 9, distance: 22.0, time: 80 }, // Erode BS 8:30
      { code: 'SG01', order: 10, distance: 22.5, time: 85 }, // Savitha & G.H 8:35
      { code: 'DS01', order: 11, distance: 23.0, time: 90 }, // Diesel Shed 8:40
      { code: 'IK01', order: 12, distance: 23.5, time: 95 }, // ITI & K.K.Nagar 8:45
      { code: 'MP01', order: 13, distance: 25.2, time: 130 } // Mpnmjec 9:20
    ];

    for (const stop of route1Stops) {
      const busStop = this.stops.find(s => s.code === stop.code);
      if (busStop) {
        routeStopsData.push({
          route_id: route1.id,
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
        number: '1',
        license_plate: 'TN-32-BUS-001',
        route_id: this.routes.find(r => r.code === '1').id,
        driver_name: 'Raman Kumar',
        driver_phone: '+91-9876543210',
        capacity: 45,
        current_occupancy: 0,
        fuel_capacity: 180.00,
        fuel_level: 85.5,
        last_maintenance_date: '2024-12-01',
        next_maintenance_date: '2024-03-01',
        status: 'active',
        device_id: 'GPS-DEVICE-001'
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

    // Create schedule for bus number 1
    const bus1 = this.buses.find(b => b.number === '1');

    if (bus1) {
      // Morning schedule - Boothapadi to Mpnmjec (7:10 AM - 9:20 AM)
      schedulesData.push({
        route_id: bus1.route_id,
        bus_id: bus1.id,
        departure_time: '07:10:00',
        arrival_time: '09:20:00',
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        effective_date: '2025-01-01',
        expiry_date: '2025-12-31',
        is_active: true
      });

      // Return trip schedule (if needed)
      schedulesData.push({
        route_id: bus1.route_id,
        bus_id: bus1.id,
        departure_time: '16:00:00',
        arrival_time: '18:10:00',
        days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
        effective_date: '2025-01-01',
        expiry_date: '2025-12-31',
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