import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import { Permission } from './lib/permissions'
import { UserRole, SecurityLevel } from '../shared/types/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TestPage from './pages/TestPage'
import EmailVerification from './pages/EmailVerification'
import AdminRoutes from './pages/admin/AdminRoutes'
import InterviewRoutes from './pages/interviews/InterviewRoutes'
import ObserverRoutes from './pages/observer/ObserverRoutes'
import SecurityDashboard from './pages/security/SecurityDashboard'
import TestingDashboard from './pages/testing/TestingDashboard'

// Loading Component with Error Handling
const LoadingScreen: React.FC<{ error?: string | null; onRetry?: () => void }> = ({ error, onRetry }) => {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
            <button
              onClick={() => window.location.href = '/test'}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue in Demo Mode
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading application...</p>
      </div>
    </div>
  )
}

// Simple Protected Route Component for basic auth check
const SimpleProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error, retryAuth } = useAuth()
  
  if (loading) {
    return <LoadingScreen error={error} onRetry={retryAuth} />
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error, retryAuth } = useAuth()
  
  if (loading) {
    return <LoadingScreen error={error} onRetry={retryAuth} />
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/test" element={<TestPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <SimpleProtectedRoute>
                  <Dashboard />
                </SimpleProtectedRoute>
              } />
              
              {/* Administrator Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute 
                  requiredRole={UserRole.ADMINISTRATOR}
                  requiredPermissions={[Permission.SYSTEM_CONFIG]}
                >
                  <AdminRoutes />
                </ProtectedRoute>
              } />
              
              {/* Selector Routes */}
              <Route path="/interviews/*" element={
                <ProtectedRoute 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.SELECTOR]}
                  requiredPermissions={[Permission.INTERVIEW_READ]}
                >
                  <InterviewRoutes />
                </ProtectedRoute>
              } />
              
              {/* Question Bank Routes */}
              <Route path="/questions/*" element={
                <ProtectedRoute 
                  requiredRole={[UserRole.ADMINISTRATOR, UserRole.SELECTOR]}
                  requiredPermissions={[Permission.QUESTION_READ]}
                >
                  <QuestionRoutes />
                </ProtectedRoute>
              } />
              
              {/* Analytics Routes */}
              <Route path="/analytics" element={
                <ProtectedRoute 
                  requiredPermissions={[Permission.ANALYTICS_VIEW]}
                >
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              
              {/* Reports Routes */}
              <Route path="/reports" element={
                <ProtectedRoute 
                  requiredPermissions={[Permission.REPORTS_VIEW]}
                >
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              {/* Profile Routes */}
              <Route path="/profile" element={
                <ProtectedRoute 
                  requiredPermissions={[Permission.PROFILE_READ]}
                >
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Security Routes */}
              <Route path="/security" element={
                <ProtectedRoute 
                  requiredRole={UserRole.ADMINISTRATOR}
                  requiredClearance={SecurityLevel.CONFIDENTIAL}
                  requiredPermissions={[Permission.SECURITY_VIEW_LOGS]}
                >
                  <SecurityDashboard />
                </ProtectedRoute>
              } />
              
              {/* Interview Room */}
              <Route path="/interview-room/:id" element={
                <ProtectedRoute 
                  requiredPermissions={[Permission.INTERVIEW_JOIN]}
                >
                  <InterviewRoomPage />
                </ProtectedRoute>
              } />
              
              {/* Testing Dashboard */}
              <Route path="/testing" element={
                <ProtectedRoute 
                  requiredRole={UserRole.ADMINISTRATOR}
                >
                  <TestingDashboard />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  color: 'black',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

// Placeholder components for routes (to be implemented)
const QuestionRoutes = () => <div>Question Routes - Coming Soon</div>
const AnalyticsPage = () => <div>Analytics Page - Coming Soon</div>
const ReportsPage = () => <div>Reports Page - Coming Soon</div>
const ProfilePage = () => <div>Profile Page - Coming Soon</div>
// Security Page component is now SecurityDashboard
const InterviewRoomPage = () => <div>Interview Room - Coming Soon</div>

export default App
