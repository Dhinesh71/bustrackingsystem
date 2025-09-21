/**
 * Smart Bus Tracking System - Real-time Client Example
 * Demonstrates how to subscribe to live telemetry updates
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class RealtimeClient {
  constructor() {
    this.subscriptions = new Map();
    this.wsConnection = null;
  }

  // Method 1: Using Supabase Realtime (Recommended)
  async subscribeToSupabaseRealtime() {
    console.log('🔄 Setting up Supabase Realtime subscriptions...');

    // Subscribe to telemetry updates
    const telemetryChannel = supabase
      .channel('telemetry_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'telemetry'
      }, (payload) => {
        this.handleTelemetryUpdate(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'buses'
      }, (payload) => {
        this.handleBusUpdate(payload.new);
      })
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        this.handleNewAlert(payload.new);
      })
      .subscribe();

    this.subscriptions.set('telemetry', telemetryChannel);
    this.subscriptions.set('alerts', alertsChannel);

    console.log('✅ Supabase Realtime subscriptions active');
  }

  // Method 2: Using WebSocket connection to backend
  connectToWebSocket() {
    console.log('🔄 Connecting to WebSocket server...');

    this.wsConnection = new WebSocket('ws://localhost:8080');

    this.wsConnection.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Subscribe to specific channels
      this.wsConnection.send(JSON.stringify({
        type: 'subscribe',
        channels: ['telemetry', 'alerts', 'bus_updates']
      }));
    });

    this.wsConnection.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });

    this.wsConnection.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        this.connectToWebSocket();
      }, 5000);
    });

    this.wsConnection.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  // Handle different types of real-time updates
  handleTelemetryUpdate(telemetry) {
    console.log(`📡 New telemetry from Bus ${telemetry.bus_id}:`);
    console.log(`   Location: ${telemetry.latitude}, ${telemetry.longitude}`);
    console.log(`   Speed: ${telemetry.speed} km/h`);
    console.log(`   Fuel: ${telemetry.fuel_level}%`);
    console.log(`   Passengers: ${telemetry.passenger_count || 'N/A'}`);
    console.log(`   Timestamp: ${telemetry.timestamp}`);
    console.log('---');

    // Example: Update frontend map
    this.updateMapMarker(telemetry);
    
    // Example: Check for ETA updates
    this.updateETACalculations(telemetry);
    
    // Example: Trigger passenger notifications
    this.checkPassengerAlarms(telemetry);
  }

  handleBusUpdate(bus) {
    console.log(`🚌 Bus ${bus.number} status updated:`);
    console.log(`   Status: ${bus.status}`);
    console.log(`   Occupancy: ${bus.current_occupancy}/${bus.capacity}`);
    console.log(`   Fuel Level: ${bus.fuel_level}%`);
    console.log('---');

    // Example: Update bus status in UI
    this.updateBusStatus(bus);
  }

  handleNewAlert(alert) {
    console.log(`🚨 NEW ALERT - ${alert.severity.toUpperCase()}:`);
    console.log(`   Type: ${alert.type}`);
    console.log(`   Title: ${alert.title}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Bus ID: ${alert.bus_id}`);
    console.log('---');

    // Example: Send push notification
    this.sendPushNotification(alert);
    
    // Example: Update admin dashboard
    this.updateAdminDashboard(alert);
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'telemetry_update':
        this.handleTelemetryUpdate(message.data);
        break;
      case 'bus_update':
        this.handleBusUpdate(message.data);
        break;
      case 'alert':
        this.handleNewAlert(message.data);
        break;
      case 'subscription_success':
        console.log('✅ WebSocket subscriptions confirmed:', message.channels);
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  // Example integration methods (implement based on your frontend)
  updateMapMarker(telemetry) {
    // Example: Update bus position on map
    // This would integrate with your frontend mapping library
    console.log(`🗺️  Updating map marker for bus ${telemetry.bus_id}`);
    
    // Pseudo-code for frontend integration:
    /*
    if (window.mapInstance) {
      window.mapInstance.updateBusMarker(telemetry.bus_id, {
        lat: telemetry.latitude,
        lng: telemetry.longitude,
        heading: telemetry.heading,
        speed: telemetry.speed
      });
    }
    */
  }

  updateETACalculations(telemetry) {
    // Example: Recalculate ETAs for affected routes
    console.log(`⏱️  Updating ETA calculations for bus ${telemetry.bus_id}`);
    
    // This could trigger ETA recalculation for all stops on the route
    // and update passenger-facing displays
  }

  checkPassengerAlarms(telemetry) {
    // Example: Check if any passengers have alarms for this bus
    console.log(`🔔 Checking passenger alarms for bus ${telemetry.bus_id}`);
    
    // This would query user_alarms table and send notifications
    // when buses are approaching passenger's desired stops
  }

  updateBusStatus(bus) {
    // Example: Update bus status in admin dashboard
    console.log(`📊 Updating dashboard for bus ${bus.number}`);
  }

  sendPushNotification(alert) {
    // Example: Send push notification for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      console.log(`📱 Sending push notification for ${alert.severity} alert`);
      
      // Integrate with push notification service (FCM, APNs, etc.)
      /*
      pushNotificationService.send({
        title: alert.title,
        body: alert.message,
        data: {
          alert_id: alert.id,
          bus_id: alert.bus_id,
          type: alert.type
        }
      });
      */
    }
  }

  updateAdminDashboard(alert) {
    // Example: Update admin dashboard with new alert
    console.log(`📈 Updating admin dashboard with new alert`);
    
    // This could update real-time metrics, alert counters, etc.
  }

  // Method to get historical data for context
  async getHistoricalContext(busId, minutes = 30) {
    try {
      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .eq('bus_id', busId)
        .gte('timestamp', new Date(Date.now() - minutes * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      console.log(`📊 Retrieved ${data.length} historical records for bus ${busId}`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      return [];
    }
  }

  // Method to query current system status
  async getSystemStatus() {
    try {
      // Get active buses count
      const { data: activeBuses, error: busError } = await supabase
        .from('buses')
        .select('id')
        .eq('status', 'active');

      // Get unresolved alerts count
      const { data: alerts, error: alertError } = await supabase
        .from('alerts')
        .select('id, severity')
        .eq('is_resolved', false);

      // Get recent telemetry count (last hour)
      const { data: recentTelemetry, error: telemetryError } = await supabase
        .from('telemetry')
        .select('id')
        .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (busError || alertError || telemetryError) {
        throw new Error('Error fetching system status');
      }

      const status = {
        active_buses: activeBuses?.length || 0,
        unresolved_alerts: alerts?.length || 0,
        critical_alerts: alerts?.filter(a => a.severity === 'critical').length || 0,
        recent_telemetry_updates: recentTelemetry?.length || 0,
        timestamp: new Date().toISOString()
      };

      console.log('📊 System Status:', status);
      return status;
    } catch (error) {
      console.error('❌ Error fetching system status:', error);
      return null;
    }
  }

  // Cleanup method
  async disconnect() {
    console.log('🔄 Disconnecting from real-time services...');

    // Unsubscribe from Supabase channels
    for (const [name, channel] of this.subscriptions) {
      await supabase.removeChannel(channel);
      console.log(`✅ Unsubscribed from ${name}`);
    }
    this.subscriptions.clear();

    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    console.log('✅ Disconnected from all real-time services');
  }
}

// Example usage
async function main() {
  const client = new RealtimeClient();

  // Method 1: Use Supabase Realtime (recommended for production)
  await client.subscribeToSupabaseRealtime();

  // Method 2: Use WebSocket (alternative approach)
  // client.connectToWebSocket();

  // Get initial system status
  await client.getSystemStatus();

  // Example: Get historical context for a specific bus
  // await client.getHistoricalContext('some-bus-id', 30);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down real-time client...');
    await client.disconnect();
    process.exit(0);
  });

  console.log('✅ Real-time client is running. Press Ctrl+C to stop.');
  console.log('📡 Listening for telemetry updates, bus status changes, and alerts...');
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Real-time client failed:', error);
    process.exit(1);
  });
}

module.exports = RealtimeClient;