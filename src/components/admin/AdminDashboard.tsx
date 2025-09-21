import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Bus, MapPin, Clock, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { AnalyticsData, Alert } from '../../types';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-600">Real-time fleet management and analytics</p>
        </div>
        
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as any)}
          className="border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">On-Time Performance</p>
              <p className="text-3xl font-bold text-emerald-500">{analytics.daily_on_time_percentage}%</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Clock className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-emerald-500">↗ 2.3%</span> from last week
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Buses</p>
              <p className="text-3xl font-bold text-blue-500">{analytics.active_buses}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Bus className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-blue-500">↗ 5</span> buses added this month
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Daily Passengers</p>
              <p className="text-3xl font-bold text-violet-500">{analytics.total_passengers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-full">
              <Users className="h-6 w-6 text-violet-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-violet-500">↗ 8.2%</span> from yesterday
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg. Wait Time</p>
              <p className="text-3xl font-bold text-amber-500">{analytics.average_waiting_time} min</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            <span className="text-rose-500">↗ 1.2 min</span> from last week
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-rose-500" />
              Active Alerts ({activeAlerts.length})
            </h2>
            {criticalAlerts.length > 0 && (
              <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm font-medium">
                {criticalAlerts.length} Critical
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-600">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-800">{alert.message}</p>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="ml-4 bg-blue-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Time Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Daily On-Time Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[75, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="onTime" 
                stroke="#60a5fa" 
                strokeWidth={3}
                dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Passenger Count Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Passenger Count</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="passengers" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Performance Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Route Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-800">Route</th>
                <th className="text-left py-3 px-4 font-medium text-slate-800">On-Time %</th>
                <th className="text-left py-3 px-4 font-medium text-slate-800">Avg. Delay</th>
                <th className="text-left py-3 px-4 font-medium text-slate-800">Passengers</th>
                <th className="text-left py-3 px-4 font-medium text-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.route_performance.map((route) => (
                <tr key={route.route_id} className="hover:bg-blue-25">
                  <td className="py-4 px-4">
                    <span className="font-semibold text-blue-500">{route.route_id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`${route.on_time_percentage >= 90 ? 'text-green-600' : 
                      route.on_time_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {route.on_time_percentage}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{route.average_delay} min</td>
                  <td className="py-4 px-4 text-slate-600">{route.passenger_count.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      route.on_time_percentage >= 90 ? 'bg-emerald-100 text-emerald-600' :
                      route.on_time_percentage >= 80 ? 'bg-amber-100 text-amber-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
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
    </div>
  );
};