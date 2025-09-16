/**
 * React hook for permission checking and role-based access control
 */

import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  Permission, 
  PermissionChecker, 
  ROUTE_PERMISSIONS, 
  COMPONENT_PERMISSIONS,
  ComponentName 
} from '../lib/permissions'
import { UserRole, SecurityLevel } from '../../shared/types/auth'

export interface UsePermissionsReturn {
  // Permission checking functions
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canAccessRoute: (route: string) => boolean
  canAccessComponent: (componentName: ComponentName) => boolean
  canAccessResource: (permission: Permission, resourceOwnerId: string) => boolean
  
  // Role and clearance info
  userRole: UserRole | null
  userClearance: SecurityLevel | null
  isAdmin: boolean
  isSelector: boolean
  isCandidate: boolean
  isObserver: boolean
  
  // Permission lists
  userPermissions: Permission[]
  availablePermissions: Permission[]
  
  // Utility functions
  requiresPermission: (permission: Permission) => { hasAccess: boolean; reason?: string }
  getAccessLevel: () => 'full' | 'limited' | 'read-only' | 'none'
}

/**
 * Hook for checking user permissions and role-based access
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { user, userProfile } = useAuth()
  
  const userRole = userProfile?.role as UserRole || null
  const userClearance = userProfile?.security_clearance as SecurityLevel || SecurityLevel.PUBLIC
  const userId = user?.id || ''
  
  // Memoized permission calculations
  const permissionData = useMemo(() => {
    if (!userRole) {
      return {
        userPermissions: [],
        availablePermissions: [],
        isAdmin: false,
        isSelector: false,
        isCandidate: false,
        isObserver: false
      }
    }
    
    const userPermissions = PermissionChecker.getRolePermissions(userRole)
    const availablePermissions = PermissionChecker.filterPermissionsByClearance(
      userPermissions,
      userClearance
    )
    
    return {
      userPermissions,
      availablePermissions,
      isAdmin: userRole === UserRole.ADMINISTRATOR,
      isSelector: userRole === UserRole.SELECTOR,
      isCandidate: userRole === UserRole.CANDIDATE,
      isObserver: userRole === UserRole.OBSERVER
    }
  }, [userRole, userClearance])
  
  // Permission checking functions
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false
    return PermissionChecker.hasPermission(userRole, permission, userClearance)
  }
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }
  
  const canAccessRoute = (route: string): boolean => {
    // Normalize route (remove query params and trailing slashes)
    const normalizedRoute = route.split('?')[0].replace(/\/$/, '') || '/'
    
    // Check exact match first
    const requiredPermissions = ROUTE_PERMISSIONS[normalizedRoute]
    if (requiredPermissions) {
      return hasAnyPermission(requiredPermissions)
    }
    
    // Check pattern matches (e.g., /interviews/:id)
    for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
      if (matchesRoutePattern(normalizedRoute, routePattern)) {
        return hasAnyPermission(permissions)
      }
    }
    
    // Default: allow access to routes without specific permissions
    return true
  }
  
  const canAccessComponent = (componentName: ComponentName): boolean => {
    const requiredPermissions = COMPONENT_PERMISSIONS[componentName]
    if (!requiredPermissions) return true
    return hasAnyPermission(requiredPermissions)
  }
  
  const canAccessResource = (permission: Permission, resourceOwnerId: string): boolean => {
    if (!userRole) return false
    return PermissionChecker.canAccessResource(
      userRole,
      permission,
      resourceOwnerId,
      userId,
      userClearance
    )
  }
  
  const requiresPermission = (permission: Permission): { hasAccess: boolean; reason?: string } => {
    if (!userRole) {
      return { hasAccess: false, reason: 'User not authenticated' }
    }
    
    const hasAccess = hasPermission(permission)
    if (!hasAccess) {
      const rolePermissions = PermissionChecker.getRolePermissions(userRole)
      if (!rolePermissions.includes(permission)) {
        return { 
          hasAccess: false, 
          reason: `Your role (${userRole}) does not have the required permission: ${permission}` 
        }
      } else {
        return { 
          hasAccess: false, 
          reason: `Insufficient security clearance. Required: ${permission}` 
        }
      }
    }
    
    return { hasAccess: true }
  }
  
  const getAccessLevel = (): 'full' | 'limited' | 'read-only' | 'none' => {
    if (!userRole) return 'none'
    
    if (permissionData.isAdmin) return 'full'
    if (permissionData.isSelector) return 'limited'
    if (permissionData.isObserver) return 'read-only'
    if (permissionData.isCandidate) return 'limited'
    
    return 'none'
  }
  
  return {
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    canAccessComponent,
    canAccessResource,
    
    // Role and clearance info
    userRole,
    userClearance,
    ...permissionData,
    
    // Permission lists
    userPermissions: permissionData.userPermissions,
    availablePermissions: permissionData.availablePermissions,
    
    // Utility functions
    requiresPermission,
    getAccessLevel
  }
}

/**
 * Helper function to match route patterns
 */
function matchesRoutePattern(route: string, pattern: string): boolean {
  // Convert pattern like '/interviews/:id' to regex
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
    .replace(/\//g, '\\/') // Escape forward slashes
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(route)
}

/**
 * Hook for checking specific permission with loading state
 */
export const usePermission = (permission: Permission) => {
  const { hasPermission, requiresPermission } = usePermissions()
  
  return useMemo(() => {
    const result = requiresPermission(permission)
    return {
      hasPermission: hasPermission(permission),
      ...result
    }
  }, [hasPermission, requiresPermission, permission])
}

/**
 * Hook for checking route access
 */
export const useRouteAccess = (route: string) => {
  const { canAccessRoute } = usePermissions()
  
  return useMemo(() => ({
    canAccess: canAccessRoute(route),
    route
  }), [canAccessRoute, route])
}

/**
 * Hook for checking component access
 */
export const useComponentAccess = (componentName: ComponentName) => {
  const { canAccessComponent } = usePermissions()
  
  return useMemo(() => ({
    canAccess: canAccessComponent(componentName),
    componentName
  }), [canAccessComponent, componentName])
}