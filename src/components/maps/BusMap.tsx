import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { Bus, BusStop } from '../../types';
import 'leaflet/dist/leaflet.css';

// Custom bus icon
const busIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563EB">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm2-9h12v3H6V7zm2 6c.83 0 1.5.67 1.5 1.5S8.83 16 8 16s-1.5-.67-1.5-1.5S7.17 13 8 13zm8 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Custom stop icon
const stopIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669">
      <circle cx="12" cy="12" r="8" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

interface BusMapProps {
  buses: Bus[];
  stops?: BusStop[];
  selectedBus?: string;
  onBusSelect?: (bus: Bus) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Component to update map view
const MapController: React.FC<{ buses: Bus[]; selectedBus?: string }> = ({ 
  buses, 
  selectedBus 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBus) {
      const bus = buses.find(b => b.id === selectedBus);
      if (bus) {
        map.setView([bus.latitude, bus.longitude], 15);
      }
    }
  }, [selectedBus, buses, map]);

  return null;
};

export const BusMap: React.FC<BusMapProps> = ({
  buses,
  stops = [],
  selectedBus,
  onBusSelect,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  height = '500px'
}) => {
  const mapRef = useRef(null);

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'inactive': return '#6B7280';
      case 'maintenance': return '#F59E0B';
      case 'breakdown': return '#DC2626';
      default: return '#059669';
    }
  };

  const createBusIcon = (bus: Bus) => {
    return divIcon({
      html: `
        <div style="
          background-color: ${getBusStatusColor(bus.status)};
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transform: rotate(${bus.heading}deg);
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm2-9h12v3H6V7zm2 6c.83 0 1.5.67 1.5 1.5S8.83 16 8 16s-1.5-.67-1.5-1.5S7.17 13 8 13zm8 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
          </svg>
        </div>
      `,
      className: 'custom-bus-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  return (
    <div style={{ height }} className="relative rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <MapController buses={buses} selectedBus={selectedBus} />
        
        {/* Render bus stops */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">{stop.name}</h3>
                <p className="text-sm text-gray-600">{stop.address}</p>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Routes: </span>
                  {stop.routes.map((route, idx) => (
                    <span 
                      key={route}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                    >
                      {route}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Render buses */}
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            icon={createBusIcon(bus)}
            eventHandlers={{
              click: () => onBusSelect?.(bus)
            }}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">Bus #{bus.number}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    bus.status === 'active' ? 'bg-green-100 text-green-800' :
                    bus.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bus.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Driver:</span> {bus.driver_name}</p>
                  <p><span className="text-gray-600">Speed:</span> {bus.speed} km/h</p>
                  <p><span className="text-gray-600">Occupancy:</span> {bus.current_occupancy}/{bus.capacity}</p>
                  <p><span className="text-gray-600">Fuel:</span> {bus.fuel_level}%</p>
                </div>
                
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(bus.current_occupancy / bus.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Capacity utilization</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};