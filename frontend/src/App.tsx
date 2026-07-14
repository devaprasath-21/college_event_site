import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

import { SSOLoginPage } from './pages/SSOLoginPage';

const queryClient = new QueryClient();

// Route Guard for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        <p className="mt-2 text-xs text-muted-foreground">CampusHub is checking security session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If coordinator goes to student dashboard or vice-versa, redirect appropriately
    return <Navigate to={user.role === 'student' ? '/dashboard' : '/admin'} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Router>
                <Routes>
                  {/* Public Routing */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/sso" element={<SSOLoginPage />} />


                  {/* Student Dashboard (Role: student) */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Admin Dashboard (Roles: super-admin, coordinator, volunteer) */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute allowedRoles={['super-admin', 'event-coordinator', 'volunteer']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Fallback Catch-All redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
