// Core data types for the bus tracking system

export interface User {
  id: string;
  email: string;
  role: 'passenger' | 'admin' | 'driver';
  name: string;
  created_at: string;
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  routes: string[];
}

export interface Bus {
  id: string;
  number: string;
  route_id: string;
  driver_name: string;
  capacity: number;
  current_occupancy: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuel_level: number;
  status: 'active' | 'inactive' | 'maintenance' | 'breakdown';
  last_updated: string;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  color: string;
  stops: BusStop[];
  estimated_duration: number;
  fare: number;
  status: 'active' | 'suspended';
}

export interface Schedule {
  id: string;
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  stops_schedule: {
    stop_id: string;
    estimated_arrival: string;
    actual_arrival?: string;
  }[];
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface Alarm {
  id: string;
  user_id: string;
  bus_id: string;
  stop_id: string;
  notification_time: number; // minutes before arrival
  is_active: boolean;
  created_at: string;
}

export interface TripLog {
  id: string;
  bus_id: string;
  route_id: string;
  start_time: string;
  end_time?: string;
  distance_covered: number;
  delays: number; // in minutes
  passenger_count: number;
  fuel_consumed: number;
}

export interface Alert {
  id: string;
  type: 'delay' | 'breakdown' | 'route_change' | 'maintenance';
  bus_id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolved: boolean;
}

export interface AnalyticsData {
  daily_on_time_percentage: number;
  average_waiting_time: number;
  total_passengers: number;
  active_buses: number;
  route_performance: {
    route_id: string;
    on_time_percentage: number;
    average_delay: number;
    passenger_count: number;
  }[];
}