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
  { id: '1', name: 'Boothapadi', address: 'Boothapadi, Erode District', latitude: 11.3410, longitude: 77.7172, routes: ['1'] },
  { id: '2', name: 'Poonachi', address: 'Poonachi, Erode District', latitude: 11.3420, longitude: 77.7180, routes: ['1'] },
  { id: '3', name: 'Chithar', address: 'Chithar, Erode District', latitude: 11.3430, longitude: 77.7190, routes: ['1'] },
  { id: '4', name: 'Bhavani BS', address: 'Bhavani Bus Stand, Erode District', latitude: 11.4448, longitude: 77.6882, routes: ['1'] },
  { id: '5', name: 'Kalingarayanpalayam', address: 'Kalingarayanpalayam, Erode District', latitude: 11.4500, longitude: 77.6900, routes: ['1'] },
  { id: '6', name: 'Lakshminagar', address: 'Lakshminagar, Erode District', latitude: 11.4520, longitude: 77.6920, routes: ['1'] },
  { id: '7', name: 'R.N.pudhur', address: 'R.N.pudhur, Erode District', latitude: 11.4600, longitude: 77.7000, routes: ['1'] },
  { id: '8', name: 'Agraharam', address: 'Agraharam, Erode District', latitude: 11.4650, longitude: 77.7050, routes: ['1'] },
  { id: '9', name: 'Erode BS', address: 'Erode Bus Stand, Erode District', latitude: 11.3410, longitude: 77.7172, routes: ['1'] },
  { id: '10', name: 'Savitha & G.H', address: 'Savitha & G.H, Erode District', latitude: 11.3420, longitude: 77.7180, routes: ['1'] },
  { id: '11', name: 'Diesel Shed', address: 'Diesel Shed, Erode District', latitude: 11.3430, longitude: 77.7190, routes: ['1'] },
  { id: '12', name: 'Kasipalayam', address: 'Kasipalayam, Erode District', latitude: 11.3435, longitude: 77.7195, routes: ['1'] },
  { id: '13', name: 'ITI', address: 'ITI, Erode District', latitude: 11.3440, longitude: 77.7200, routes: ['1'] },
  { id: '14', name: 'KK Nagar', address: 'KK Nagar, Erode District', latitude: 11.3445, longitude: 77.7205, routes: ['1'] },
  { id: '15', name: 'Mpnmjec', address: 'Mpnmjec College, Erode District', latitude: 11.3450, longitude: 77.7210, routes: ['1'] },
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
    
    // Schedule times for each stop (7:10 AM start)
    const scheduleTimes = [
      '07:10', // Boothapadi
      '07:20', // Poonachi
      '07:30', // Chithar
      '07:40', // Bhavani BS
      '07:50', // Kalingarayanpalayam
      '07:55', // Lakshminagar
      '08:10', // R.N.pudhur
      '08:15', // Agraharam
      '08:30', // Erode BS
      '08:35', // Savitha & G.H
      '08:40', // Diesel Shed
      '08:45', // Kasipalayam
      '08:50', // ITI
      '08:55', // KK Nagar
      '09:20'  // Mpnmjec
    ];
    
    return routeStops.slice(currentStopIndex, destinationIndex + 1).map((stop, index) => {
      const scheduleTime = scheduleTimes[currentStopIndex + index];
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const today = new Date();
      const eta = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      
      // If the time has passed today, assume it's for tomorrow
      if (eta < new Date()) {
        eta.setDate(eta.getDate() + 1);
      }
      
      return {
        ...stop,
        eta,
        scheduledTime: scheduleTime,
        isNext: index === 1,
        isDestination: stop.id === toStop.id
      };
    });
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
      <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Bus #{currentBus.number}</h2>
          <p className="text-slate-600">Route {currentBus.route_id}</p>
        </div>

        {/* ETA Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-blue-500 mb-1">
            {Math.floor((estimatedArrival.getTime() - new Date().getTime()) / 60000)} min
          </div>
          <p className="text-sm text-slate-600">Estimated arrival at {toStop.name}</p>
        </div>

        {/* Next Stops */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-slate-800">Next Stops:</h3>
          {nextStops.map((stop) => (
            <div key={stop.id} className="flex justify-between items-center p-2 bg-blue-25 rounded">
              <span className={`${stop.isDestination ? 'font-bold text-blue-500' : 'text-slate-800'}`}>
                {stop.name}
              </span>
              <span className="text-sm text-slate-600">
                {Math.floor((stop.eta.getTime() - new Date().getTime()) / 60000)} min
              </span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setAlarm(5)}
            className="w-full bg-blue-400 text-white py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors"
          >
            Set 5-min Alert
          </button>
          <button
            onClick={() => setIsLiteMode(false)}
            className="w-full border border-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
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
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            <Smartphone className="h-4 w-4" />
            <span>Lite Mode</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">ETA</span>
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {Math.floor((estimatedArrival.getTime() - new Date().getTime()) / 60000)} min
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Speed</span>
              <Navigation className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{currentBus.speed} km/h</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <div className={`w-3 h-3 rounded-full ${
                currentBus.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
            </div>
            <p className="text-2xl font-bold text-slate-800 capitalize">{currentBus.status}</p>
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Arrival Alarms
            </h3>
            
            <div className="space-y-3 mb-4">
              {activeAlarms.map((alarm) => (
                <div key={alarm.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-600">
                    Alert {alarm.notification_time} min before arrival
                  </span>
                  <button
                    onClick={() => removeAlarm(alarm.id)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setAlarm(5)}
                className="w-full bg-blue-400 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-500 transition-colors"
              >
                Set 5-min Alert
              </button>
              <button
                onClick={() => setAlarm(10)}
                className="w-full border border-blue-400 text-blue-500 py-2 px-4 rounded-lg text-sm hover:bg-blue-50 transition-colors"
              >
                Set 10-min Alert
              </button>
            </div>
          </div>

          {/* Next Stops */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Next Stops</h3>
            <div className="space-y-3">
              {nextStops.map((stop, index) => (
                <div key={stop.id} className={`p-3 rounded-lg border-2 transition-colors ${
                  stop.isNext ? 'border-blue-400 bg-blue-50' : 
                  stop.isDestination ? 'border-emerald-400 bg-emerald-50' :
                  'border-slate-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium ${
                        stop.isDestination ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {stop.name}
                        {stop.isNext && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">NEXT</span>}
                        {stop.isDestination && <span className="ml-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">DESTINATION</span>}
                      </h4>
                      <p className="text-sm text-slate-600">{stop.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        {Math.floor((stop.eta.getTime() - new Date().getTime()) / 60000)} min
                      </p>
                      <p className="text-xs text-slate-500">
                        {stop.scheduledTime || stop.eta.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false
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