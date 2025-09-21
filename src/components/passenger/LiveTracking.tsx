import React, { useState, useEffect } from 'react';
import { Bell, Clock, Navigation, Smartphone } from 'lucide-react';
import { BusMap } from '../maps/BusMap';
import { Bus, BusStop, Alarm } from '../../types';
import { useBusTracking } from '../../hooks/useBusTracking';

interface LiveTrackingProps {
  selectedBus: Bus;
  fromStop: BusStop;
  toStop: BusStop;
}

// Sample bus stops for the route
const routeStops: BusStop[] = [
  { id: '1', name: 'Central Station', address: '123 Main St', latitude: 40.7128, longitude: -74.0060, routes: ['A1'] },
  { id: '2', name: 'City Hall', address: '456 Government Ave', latitude: 40.7180, longitude: -74.0000, routes: ['A1'] },
  { id: '3', name: 'Shopping Center', address: '789 Commerce St', latitude: 40.7250, longitude: -73.9950, routes: ['A1'] },
  { id: '4', name: 'University Campus', address: '321 College Ave', latitude: 40.7320, longitude: -73.9900, routes: ['A1'] },
];

export const LiveTracking: React.FC<LiveTrackingProps> = ({
  selectedBus,
  fromStop,
  toStop
}) => {
  const { buses } = useBusTracking(selectedBus.route_id);
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<Date>(new Date(Date.now() + 12 * 60 * 1000));

  // Find the current bus from real-time data
  const currentBus = buses.find(b => b.id === selectedBus.id) || selectedBus;

  // Calculate next stops and ETAs (simplified calculation)
  const getNextStops = () => {
    const currentStopIndex = routeStops.findIndex(stop => stop.id === fromStop.id);
    const destinationIndex = routeStops.findIndex(stop => stop.id === toStop.id);
    
    if (currentStopIndex === -1 || destinationIndex === -1) return [];
    
    return routeStops.slice(currentStopIndex, destinationIndex + 1).map((stop, index) => ({
      ...stop,
      eta: new Date(Date.now() + (3 + index * 4) * 60 * 1000), // Simplified ETA calculation
      isNext: index === 1,
      isDestination: stop.id === toStop.id
    }));
  };

  const nextStops = getNextStops();

  // Set up alarm
  const setAlarm = (minutesBefore: number) => {
    const alarmTime = new Date(estimatedArrival.getTime() - minutesBefore * 60 * 1000);
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      user_id: 'current_user',
      bus_id: currentBus.id,
      stop_id: toStop.id,
      notification_time: minutesBefore,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    setActiveAlarms(prev => [...prev, newAlarm]);
    
    // In a real app, this would set a system notification
    console.log(`Alarm set for ${minutesBefore} minutes before arrival`);
  };

  const removeAlarm = (alarmId: string) => {
    setActiveAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
  };

  // Lite Mode Component
  const LiteModeView = () => (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bus #{currentBus.number}</h2>
          <p className="text-gray-600">Route {currentBus.route_id}</p>
        </div>

        {/* ETA Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {Math.floor((estimatedArrival.getTime() - new Date().getTime()) / 60000)} min
          </div>
          <p className="text-sm text-gray-600">Estimated arrival at {toStop.name}</p>
        </div>

        {/* Next Stops */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-900">Next Stops:</h3>
          {nextStops.map((stop) => (
            <div key={stop.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className={`${stop.isDestination ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
                {stop.name}
              </span>
              <span className="text-sm text-gray-600">
                {Math.floor((stop.eta.getTime() - new Date().getTime()) / 60000)} min
              </span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setAlarm(5)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium"
          >
            Set 5-min Alert
          </button>
          <button
            onClick={() => setIsLiteMode(false)}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
          >
            View Map
          </button>
        </div>
      </div>
    </div>
  );

  if (isLiteMode) {
    return <LiteModeView />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Live Tracking - Bus #{currentBus.number}
            </h2>
            <p className="text-gray-600">
              From {fromStop.name} to {toStop.name}
            </p>
          </div>
          
          <button
            onClick={() => setIsLiteMode(true)}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            <Smartphone className="h-4 w-4" />
            <span>Lite Mode</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ETA</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.floor((estimatedArrival.getTime() - new Date().getTime()) / 60000)} min
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Speed</span>
              <Navigation className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentBus.speed} km/h</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Occupancy</span>
              <div className="text-blue-500">👥</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((currentBus.current_occupancy / currentBus.capacity) * 100)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <div className={`w-3 h-3 rounded-full ${
                currentBus.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{currentBus.status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <BusMap
            buses={[currentBus]}
            stops={routeStops}
            selectedBus={currentBus.id}
            center={[currentBus.latitude, currentBus.longitude]}
            zoom={15}
            height="600px"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alarms */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Arrival Alarms
            </h3>
            
            <div className="space-y-3 mb-4">
              {activeAlarms.map((alarm) => (
                <div key={alarm.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">
                    Alert {alarm.notification_time} min before arrival
                  </span>
                  <button
                    onClick={() => removeAlarm(alarm.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setAlarm(5)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700"
              >
                Set 5-min Alert
              </button>
              <button
                onClick={() => setAlarm(10)}
                className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded-lg text-sm hover:bg-blue-50"
              >
                Set 10-min Alert
              </button>
            </div>
          </div>

          {/* Next Stops */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Stops</h3>
            <div className="space-y-3">
              {nextStops.map((stop, index) => (
                <div key={stop.id} className={`p-3 rounded-lg border-2 transition-colors ${
                  stop.isNext ? 'border-blue-500 bg-blue-50' : 
                  stop.isDestination ? 'border-green-500 bg-green-50' :
                  'border-gray-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium ${
                        stop.isDestination ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {stop.name}
                        {stop.isNext && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">NEXT</span>}
                        {stop.isDestination && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">DESTINATION</span>}
                      </h4>
                      <p className="text-sm text-gray-600">{stop.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {Math.floor((stop.eta.getTime() - new Date().getTime()) / 60000)} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {stop.eta.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};