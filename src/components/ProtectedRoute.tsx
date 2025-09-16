/**
 * Protected Route component for role-based access control
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Permission } from '../lib/permissions'
import { UserRole, SecurityLevel } from '../../shared/types/auth'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requiredRole?: UserRole | UserRole[]
  requiredClearance?: SecurityLevel
  fallbackPath?: string
  showAccessDenied?: boolean
}

interface AccessDeniedProps {
  reason: string
  requiredPermissions?: Permission[]
  requiredRole?: UserRole | UserRole[]
  requiredClearance?: SecurityLevel
  userRole?: UserRole | null
  userClearance?: SecurityLevel | null
  onGoBack: () => void
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  reason,
  requiredPermissions,
  requiredRole,
  requiredClearance,
  userRole,
  userClearance,
  onGoBack
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-red-800 flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">Access Restricted</p>
                  <p className="text-sm text-red-700">{reason}</p>
                </div>
              </div>
            </div>

            {/* Current User Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-800">Your Current Access Level:</h4>
              <div className="flex flex-wrap gap-2">
                {userRole && (
                  <Badge variant="outline" className="text-xs">
                    Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                )}
                {userClearance && (
                  <Badge variant="outline" className="text-xs">
                    Clearance: {userClearance.charAt(0).toUpperCase() + userClearance.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Required Access Info */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-blue-800">Required Access Level:</h4>
              <div className="space-y-2">
                {requiredRole && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-blue-700">Role:</span>
                    {Array.isArray(requiredRole) ? (
                      requiredRole.map((role, index) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                          {index < requiredRole.length - 1 && <span className="ml-1">or</span>}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)}
                      </Badge>
                    )}
                  </div>
                )}
                {requiredClearance && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-700">Clearance:</span>
                    <Badge variant="secondary" className="text-xs">
                      {requiredClearance.charAt(0).toUpperCase() + requiredClearance.slice(1)}
                    </Badge>
                  </div>
                )}
                {requiredPermissions && requiredPermissions.length > 0 && (
                  <div>
                    <span className="text-xs text-blue-700 block mb-1">Required Permissions:</span>
                    <div className="flex flex-wrap gap-1">
                      {requiredPermissions.slice(0, 3).map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(':', ': ').replace('_', ' ')}
                        </Badge>
                      ))}
                      {requiredPermissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{requiredPermissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                onClick={onGoBack} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  If you believe this is an error, please contact your administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  requiredClearance,
  fallbackPath = '/dashboard',
  showAccessDenied = true
}) => {
  const { user, userProfile, loading } = useAuth()
  const { 
    hasPermission, 
    hasAnyPermission, 
    userRole, 
    userClearance,
    canAccessRoute 
  } = usePermissions()
  const location = useLocation()

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if email is verified (for candidates)
  if (!userProfile.email_verified && userRole === UserRole.CANDIDATE) {
    return <Navigate to="/verify-email" replace />
  }

  // Check if account is active
  if (!userProfile.is_active) {
    if (showAccessDenied) {
      return (
        <AccessDenied
          reason="Your account has been deactivated. Please contact your administrator."
          userRole={userRole}
          userClearance={userClearance}
          onGoBack={() => window.history.back()}
        />
      )
    }
    return <Navigate to={fallbackPath} replace />
  }

  // Check role requirements
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (userRole && !allowedRoles.includes(userRole)) {
      if (showAccessDenied) {
        return (
          <AccessDenied
            reason={`This page requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role access.`}
            requiredRole={requiredRole}
            userRole={userRole}
            userClearance={userClearance}
            onGoBack={() => window.history.back()}
          />
        )
      }
      return <Navigate to={fallbackPath} replace />
    }
  }

  // Check security clearance requirements
  if (requiredClearance && userClearance) {
    const clearanceLevels = [SecurityLevel.PUBLIC, SecurityLevel.RESTRICTED, SecurityLevel.CONFIDENTIAL, SecurityLevel.SECRET]
    const userLevel = clearanceLevels.indexOf(userClearance)
    const requiredLevel = clearanceLevels.indexOf(requiredClearance)
    
    if (userLevel < requiredLevel) {
      if (showAccessDenied) {
        return (
          <AccessDenied
            reason={`This page requires ${requiredClearance} security clearance or higher.`}
            requiredClearance={requiredClearance}
            userRole={userRole}
            userClearance={userClearance}
            onGoBack={() => window.history.back()}
          />
        )
      }
      return <Navigate to={fallbackPath} replace />
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    if (!hasAnyPermission(requiredPermissions)) {
      if (showAccessDenied) {
        return (
          <AccessDenied
            reason="You don't have the required permissions to access this page."
            requiredPermissions={requiredPermissions}
            userRole={userRole}
            userClearance={userClearance}
            onGoBack={() => window.history.back()}
          />
        )
      }
      return <Navigate to={fallbackPath} replace />
    }
  }

  // Check route-based permissions
  if (!canAccessRoute(location.pathname)) {
    if (showAccessDenied) {
      return (
        <AccessDenied
          reason="You don't have permission to access this page."
          userRole={userRole}
          userClearance={userClearance}
          onGoBack={() => window.history.back()}
        />
      )
    }
    return <Navigate to={fallbackPath} replace />
  }

  // All checks passed, render the protected content
  return <>{children}</>
}

export default ProtectedRoute