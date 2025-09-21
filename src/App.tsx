import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/common/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { PassengerApp } from './components/passenger/PassengerApp';
import { AdminLogin } from './components/admin/Login';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FleetMap } from './components/admin/FleetMap';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/passenger" />;
  }

  return <>{children}</>;
};

// Main App Content
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Smart Bus Tracking..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Default redirect based on user role */}
        <Route 
          path="/" 
          element={
            user?.role === 'admin' 
              ? <Navigate to="/admin/dashboard" /> 
              : <Navigate to="/passenger" />
          } 
        />
        
        {/* Passenger Routes */}
        <Route 
          path="/passenger" 
          element={
            <Layout title="Smart Bus Tracking" showNavigation={!user}>
              <PassengerApp />
            </Layout>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute adminOnly>
              <Layout title="Admin Dashboard">
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/fleet" 
          element={
            <ProtectedRoute adminOnly>
              <Layout title="Fleet Management">
                <FleetMap />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;