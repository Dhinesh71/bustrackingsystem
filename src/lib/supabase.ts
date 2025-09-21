import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Real-time subscription helpers
export const subscribeToBusUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('bus_updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'buses'
    }, callback)
    .subscribe();
};

export const subscribeToAlerts = (callback: (payload: any) => void) => {
  return supabase
    .channel('alerts')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts'
    }, callback)
    .subscribe();
};

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};