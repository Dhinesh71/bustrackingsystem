import React, { useState, useEffect } from 'react';
import { Clock, Users, Filter, Calendar } from 'lucide-react';
import { Bus, Route, BusStop } from '../../types';
import { format, addMinutes, parseISO } from 'date-fns';

interface BusListingsProps {
  fromStop: BusStop;
  toStop: BusStop;
  onBusSelect: (bus: Bus) => void;
}

// Sample data
const sampleRoutes: Route[] = [
  {
    id: '1',
    name: 'Route A1',
    code: 'A1',
    color: '#2563EB',
    stops: [],
    estimated_duration: 45,
    fare: 2.50,
    status: 'active'
  },
  {
    id: '2',
    name: 'Route B2',
    code: 'B2',
    color: '#059669',
    stops: [],
    estimated_duration: 35,
    fare: 2.00,
    status: 'active'
  }
];

const sampleBuses: Bus[] = [
  {
    id: '1',
    number: '101',
    route_id: '1',
    driver_name: 'John Smith',
    capacity: 50,
    current_occupancy: 23,
    latitude: 40.7128,
    longitude: -74.0060,
    speed: 25,
    heading: 90,
    fuel_level: 75,
    status: 'active',
    last_updated: new Date().toISOString()
  },
  {
    id: '2',
    number: '102',
    route_id: '1',
    driver_name: 'Jane Doe',
    capacity: 50,
    current_occupancy: 38,
    latitude: 40.7589,
    longitude: -73.9851,
    speed: 30,
    heading: 180,
    fuel_level: 60,
    status: 'active',
    last_updated: new Date().toISOString()
  },
  {
    id: '3',
    number: '201',
    route_id: '2',
    driver_name: 'Mike Johnson',
    capacity: 45,
    current_occupancy: 15,
    latitude: 40.7505,
    longitude: -73.9934,
    speed: 22,
    heading: 270,
    fuel_level: 90,
    status: 'active',
    last_updated: new Date().toISOString()
  }
];

export const BusListings: React.FC<BusListingsProps> = ({
  fromStop,
  toStop,
  onBusSelect
}) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterOccupancy, setFilterOccupancy] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'arrival' | 'occupancy'>('arrival');
  const [filteredBuses, setFilteredBuses] = useState(sampleBuses);

  // Calculate estimated arrival times (simplified)
  const calculateArrivalTime = (bus: Bus) => {
    const now = new Date();
    // Simulate different arrival times based on bus position
    const minutesToAdd = 5 + (parseInt(bus.number) % 20);
    return addMinutes(now, minutesToAdd);
  };

  // Filter and sort buses
  useEffect(() => {
    let filtered = [...sampleBuses];

    // Filter by occupancy level
    if (filterOccupancy !== 'all') {
      filtered = filtered.filter(bus => {
        const occupancyRate = bus.current_occupancy / bus.capacity;
        switch (filterOccupancy) {
          case 'low': return occupancyRate < 0.4;
          case 'medium': return occupancyRate >= 0.4 && occupancyRate < 0.8;
          case 'high': return occupancyRate >= 0.8;
          default: return true;
        }
      });
    }

    // Sort buses
    filtered.sort((a, b) => {
      if (sortBy === 'arrival') {
        return calculateArrivalTime(a).getTime() - calculateArrivalTime(b).getTime();
      } else {
        return a.current_occupancy - b.current_occupancy;
      }
    });

    setFilteredBuses(filtered);
  }, [filterOccupancy, sortBy]);

  const getOccupancyLevel = (occupancy: number, capacity: number) => {
    const rate = occupancy / capacity;
    if (rate < 0.4) return { level: 'low', color: 'green', text: 'Comfortable' };
    if (rate < 0.8) return { level: 'medium', color: 'yellow', text: 'Moderate' };
    return { level: 'high', color: 'red', text: 'Crowded' };
  };

  const getRoute = (routeId: string) => {
    return sampleRoutes.find(r => r.id === routeId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Buses</h2>
              <p className="text-gray-600">
                From <span className="font-medium">{fromStop.name}</span> to <span className="font-medium">{toStop.name}</span>
              </p>
            </div>
            
            {/* Date Selector */}
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filterOccupancy}
              onChange={(e) => setFilterOccupancy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Occupancy</option>
              <option value="low">Comfortable</option>
              <option value="medium">Moderate</option>
              <option value="high">Crowded</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="arrival">Sort by Arrival</option>
              <option value="occupancy">Sort by Occupancy</option>
            </select>
          </div>
        </div>

        {/* Bus List */}
        <div className="divide-y divide-gray-200">
          {filteredBuses.map((bus) => {
            const route = getRoute(bus.route_id);
            const arrivalTime = calculateArrivalTime(bus);
            const occupancyInfo = getOccupancyLevel(bus.current_occupancy, bus.capacity);
            const occupancyRate = (bus.current_occupancy / bus.capacity) * 100;

            return (
              <div
                key={bus.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onBusSelect(bus)}
              >
                <div className="flex items-center justify-between">
                  {/* Bus Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div 
                        className="w-12 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: route?.color || '#2563EB' }}
                      >
                        {route?.code}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bus #{bus.number}</h3>
                        <p className="text-sm text-gray-600">Driver: {bus.driver_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Arrives in {Math.floor((arrivalTime.getTime() - new Date().getTime()) / 60000)} min</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{bus.current_occupancy}/{bus.capacity} passengers</span>
                      </div>
                      
                      <span className="text-lg font-semibold text-green-600">
                        ${route?.fare.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Arrival Time & Status */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {format(arrivalTime, 'HH:mm')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          occupancyInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          occupancyInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {occupancyInfo.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Capacity</span>
                    <span>{Math.round(occupancyRate)}% full</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        occupancyRate < 40 ? 'bg-green-500' :
                        occupancyRate < 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBuses.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};