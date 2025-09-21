import React from 'react';
import { Bus, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'Smart Bus Tracking',
  showNavigation = true 
}) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-blue-25" style={{ backgroundColor: '#f8fafc' }}>
      {showNavigation && (
        <header className="bg-white shadow-sm border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Bus className="h-8 w-8 text-blue-500" />
                <h1 className="text-xl font-bold text-slate-800">{title}</h1>
              </div>
              
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">
                    Welcome, {user.name || user.email}
                  </span>
                  <div className="flex space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={signOut}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};