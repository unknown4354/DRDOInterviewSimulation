/**
 * Permission Gate component for conditional rendering based on user permissions
 */

import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Permission, ComponentName } from '../lib/permissions'
import { UserRole, SecurityLevel } from '../../shared/types/auth'

interface PermissionGateProps {
  children: React.ReactNode
  permissions?: Permission[]
  roles?: UserRole | UserRole[]
  clearance?: SecurityLevel
  component?: ComponentName
  resourceOwnerId?: string
  requireAll?: boolean // If true, user must have ALL permissions; if false, ANY permission
  fallback?: React.ReactNode
  showFallback?: boolean
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles,
  clearance,
  component,
  resourceOwnerId,
  requireAll = false,
  fallback = null,
  showFallback = true
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessComponent,
    canAccessResource,
    userRole,
    userClearance
  } = usePermissions()

  // Check role requirements
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!userRole || !allowedRoles.includes(userRole)) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  // Check security clearance requirements
  if (clearance && userClearance) {
    const clearanceLevels = [SecurityLevel.PUBLIC, SecurityLevel.RESTRICTED, SecurityLevel.CONFIDENTIAL, SecurityLevel.SECRET]
    const userLevel = clearanceLevels.indexOf(userClearance)
    const requiredLevel = clearanceLevels.indexOf(clearance)
    
    if (userLevel < requiredLevel) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  // Check component-specific permissions
  if (component && !canAccessComponent(component)) {
    return showFallback ? <>{fallback}</> : null
  }

  // Check resource-specific permissions
  if (resourceOwnerId && permissions.length > 0) {
    const hasResourceAccess = permissions.some(permission => 
      canAccessResource(permission, resourceOwnerId)
    )
    if (!hasResourceAccess) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  // Check general permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasRequiredPermissions) {
      return showFallback ? <>{fallback}</> : null
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<PermissionGateProps, 'children'>
) => {
  return (props: P) => (
    <PermissionGate {...permissionConfig}>
      <Component {...props} />
    </PermissionGate>
  )
}

/**
 * Hook for conditional permission-based logic
 */
export const useConditionalPermission = (config: Omit<PermissionGateProps, 'children'>) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessComponent,
    canAccessResource,
    userRole,
    userClearance
  } = usePermissions()

  const {
    permissions = [],
    roles,
    clearance,
    component,
    resourceOwnerId,
    requireAll = false
  } = config

  // Check role requirements
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!userRole || !allowedRoles.includes(userRole)) {
      return false
    }
  }

  // Check security clearance requirements
  if (clearance && userClearance) {
    const clearanceLevels = [SecurityLevel.PUBLIC, SecurityLevel.RESTRICTED, SecurityLevel.CONFIDENTIAL, SecurityLevel.SECRET]
    const userLevel = clearanceLevels.indexOf(userClearance)
    const requiredLevel = clearanceLevels.indexOf(clearance)
    
    if (userLevel < requiredLevel) {
      return false
    }
  }

  // Check component-specific permissions
  if (component && !canAccessComponent(component)) {
    return false
  }

  // Check resource-specific permissions
  if (resourceOwnerId && permissions.length > 0) {
    const hasResourceAccess = permissions.some(permission => 
      canAccessResource(permission, resourceOwnerId)
    )
    if (!hasResourceAccess) {
      return false
    }
  }

  // Check general permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasRequiredPermissions) {
      return false
    }
  }

  return true
}

/**
 * Specialized components for common permission patterns
 */

// Admin-only content
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate roles={UserRole.ADMINISTRATOR} fallback={fallback}>
    {children}
  </PermissionGate>
)

// Selector and Admin content
export const SelectorOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate roles={[UserRole.ADMINISTRATOR, UserRole.SELECTOR]} fallback={fallback}>
    {children}
  </PermissionGate>
)

// Authenticated users only
export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate roles={[UserRole.ADMINISTRATOR, UserRole.SELECTOR, UserRole.CANDIDATE, UserRole.OBSERVER]} fallback={fallback}>
    {children}
  </PermissionGate>
)

// High security clearance content
export const HighSecurityOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate clearance={SecurityLevel.CONFIDENTIAL} fallback={fallback}>
    {children}
  </PermissionGate>
)

// Secret clearance content
export const SecretClearanceOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate clearance={SecurityLevel.SECRET} fallback={fallback}>
    {children}
  </PermissionGate>
)

export default PermissionGate