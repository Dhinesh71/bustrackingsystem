import React from 'react';
import { Bus, User, Settings, LogOut, Menu } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {showNavigation && (
        <header className="glass-effect shadow-lg border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Bus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">Real-time Transit Solutions</p>
                </div>
              </div>
              
              {user && (
                <div className="flex items-center space-x-6">
                  <div className="hidden md:block">
                    <span className="text-sm font-medium text-slate-700">
                      Welcome back, <span className="text-blue-600">{user.name || user.email.split('@')[0]}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all duration-200">
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={signOut}
                      className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
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
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};