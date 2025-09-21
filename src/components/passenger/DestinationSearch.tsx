import React, { useState, useEffect } from 'react';
import { MapPin, Search, Clock, Navigation, Bus } from 'lucide-react';
import { BusStop } from '../../types';

interface DestinationSearchProps {
  onDestinationSelect: (from: BusStop, to: BusStop) => void;
}

// Sample bus stops data
const sampleStops: BusStop[] = [
  { id: '1', name: 'Central Station', address: '123 Main St', latitude: 40.7128, longitude: -74.0060, routes: ['A1', 'B2'] },
  { id: '2', name: 'University Campus', address: '456 College Ave', latitude: 40.7589, longitude: -73.9851, routes: ['B2', 'C3'] },
  { id: '3', name: 'Shopping Mall', address: '789 Commerce Blvd', latitude: 40.7505, longitude: -73.9934, routes: ['A1', 'C3'] },
  { id: '4', name: 'Airport Terminal', address: '321 Sky Way', latitude: 40.6892, longitude: -74.1745, routes: ['D4'] },
  { id: '5', name: 'City Hospital', address: '654 Health St', latitude: 40.7831, longitude: -73.9712, routes: ['A1', 'D4'] },
];

const recentSearches = [
  { from: 'Central Station', to: 'University Campus' },
  { from: 'Shopping Mall', to: 'Airport Terminal' },
];

export const DestinationSearch: React.FC<DestinationSearchProps> = ({ 
  onDestinationSelect 
}) => {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<BusStop[]>([]);
  const [toSuggestions, setToSuggestions] = useState<BusStop[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState<BusStop | null>(null);
  const [selectedTo, setSelectedTo] = useState<BusStop | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (fromQuery.length > 0) {
      const filtered = sampleStops.filter(stop =>
        stop.name.toLowerCase().includes(fromQuery.toLowerCase()) ||
        stop.address.toLowerCase().includes(fromQuery.toLowerCase())
      );
      setFromSuggestions(filtered);
    } else {
      setFromSuggestions([]);
    }
  }, [fromQuery]);

  useEffect(() => {
    if (toQuery.length > 0) {
      const filtered = sampleStops.filter(stop =>
        stop.name.toLowerCase().includes(toQuery.toLowerCase()) ||
        stop.address.toLowerCase().includes(toQuery.toLowerCase())
      );
      setToSuggestions(filtered);
    } else {
      setToSuggestions([]);
    }
  }, [toQuery]);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Find nearest stop (simplified)
          const nearest = sampleStops[0]; // In real app, calculate actual nearest
          setSelectedFrom(nearest);
          setFromQuery(nearest.name);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleFromSelect = (stop: BusStop) => {
    setSelectedFrom(stop);
    setFromQuery(stop.name);
    setShowFromSuggestions(false);
  };

  const handleToSelect = (stop: BusStop) => {
    setSelectedTo(stop);
    setToQuery(stop.name);
    setShowToSuggestions(false);
  };

  const handleSearch = () => {
    if (selectedFrom && selectedTo) {
      onDestinationSelect(selectedFrom, selectedTo);
    }
  };

  const handleRecentSearch = (from: string, to: string) => {
    const fromStop = sampleStops.find(s => s.name === from);
    const toStop = sampleStops.find(s => s.name === to);
    if (fromStop && toStop) {
      setSelectedFrom(fromStop);
      setSelectedTo(toStop);
      setFromQuery(fromStop.name);
      setToQuery(toStop.name);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 animate-fade-in-up">
      <div className="card-elevated p-8">
        {/* From Location */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Departure Location
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setShowFromSuggestions(true);
              }}
              onFocus={() => setShowFromSuggestions(true)}
              className="input-modern pl-14 pr-14 h-14 text-base group-hover:shadow-md"
              placeholder="Where are you starting from?"
            />
            <button
              onClick={getCurrentLocation}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              title="Use current location"
            >
              <div className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                <Navigation className="h-5 w-5" />
              </div>
            </button>
            
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {fromSuggestions.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => handleFromSelect(stop)}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                        <MapPin className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{stop.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{stop.address}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stop.routes.map(route => (
                            <span key={route} className="status-badge bg-blue-100 text-blue-700">
                              Route {route}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* To Location */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Destination
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <MapPin className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <input
              type="text"
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              className="input-modern pl-14 h-14 text-base group-hover:shadow-md"
              placeholder="Where would you like to go?"
            />
            
            {showToSuggestions && toSuggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {toSuggestions.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => handleToSelect(stop)}
                    className="w-full text-left px-6 py-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                        <MapPin className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{stop.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{stop.address}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stop.routes.map(route => (
                            <span key={route} className="status-badge bg-blue-100 text-blue-700">
                              Route {route}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!selectedFrom || !selectedTo}
          className="btn-primary w-full h-14 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          <Search className="h-5 w-5 mr-3" />
          Find Available Buses
        </button>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <div className="p-1.5 bg-slate-100 rounded-lg mr-3">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
              Recent Searches
            </h3>
            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search.from, search.to)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{search.from}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-semibold text-slate-800">{search.to}</span>
                      </p>
                    </div>
                    <Search className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};