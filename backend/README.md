# Smart Bus Tracking System - Backend

A comprehensive backend system for real-time bus tracking with GPS telemetry, route management, and passenger services.

## 🚀 Features

- **Real-time GPS Tracking**: Receive and process telemetry data from bus devices
- **Route Management**: Comprehensive route and stop management system
- **ETA Calculations**: Dynamic arrival time predictions based on real-time data
- **Alert System**: Automated alerts for delays, breakdowns, and maintenance
- **Real-time Updates**: WebSocket and Supabase Realtime integration
- **Security**: JWT-based device authentication
- **Analytics**: Trip logging and performance metrics
- **Scalable Architecture**: Built with Node.js, Express, and PostgreSQL

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- PostgreSQL database (via Supabase)

## 🛠️ Installation

1. **Clone and setup**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_super_secret_jwt_key
   DEVICE_SECRET=demo-device-secret
   PORT=3001
   ```

3. **Database Setup**:
   
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy the contents of database/schema.sql and run in Supabase SQL Editor
   ```
   
   Or setup sample data programmatically:
   ```bash
   npm run setup-db
   ```

## 🚀 Usage

### Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001` with WebSocket server on port `8080`.

### Run Telemetry Simulation

```bash
# Start bus simulators
npm run simulate
```

This will simulate multiple buses sending GPS data every 10 seconds.

### Monitor Real-time Updates

```bash
# Run the real-time client example
node realtime-client.js
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/device` - Authenticate GPS device
- `POST /api/buses/register` - Register new bus device

### Telemetry
- `POST /api/telemetry` - Receive GPS data from buses (authenticated)
- `GET /api/buses/:busId/telemetry/latest` - Get latest telemetry

### Bus Management
- `GET /api/buses/active` - Get all active buses with latest positions
- `GET /api/buses/:busId/eta/:stopId` - Calculate ETA to specific stop

### Routes
- `GET /api/routes/:routeId` - Get route details with stops

### System
- `GET /health` - Health check endpoint

## 🔐 Security

### Device Authentication

1. **Register Device**:
   ```bash
   curl -X POST http://localhost:3001/api/buses/register \
     -H "Content-Type: application/json" \
     -d '{
       "number": "101",
       "license_plate": "BUS-101-NY",
       "route_id": "route-uuid",
       "driver_name": "John Doe",
       "capacity": 50,
       "device_id": "GPS-DEVICE-001"
     }'
   ```

2. **Authenticate**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/device \
     -H "Content-Type: application/json" \
     -d '{
       "device_id": "GPS-DEVICE-001",
       "secret": "demo-device-secret"
     }'
   ```

3. **Send Telemetry**:
   ```bash
   curl -X POST http://localhost:3001/api/telemetry \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "bus_id": "bus-uuid",
       "device_id": "GPS-DEVICE-001",
       "latitude": 40.7128,
       "longitude": -74.0060,
       "speed": 25.5,
       "heading": 90,
       "fuel_level": 75.5,
       "passenger_count": 23
     }'
   ```

## 📊 Real-time Integration

### Supabase Realtime (Recommended)

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to telemetry updates
const channel = supabase
  .channel('telemetry_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'telemetry'
  }, (payload) => {
    console.log('New telemetry:', payload.new);
    // Update your frontend map, ETA calculations, etc.
  })
  .subscribe();
```

### WebSocket Connection

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  // Subscribe to specific channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['telemetry', 'alerts']
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'telemetry_update') {
    // Handle real-time telemetry update
    updateBusPosition(message.data);
  }
});
```

## 🧮 ETA Calculation

The system includes sophisticated ETA calculation:

```javascript
// Get ETA for bus to specific stop
const response = await fetch('/api/buses/bus-id/eta/stop-id');
const eta = await response.json();

console.log(eta);
// {
//   "distance_km": 2.5,
//   "eta_minutes": 8,
//   "average_speed_kmh": 25,
//   "estimated_arrival": "2024-01-15T14:30:00Z"
// }
```

## 🚨 Alert System

Automatic alerts are generated for:

- **Low Fuel**: < 20% fuel level
- **Engine Overheating**: > 90°C engine temperature
- **Excessive Speed**: > 80 km/h
- **Breakdown**: Speed = 0 for extended period
- **Route Deviations**: GPS position outside route corridor

## 📈 Analytics & Monitoring

### Trip Logging
All bus trips are automatically logged with:
- Distance covered
- Average/max speed
- Fuel consumption
- Passenger count
- Delay minutes

### Performance Metrics
- On-time performance by route
- Average waiting times
- Fuel efficiency
- Passenger load factors

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `DEVICE_SECRET` | Device authentication secret | Required |
| `TELEMETRY_UPDATE_INTERVAL` | Telemetry update frequency (ms) | 10000 |
| `MAX_TELEMETRY_RECORDS` | Max telemetry records to keep | 10000 |

### Database Configuration

The system uses PostgreSQL with PostGIS extension for geospatial operations. Key tables:

- `buses` - Bus fleet information
- `routes` - Route definitions
- `bus_stops` - Stop locations
- `telemetry` - Real-time GPS data
- `alerts` - System alerts
- `trip_logs` - Historical trip data

## 🧪 Testing

### Manual Testing

1. **Start the server**: `npm run dev`
2. **Run simulator**: `npm run simulate`
3. **Monitor logs**: Check console for telemetry updates
4. **Test API**: Use curl or Postman to test endpoints
5. **Check database**: Verify data in Supabase dashboard

### Load Testing

The system is designed to handle:
- 100+ concurrent buses
- 10-second telemetry intervals
- 1000+ API requests per minute
- Real-time updates to multiple clients

## 🚀 Deployment

### Production Checklist

1. **Environment**:
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure proper CORS origins
   - Set up SSL/TLS

2. **Database**:
   - Enable connection pooling
   - Set up automated backups
   - Configure monitoring

3. **Monitoring**:
   - Set up application monitoring
   - Configure log aggregation
   - Set up alerts for system health

4. **Scaling**:
   - Use load balancer for multiple instances
   - Configure Redis for session storage
   - Set up CDN for static assets

## 📚 API Documentation

For detailed API documentation, start the server and visit:
- Swagger UI: `http://localhost:3001/docs` (if implemented)
- Health check: `http://localhost:3001/health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section below
- Review the logs for error messages
- Ensure all environment variables are set correctly

### Common Issues

1. **Authentication Errors**: Verify JWT_SECRET and DEVICE_SECRET match
2. **Database Connection**: Check Supabase credentials and network access
3. **WebSocket Issues**: Ensure port 8080 is available
4. **Telemetry Not Updating**: Verify bus IDs match database records

---

Built with ❤️ for smart city transportation solutions.