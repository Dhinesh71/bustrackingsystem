import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Bus, MapPin, Clock, AlertTriangle, TrendingUp, Users, Key } from 'lucide-react';
import { AnalyticsData, Alert } from '../../types';
import { ApiKeyManagement } from './ApiKeyManagement';

// Sample analytics data
const sampleAnalytics: AnalyticsData = {
  daily_on_time_percentage: 87.5,
  average_waiting_time: 8.2,
  total_passengers: 12450,
  active_buses: 45,
  route_performance: [
    { route_id: 'A1', on_time_percentage: 92, average_delay: 2.3, passenger_count: 3200 },
    { route_id: 'B2', on_time_percentage: 85, average_delay: 4.1, passenger_count: 2800 },
    { route_id: 'C3', on_time_percentage: 88, average_delay: 3.2, passenger_count: 3100 },
    { route_id: 'D4', on_time_percentage: 82, average_delay: 5.8, passenger_count: 2200 },
  ]
};

const sampleAlerts: Alert[] = [
  {
    id: '1',
    type: 'delay',
    bus_id: '101',
    message: 'Bus #101 is running 15 minutes behind schedule',
    severity: 'medium',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    resolved: false
  },
  {
    id: '2',
    type: 'breakdown',
    bus_id: '205',
    message: 'Bus #205 reported mechanical issues - dispatching backup',
    severity: 'high',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    resolved: false
  },
  {
    id: '3',
    type: 'maintenance',
    bus_id: '308',
    message: 'Bus #308 due for scheduled maintenance in 2 days',
    severity: 'low',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    resolved: false
  }
];

// Sample daily performance data for charts
const dailyPerformanceData = [
  { day: 'Mon', onTime: 89, passengers: 11200, delays: 45 },
  { day: 'Tue', onTime: 92, passengers: 12100, delays: 32 },
  { day: 'Wed', onTime: 85, passengers: 13200, delays: 58 },
  { day: 'Thu', onTime: 88, passengers: 12800, delays: 41 },
  { day: 'Fri', onTime: 91, passengers: 14500, delays: 38 },
  { day: 'Sat', onTime: 94, passengers: 10800, delays: 28 },
  { day: 'Sun', onTime: 96, passengers: 9200, delays: 18 }
];

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>(sampleAnalytics);
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'api-keys'>('dashboard');

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 text-lg">Real-time fleet management and analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="input-modern px-6 py-3 min-w-[160px] shadow-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'api-keys' ? (
        <ApiKeyManagement />
      ) : (
        <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-8 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">On-Time Performance</p>
              <p className="text-4xl font-bold text-emerald-500 mb-1">{analytics.daily_on_time_percentage}%</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="text-emerald-600 font-semibold">↗ 2.3%</span> from last week
          </p>
        </div>

        <div className="card p-8 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Active Buses</p>
              <p className="text-4xl font-bold text-blue-500 mb-1">{analytics.active_buses}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:scale-110 transition-transform">
              <Bus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="text-blue-600 font-semibold">↗ 5</span> buses added this month
          </p>
        </div>

        <div className="card p-8 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Daily Passengers</p>
              <p className="text-4xl font-bold text-violet-500 mb-1">{analytics.total_passengers.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8 text-violet-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="text-violet-600 font-semibold">↗ 8.2%</span> from yesterday
          </p>
        </div>

        <div className="card p-8 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">Avg. Wait Time</p>
              <p className="text-4xl font-bold text-amber-500 mb-1">{analytics.average_waiting_time} min</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            <span className="text-rose-600 font-semibold">↗ 1.2 min</span> from last week
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-rose-100 rounded-xl mr-3">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              Active Alerts ({activeAlerts.length})
            </h2>
            {criticalAlerts.length > 0 && (
              <span className="status-badge bg-rose-100 text-rose-600 font-semibold">
                {criticalAlerts.length} Critical
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-600 font-medium">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{alert.message}</p>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="ml-6 btn-primary px-6 py-2 text-sm"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* On-Time Performance Chart */}
        <div className="card-elevated p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Daily On-Time Performance</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" />
              <YAxis domain={[75, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="onTime" 
                stroke="#3b82f6" 
                strokeWidth={4}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Passenger Count Chart */}
        <div className="card-elevated p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Daily Passenger Count</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="passengers" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Performance Table */}
      <div className="card-elevated p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Route Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-6 font-semibold text-slate-800">Route</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800">On-Time %</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800">Avg. Delay</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800">Passengers</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.route_performance.map((route) => (
                <tr key={route.route_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{route.route_id}</span>
                      </div>
                      <span className="font-semibold text-slate-800">Route {route.route_id}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`${route.on_time_percentage >= 90 ? 'text-green-600' : 
                      route.on_time_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      <span className="text-2xl font-bold">{route.on_time_percentage}</span>
                      <span className="text-sm">%</span>
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-700 font-semibold">{route.average_delay} min</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-700 font-semibold">{route.passenger_count.toLocaleString()}</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`status-badge ${
                      route.on_time_percentage >= 90 ? 'bg-emerald-100 text-emerald-600' :
                      route.on_time_percentage >= 80 ? 'bg-amber-100 text-amber-600' :
                      'bg-rose-100 text-rose-600'
                    } font-semibold`}>
                      {route.on_time_percentage >= 90 ? 'Excellent' :
                       route.on_time_percentage >= 80 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};