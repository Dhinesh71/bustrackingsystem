import { useState, useEffect } from 'react';
import { Bus } from '../types';
import { supabase, subscribeToBusUpdates } from '../lib/supabase';

export const useBusTracking = (routeId?: string) => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        let query = supabase.from('buses').select('*');
        
        if (routeId) {
          query = query.eq('route_id', routeId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setBuses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch buses');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();

    // Subscribe to real-time updates
    const channel = subscribeToBusUpdates((payload) => {
      const { eventType, new: newBus, old: oldBus } = payload;

      setBuses(prevBuses => {
        switch (eventType) {
          case 'INSERT':
            return [...prevBuses, newBus];
          case 'UPDATE':
            return prevBuses.map(bus => 
              bus.id === newBus.id ? newBus : bus
            );
          case 'DELETE':
            return prevBuses.filter(bus => bus.id !== oldBus.id);
          default:
            return prevBuses;
        }
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [routeId]);

  return { buses, loading, error };
};