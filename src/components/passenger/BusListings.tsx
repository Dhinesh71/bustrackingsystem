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
    name: 'Boothapadi - Mpnmjec Route',
    code: '1',
    color: '#2563EB',
    stops: [],
    estimated_duration: 130,
    fare: 15.00,
    status: 'active'
  }
];

const sampleBuses: Bus[] = [
  {
    id: '1',
    number: '1',
    route_id: '1',
    driver_name: 'Raman Kumar',
    capacity: 45,
    current_occupancy: 18,
    latitude: 11.3410,
    longitude: 77.7172,
    speed: 35,
    heading: 90,
    fuel_level: 75,
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
    // Simulate arrival times based on current schedule
    const minutesToAdd = 8 + Math.floor(Math.random() * 15); // 8-23 minutes
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
    <div className="max-w-5xl mx-auto p-6 animate-fade-in-up">
      <div className="card-elevated">
        {/* Header */}
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Available Buses</h2>
              <div className="flex items-center space-x-2 text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800">{fromStop.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-0.5 bg-slate-300"></div>
                  <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                  <span className="font-semibold text-slate-800">{toStop.name}</span>
                </div>
              </div>
            </div>
            
            {/* Date Selector */}
            <div className="mt-6 md:mt-0">
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar className="h-5 w-5 text-slate-600" />
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-modern border-0 bg-transparent focus:ring-0 text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Bus List */}
        <div className="divide-y divide-slate-100">
          {filteredBuses.map((bus) => {
            const route = getRoute(bus.route_id);
            const arrivalTime = calculateArrivalTime(bus);
            const occupancyInfo = getOccupancyLevel(bus.current_occupancy, bus.capacity);
            const occupancyRate = (bus.current_occupancy / bus.capacity) * 100;

            return (
              <div
                key={bus.id}
                className="p-8 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 cursor-pointer group"
                onClick={() => onBusSelect(bus)}
              >
                <div className="flex items-start justify-between">
                  {/* Bus Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-5 mb-4">
                      <div 
                        className="w-16 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transform group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: route?.color || '#60a5fa' }}
                      >
                        {route?.code}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">Bus No.{bus.number}</h3>
                        <p className="text-sm text-slate-600 font-medium">Driver: {bus.driver_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-xl">
                        <div className="p-1 bg-blue-100 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-blue-700">
                          Arrives in {Math.floor((arrivalTime.getTime() - new Date().getTime()) / 60000)} min
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl">
                        <div className="p-1 bg-slate-100 rounded-lg">
                          <Users className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="font-semibold text-slate-700">
                          {bus.current_occupancy}/{bus.capacity} passengers
                        </span>
                      </div>
                      
                      <div className="bg-emerald-50 px-4 py-2 rounded-xl">
                        <span className="text-xl font-bold text-emerald-600">
                          ${route?.fare.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrival Time & Status */}
                  <div className="text-right ml-6">
                    <div className="text-4xl font-bold text-slate-800 mb-2">
                      {format(arrivalTime, 'HH:mm')}
                    </div>
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <span 
                        className={`status-badge ${
                          occupancyInfo.color === 'green' ? 'bg-emerald-100 text-emerald-600' :
                          occupancyInfo.color === 'yellow' ? 'bg-amber-100 text-amber-600' :
                          'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {occupancyInfo.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Capacity</span>
                    <span>{Math.round(occupancyRate)}% full</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        occupancyRate < 40 ? 'bg-emerald-400' :
                        occupancyRate < 80 ? 'bg-amber-400' :
                        'bg-rose-400'
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
          <div className="p-16 text-center">
            <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-6">
              <Clock className="h-16 w-16 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-3">No buses found</h3>
            <p className="text-slate-600 text-lg">Try adjusting your filters or check back later for more options.</p>
          </div>
        )}
      </div>
    </div>
  );
};