import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AdminDashboard } from './AdminDashboard';
import { SelectorDashboard } from './SelectorDashboard';
import { CandidateDashboard } from './CandidateDashboard';
import { ObserverDashboard } from './ObserverDashboard';
import { Shield, Users, User, Eye, AlertCircle } from 'lucide-react';

export const DashboardRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access your dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'administrator':
      return <AdminDashboard />;
    
    case 'selector':
      return <SelectorDashboard />;
    
    case 'candidate':
      return <CandidateDashboard />;
    
    case 'observer':
      return <ObserverDashboard />;
    
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Role</h1>
            <p className="text-gray-600 mb-4">
              Your account role '{user.role}' is not recognized. Please contact support.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Valid roles:</p>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Administrator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Selector</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Candidate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Observer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};