/**
 * Comprehensive Role-Based Access Control (RBAC) System
 * Defines permissions, roles, and access control utilities
 */

// Define user roles
export enum UserRole {
  ADMINISTRATOR = 'Administrator',
  SELECTOR = 'Selector',
  CANDIDATE = 'Candidate',
  OBSERVER = 'Observer'
}

// Define security clearance levels
export enum SecurityLevel {
  PUBLIC = 'Public',
  RESTRICTED = 'Restricted',
  CONFIDENTIAL = 'Confidential',
  SECRET = 'Secret',
  TOP_SECRET = 'Top Secret'
}

// Define all system permissions
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ACTIVATE = 'user:activate',
  USER_DEACTIVATE = 'user:deactivate',
  USER_ASSIGN_ROLE = 'user:assign_role',
  USER_MANAGE_PERMISSIONS = 'user:manage_permissions',

  // Interview Management
  INTERVIEW_CREATE = 'interview:create',
  INTERVIEW_READ = 'interview:read',
  INTERVIEW_UPDATE = 'interview:update',
  INTERVIEW_DELETE = 'interview:delete',
  INTERVIEW_SCHEDULE = 'interview:schedule',
  INTERVIEW_CONDUCT = 'interview:conduct',
  INTERVIEW_EVALUATE = 'interview:evaluate',
  INTERVIEW_MODERATE = 'interview:moderate',
  INTERVIEW_JOIN = 'interview:join',
  INTERVIEW_OBSERVE = 'interview:observe',

  // Question Management
  QUESTION_CREATE = 'question:create',
  QUESTION_READ = 'question:read',
  QUESTION_UPDATE = 'question:update',
  QUESTION_DELETE = 'question:delete',
  QUESTION_BANK_MANAGE = 'question:bank_manage',

  // Analytics and Reports
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  REPORTS_VIEW = 'reports:view',
  REPORTS_CREATE = 'reports:create',
  REPORTS_EXPORT = 'reports:export',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_AUDIT = 'system:audit',
  SYSTEM_SECURITY = 'system:security',

  // Organization Management
  ORG_CREATE = 'org:create',
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',

  // Profile Management
  PROFILE_READ = 'profile:read',
  PROFILE_UPDATE = 'profile:update',
  PROFILE_DELETE = 'profile:delete',

  // Security Operations
  SECURITY_VIEW_LOGS = 'security:view_logs',
  SECURITY_MANAGE_MFA = 'security:manage_mfa',
  SECURITY_MANAGE_SESSIONS = 'security:manage_sessions',
  SECURITY_INCIDENT_RESPONSE = 'security:incident_response',

  // AI and ML Operations
  AI_CONFIGURE = 'ai:configure',
  AI_MONITOR = 'ai:monitor',
  AI_RETRAIN = 'ai:retrain',

  // Communication
  COMM_SEND_NOTIFICATIONS = 'comm:send_notifications',
  COMM_BROADCAST = 'comm:broadcast',
  COMM_MODERATE = 'comm:moderate'
}

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMINISTRATOR]: [
    // Full system access
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ACTIVATE,
    Permission.USER_DEACTIVATE,
    Permission.USER_ASSIGN_ROLE,
    Permission.USER_MANAGE_PERMISSIONS,
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_DELETE,
    Permission.INTERVIEW_SCHEDULE,
    Permission.INTERVIEW_CONDUCT,
    Permission.INTERVIEW_EVALUATE,
    Permission.INTERVIEW_MODERATE,
    Permission.INTERVIEW_OBSERVE,
    Permission.QUESTION_CREATE,
    Permission.QUESTION_READ,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_DELETE,
    Permission.QUESTION_BANK_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_MONITOR,
    Permission.SYSTEM_BACKUP,
    Permission.SYSTEM_AUDIT,
    Permission.SYSTEM_SECURITY,
    Permission.ORG_CREATE,
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_DELETE,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.PROFILE_DELETE,
    Permission.SECURITY_VIEW_LOGS,
    Permission.SECURITY_MANAGE_MFA,
    Permission.SECURITY_MANAGE_SESSIONS,
    Permission.SECURITY_INCIDENT_RESPONSE,
    Permission.AI_CONFIGURE,
    Permission.AI_MONITOR,
    Permission.AI_RETRAIN,
    Permission.COMM_SEND_NOTIFICATIONS,
    Permission.COMM_BROADCAST,
    Permission.COMM_MODERATE
  ],

  [UserRole.SELECTOR]: [
    // Interview and evaluation focused permissions
    Permission.USER_READ, // Can view candidate profiles
    Permission.INTERVIEW_CREATE,
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_UPDATE,
    Permission.INTERVIEW_SCHEDULE,
    Permission.INTERVIEW_CONDUCT,
    Permission.INTERVIEW_EVALUATE,
    Permission.INTERVIEW_MODERATE,
    Permission.QUESTION_CREATE,
    Permission.QUESTION_READ,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_BANK_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_CREATE,
    Permission.REPORTS_EXPORT,
    Permission.ORG_READ,
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.AI_MONITOR,
    Permission.COMM_SEND_NOTIFICATIONS
  ],

  [UserRole.CANDIDATE]: [
    // Limited permissions for candidates
    Permission.INTERVIEW_READ, // Can view their own interviews
    Permission.INTERVIEW_JOIN, // Can join interviews they're invited to
    Permission.PROFILE_READ,
    Permission.PROFILE_UPDATE,
    Permission.REPORTS_VIEW // Can view their own results
  ],

  [UserRole.OBSERVER]: [
    // Read-only monitoring permissions
    Permission.INTERVIEW_READ,
    Permission.INTERVIEW_OBSERVE,
    Permission.QUESTION_READ,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.ORG_READ,
    Permission.PROFILE_READ
  ]
}

// Security clearance requirements for sensitive operations
export const CLEARANCE_REQUIREMENTS: Record<Permission, SecurityLevel> = {
  [Permission.USER_CREATE]: SecurityLevel.RESTRICTED,
  [Permission.USER_DELETE]: SecurityLevel.CONFIDENTIAL,
  [Permission.USER_ASSIGN_ROLE]: SecurityLevel.CONFIDENTIAL,
  [Permission.USER_MANAGE_PERMISSIONS]: SecurityLevel.SECRET,
  [Permission.SYSTEM_CONFIG]: SecurityLevel.CONFIDENTIAL,
  [Permission.SYSTEM_SECURITY]: SecurityLevel.SECRET,
  [Permission.SECURITY_INCIDENT_RESPONSE]: SecurityLevel.SECRET,
  [Permission.AI_CONFIGURE]: SecurityLevel.RESTRICTED,
  [Permission.AI_RETRAIN]: SecurityLevel.CONFIDENTIAL,
  // Default to PUBLIC for other permissions
  ...Object.values(Permission).reduce((acc, perm) => {
    if (!acc[perm]) {
      acc[perm] = SecurityLevel.PUBLIC
    }
    return acc
  }, {} as Record<Permission, SecurityLevel>)
}

/**
 * Permission checking utilities
 */
export class PermissionChecker {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(
    userRole: UserRole,
    permission: Permission,
    userClearance: SecurityLevel = SecurityLevel.PUBLIC
  ): boolean {
    // Check if role has the permission
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    if (!rolePermissions.includes(permission)) {
      return false
    }

    // Check security clearance requirement
    const requiredClearance = CLEARANCE_REQUIREMENTS[permission] || SecurityLevel.PUBLIC
    return this.hasClearance(userClearance, requiredClearance)
  }

  /**
   * Check if user has required security clearance
   */
  static hasClearance(userClearance: SecurityLevel, requiredClearance: SecurityLevel): boolean {
    const clearanceLevels = [SecurityLevel.PUBLIC, SecurityLevel.RESTRICTED, SecurityLevel.CONFIDENTIAL, SecurityLevel.SECRET]
    const userLevel = clearanceLevels.indexOf(userClearance)
    const requiredLevel = clearanceLevels.indexOf(requiredClearance)
    return userLevel >= requiredLevel
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if user can access a resource based on ownership
   */
  static canAccessResource(
    userRole: UserRole,
    permission: Permission,
    resourceOwnerId: string,
    currentUserId: string,
    userClearance: SecurityLevel = SecurityLevel.PUBLIC
  ): boolean {
    // Administrators can access everything
    if (userRole === UserRole.ADMINISTRATOR) {
      return this.hasPermission(userRole, permission, userClearance)
    }

    // Users can access their own resources
    if (resourceOwnerId === currentUserId) {
      return this.hasPermission(userRole, permission, userClearance)
    }

    // Check if user has permission for others' resources
    return this.hasPermission(userRole, permission, userClearance)
  }

  /**
   * Filter permissions based on security clearance
   */
  static filterPermissionsByClearance(
    permissions: Permission[],
    userClearance: SecurityLevel
  ): Permission[] {
    return permissions.filter(permission => 
      this.hasClearance(userClearance, CLEARANCE_REQUIREMENTS[permission] || SecurityLevel.PUBLIC)
    )
  }
}

/**
 * Route-based permissions mapping
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/admin': [Permission.SYSTEM_CONFIG],
  '/admin/users': [Permission.USER_READ],
  '/admin/users/create': [Permission.USER_CREATE],
  '/admin/users/:id/edit': [Permission.USER_UPDATE],
  '/admin/users/:id/delete': [Permission.USER_DELETE],
  '/admin/system': [Permission.SYSTEM_CONFIG],
  '/admin/security': [Permission.SYSTEM_SECURITY],
  '/admin/audit': [Permission.SYSTEM_AUDIT],
  
  '/interviews': [Permission.INTERVIEW_READ],
  '/interviews/create': [Permission.INTERVIEW_CREATE],
  '/interviews/:id': [Permission.INTERVIEW_READ],
  '/interviews/:id/edit': [Permission.INTERVIEW_UPDATE],
  '/interviews/:id/conduct': [Permission.INTERVIEW_CONDUCT],
  '/interviews/:id/evaluate': [Permission.INTERVIEW_EVALUATE],
  
  '/questions': [Permission.QUESTION_READ],
  '/questions/create': [Permission.QUESTION_CREATE],
  '/questions/bank': [Permission.QUESTION_BANK_MANAGE],
  
  '/analytics': [Permission.ANALYTICS_VIEW],
  '/reports': [Permission.REPORTS_VIEW],
  '/reports/create': [Permission.REPORTS_CREATE],
  
  '/profile': [Permission.PROFILE_READ],
  '/profile/edit': [Permission.PROFILE_UPDATE]
}

/**
 * Component-level permission requirements
 */
export const COMPONENT_PERMISSIONS = {
  UserManagementTable: [Permission.USER_READ],
  CreateUserButton: [Permission.USER_CREATE],
  EditUserButton: [Permission.USER_UPDATE],
  DeleteUserButton: [Permission.USER_DELETE],
  InterviewScheduler: [Permission.INTERVIEW_CREATE, Permission.INTERVIEW_SCHEDULE],
  InterviewEvaluator: [Permission.INTERVIEW_EVALUATE],
  QuestionBank: [Permission.QUESTION_BANK_MANAGE],
  SystemSettings: [Permission.SYSTEM_CONFIG],
  SecurityLogs: [Permission.SECURITY_VIEW_LOGS],
  AnalyticsDashboard: [Permission.ANALYTICS_VIEW],
  ReportGenerator: [Permission.REPORTS_CREATE]
} as const

export type ComponentName = keyof typeof COMPONENT_PERMISSIONS