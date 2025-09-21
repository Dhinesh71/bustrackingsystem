import React, { useState } from 'react';
import { BusMap } from '../maps/BusMap';
import { Bus } from '../../types';
import { useBusTracking } from '../../hooks/useBusTracking';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Filter, Eye, Settings } from 'lucide-react';

export const FleetMap: React.FC = () => {
  const { buses, loading, error } = useBusTracking();
  const [selectedBus, setSelectedBus] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'maintenance' | 'breakdown'>('all');
  const [routeFilter, setRouteFilter] = useState<string>('all');

  // Get unique routes for filter
  const routes = Array.from(new Set(buses.map(bus => bus.route_id))).sort();

  // Filter buses
  const filteredBuses = buses.filter(bus => {
    const statusMatch = statusFilter === 'all' || bus.status === statusFilter;
    const routeMatch = routeFilter === 'all' || bus.route_id === routeFilter;
    return statusMatch && routeMatch;
  });

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus.id);
  };

  if (loading) {
    return <LoadingSpinner text="Loading fleet data..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <p className="text-red-600">Error loading fleet data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Overview</h1>
          <p className="text-gray-600">Real-time positions of all active buses</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">Filters:</span>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="breakdown">Breakdown</option>
          </select>
          
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Routes</option>
            {routes.map(route => (
              <option key={route} value={route}>Route {route}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Total Buses</p>
          <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {buses.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">
            {buses.filter(b => b.status === 'inactive').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">
            {buses.filter(b => b.status === 'maintenance').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Issues</p>
          <p className="text-2xl font-bold text-red-600">
            {buses.filter(b => b.status === 'breakdown').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <BusMap
              buses={filteredBuses}
              selectedBus={selectedBus}
              onBusSelect={handleBusSelect}
              center={[40.7128, -74.0060]}
              zoom={11}
              height="700px"
            />
          </div>
        </div>

        {/* Bus List */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Fleet Status ({filteredBuses.length})
            </h3>
          </div>
          
          <div className="space-y-2 max-h-[650px] overflow-y-auto">
            {filteredBuses.map((bus) => (
              <div
                key={bus.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedBus === bus.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleBusSelect(bus)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Bus #{bus.number}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bus.status === 'active' ? 'bg-green-100 text-green-800' :
                    bus.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bus.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Route: <span className="font-medium">{bus.route_id}</span></p>
                  <p>Speed: {bus.speed} km/h</p>
                  <p>Occupancy: {bus.current_occupancy}/{bus.capacity}</p>
                  <p>Fuel: {bus.fuel_level}%</p>
                </div>
                
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(bus.current_occupancy / bus.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredBuses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No buses match current filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};