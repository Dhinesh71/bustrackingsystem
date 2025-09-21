import React, { useState } from 'react';
import { BusStop, Bus } from '../../types';
import { DestinationSearch } from './DestinationSearch';
import { BusListings } from './BusListings';
import { LiveTracking } from './LiveTracking';
import { ArrowLeft } from 'lucide-react';

type AppState = 'search' | 'listings' | 'tracking';

export const PassengerApp: React.FC = () => {
  const [currentState, setCurrentState] = useState<AppState>('search');
  const [fromStop, setFromStop] = useState<BusStop | null>(null);
  const [toStop, setToStop] = useState<BusStop | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const handleDestinationSelect = (from: BusStop, to: BusStop) => {
    setFromStop(from);
    setToStop(to);
    setCurrentState('listings');
  };

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus);
    setCurrentState('tracking');
  };

  const handleBack = () => {
    if (currentState === 'tracking') {
      setCurrentState('listings');
    } else if (currentState === 'listings') {
      setCurrentState('search');
    }
  };

  const renderHeader = () => {
    if (currentState === 'search') return null;

    return (
      <div className="bg-blue-50 shadow-sm border-b border-blue-100 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-25" style={{ backgroundColor: '#f8fafc' }}>
      {renderHeader()}
      
      {currentState === 'search' && (
        <DestinationSearch onDestinationSelect={handleDestinationSelect} />
      )}
      
      {currentState === 'listings' && fromStop && toStop && (
        <BusListings
          fromStop={fromStop}
          toStop={toStop}
          onBusSelect={handleBusSelect}
        />
      )}
      
      {currentState === 'tracking' && selectedBus && fromStop && toStop && (
        <LiveTracking
          selectedBus={selectedBus}
          fromStop={fromStop}
          toStop={toStop}
        />
      )}
    </div>
  );
};