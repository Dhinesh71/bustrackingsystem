import React, { useState, useEffect } from 'react';
import { MapPin, Search, Clock, Navigation } from 'lucide-react';
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
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Plan Your Journey
        </h2>
        
        {/* From Location */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setShowFromSuggestions(true);
              }}
              onFocus={() => setShowFromSuggestions(true)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter starting location"
            />
            <button
              onClick={getCurrentLocation}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700"
            >
              <Navigation className="h-5 w-5" />
            </button>
            
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                {fromSuggestions.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => handleFromSelect(stop)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{stop.name}</p>
                        <p className="text-sm text-gray-500">{stop.address}</p>
                        <div className="flex space-x-1 mt-1">
                          {stop.routes.map(route => (
                            <span key={route} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {route}
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
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <MapPin className="h-5 w-5 text-red-500" />
            </div>
            <input
              type="text"
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter destination"
            />
            
            {showToSuggestions && toSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                {toSuggestions.map((stop) => (
                  <button
                    key={stop.id}
                    onClick={() => handleToSelect(stop)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{stop.name}</p>
                        <p className="text-sm text-gray-500">{stop.address}</p>
                        <div className="flex space-x-1 mt-1">
                          {stop.routes.map(route => (
                            <span key={route} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {route}
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
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Search className="h-5 w-5 mr-2" />
          Find Buses
        </button>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Searches
            </h3>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search.from, search.to)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">From: <span className="font-medium text-gray-900">{search.from}</span></p>
                      <p className="text-sm text-gray-600">To: <span className="font-medium text-gray-900">{search.to}</span></p>
                    </div>
                    <Search className="h-4 w-4 text-gray-400" />
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