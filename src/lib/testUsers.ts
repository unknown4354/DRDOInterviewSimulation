/**
 * Test Users and Role Switching System
 * Provides test users for each role and utilities for testing workflows
 */

import { UserRole, SecurityLevel } from './permissions'

export interface TestUser {
  id: string
  email: string
  password: string
  full_name: string
  role: UserRole
  security_clearance: SecurityLevel
  department: string
  position: string
  phone: string
  is_active: boolean
  email_verified: boolean
  account_activated: boolean
  created_at: Date
  last_login?: Date
  profile_completed: boolean
  mfa_enabled: boolean
  test_user: boolean
  description: string
}

export const TEST_USERS: TestUser[] = [
  // Administrator Test Users
  {
    id: 'admin-001',
    email: 'admin@drdo.test',
    password: 'Admin@123',
    full_name: 'Dr. Rajesh Kumar',
    role: UserRole.ADMINISTRATOR,
    security_clearance: SecurityLevel.TOP_SECRET,
    department: 'Information Technology',
    position: 'System Administrator',
    phone: '+91-9876543210',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-01'),
    last_login: new Date(),
    profile_completed: true,
    mfa_enabled: true,
    test_user: true,
    description: 'Primary system administrator with full access to all system functions'
  },
  {
    id: 'admin-002',
    email: 'security.admin@drdo.test',
    password: 'SecAdmin@456',
    full_name: 'Ms. Priya Sharma',
    role: UserRole.ADMINISTRATOR,
    security_clearance: SecurityLevel.SECRET,
    department: 'Security & Compliance',
    position: 'Security Administrator',
    phone: '+91-9876543211',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-02'),
    last_login: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    profile_completed: true,
    mfa_enabled: true,
    test_user: true,
    description: 'Security-focused administrator specializing in compliance and audit'
  },

  // Selector Test Users
  {
    id: 'selector-001',
    email: 'selector.lead@drdo.test',
    password: 'Selector@789',
    full_name: 'Dr. Amit Patel',
    role: UserRole.SELECTOR,
    security_clearance: SecurityLevel.SECRET,
    department: 'Human Resources',
    position: 'Senior Interview Panel Lead',
    phone: '+91-9876543212',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-03'),
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    profile_completed: true,
    mfa_enabled: true,
    test_user: true,
    description: 'Experienced selector with expertise in technical interviews'
  },
  {
    id: 'selector-002',
    email: 'technical.selector@drdo.test',
    password: 'TechSel@321',
    full_name: 'Prof. Sunita Verma',
    role: UserRole.SELECTOR,
    security_clearance: SecurityLevel.CONFIDENTIAL,
    department: 'Engineering',
    position: 'Technical Interview Specialist',
    phone: '+91-9876543213',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-04'),
    last_login: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    profile_completed: true,
    mfa_enabled: false,
    test_user: true,
    description: 'Technical specialist focusing on engineering and scientific roles'
  },
  {
    id: 'selector-003',
    email: 'junior.selector@drdo.test',
    password: 'JuniorSel@654',
    full_name: 'Mr. Vikash Singh',
    role: UserRole.SELECTOR,
    security_clearance: SecurityLevel.RESTRICTED,
    department: 'Human Resources',
    position: 'Junior Selector',
    phone: '+91-9876543214',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-05'),
    last_login: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    profile_completed: true,
    mfa_enabled: false,
    test_user: true,
    description: 'New selector with limited access, learning the interview process'
  },

  // Candidate Test Users
  {
    id: 'candidate-001',
    email: 'candidate.active@drdo.test',
    password: 'Candidate@123',
    full_name: 'Mr. Arjun Reddy',
    role: UserRole.CANDIDATE,
    security_clearance: SecurityLevel.PUBLIC,
    department: 'N/A',
    position: 'Software Engineer Applicant',
    phone: '+91-9876543215',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-10'),
    last_login: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    profile_completed: true,
    mfa_enabled: false,
    test_user: true,
    description: 'Active candidate with completed profile, ready for interviews'
  },
  {
    id: 'candidate-002',
    email: 'candidate.pending@drdo.test',
    password: 'PendingCand@456',
    full_name: 'Ms. Kavya Nair',
    role: UserRole.CANDIDATE,
    security_clearance: SecurityLevel.PUBLIC,
    department: 'N/A',
    position: 'Data Scientist Applicant',
    phone: '+91-9876543216',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-12'),
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    profile_completed: false,
    mfa_enabled: false,
    test_user: true,
    description: 'Candidate with incomplete profile, needs to complete registration'
  },
  {
    id: 'candidate-003',
    email: 'candidate.new@drdo.test',
    password: 'NewCand@789',
    full_name: 'Mr. Rohit Gupta',
    role: UserRole.CANDIDATE,
    security_clearance: SecurityLevel.PUBLIC,
    department: 'N/A',
    position: 'Research Scientist Applicant',
    phone: '+91-9876543217',
    is_active: true,
    email_verified: false,
    account_activated: false,
    created_at: new Date('2024-01-15'),
    profile_completed: false,
    mfa_enabled: false,
    test_user: true,
    description: 'Newly registered candidate, email verification pending'
  },

  // Observer Test Users
  {
    id: 'observer-001',
    email: 'quality.observer@drdo.test',
    password: 'Observer@123',
    full_name: 'Dr. Meera Joshi',
    role: UserRole.OBSERVER,
    security_clearance: SecurityLevel.SECRET,
    department: 'Quality Assurance',
    position: 'Senior Quality Observer',
    phone: '+91-9876543218',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-06'),
    last_login: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
    profile_completed: true,
    mfa_enabled: true,
    test_user: true,
    description: 'Senior observer specializing in interview quality assessment'
  },
  {
    id: 'observer-002',
    email: 'compliance.observer@drdo.test',
    password: 'CompObs@456',
    full_name: 'Mr. Suresh Kumar',
    role: UserRole.OBSERVER,
    security_clearance: SecurityLevel.CONFIDENTIAL,
    department: 'Compliance',
    position: 'Compliance Observer',
    phone: '+91-9876543219',
    is_active: true,
    email_verified: true,
    account_activated: true,
    created_at: new Date('2024-01-07'),
    last_login: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    profile_completed: true,
    mfa_enabled: false,
    test_user: true,
    description: 'Compliance-focused observer ensuring regulatory adherence'
  },

  // Inactive/Deactivated Test Users
  {
    id: 'inactive-001',
    email: 'inactive.user@drdo.test',
    password: 'Inactive@123',
    full_name: 'Mr. Deactivated User',
    role: UserRole.CANDIDATE,
    security_clearance: SecurityLevel.PUBLIC,
    department: 'N/A',
    position: 'Former Applicant',
    phone: '+91-9876543220',
    is_active: false,
    email_verified: true,
    account_activated: false,
    created_at: new Date('2024-01-01'),
    last_login: new Date('2024-01-01'),
    profile_completed: true,
    mfa_enabled: false,
    test_user: true,
    description: 'Deactivated user for testing access control'
  }
]

export interface TestScenario {
  id: string
  name: string
  description: string
  user_id: string
  expected_permissions: string[]
  restricted_routes: string[]
  test_actions: TestAction[]
}

export interface TestAction {
  action: string
  route?: string
  expected_result: 'success' | 'denied' | 'redirect'
  description: string
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'admin-full-access',
    name: 'Administrator Full Access Test',
    description: 'Test that administrators have access to all system functions',
    user_id: 'admin-001',
    expected_permissions: [
      'USER_MANAGE', 'ROLE_ASSIGN', 'SYSTEM_CONFIG', 'SECURITY_MANAGE',
      'INTERVIEW_CREATE', 'INTERVIEW_MANAGE', 'ANALYTICS_VIEW', 'REPORTS_VIEW'
    ],
    restricted_routes: [],
    test_actions: [
      {
        action: 'access_user_management',
        route: '/admin/users',
        expected_result: 'success',
        description: 'Should access user management interface'
      },
      {
        action: 'access_security_settings',
        route: '/security',
        expected_result: 'success',
        description: 'Should access security management'
      },
      {
        action: 'create_interview',
        route: '/interviews/create',
        expected_result: 'success',
        description: 'Should be able to create interviews'
      }
    ]
  },
  {
    id: 'selector-interview-access',
    name: 'Selector Interview Management Test',
    description: 'Test that selectors can manage interviews but not system settings',
    user_id: 'selector-001',
    expected_permissions: [
      'INTERVIEW_CREATE', 'INTERVIEW_MANAGE', 'INTERVIEW_EVALUATE',
      'QUESTION_BANK_MANAGE', 'ANALYTICS_VIEW'
    ],
    restricted_routes: ['/admin', '/security'],
    test_actions: [
      {
        action: 'access_interview_management',
        route: '/interviews',
        expected_result: 'success',
        description: 'Should access interview management'
      },
      {
        action: 'access_admin_panel',
        route: '/admin',
        expected_result: 'denied',
        description: 'Should be denied access to admin panel'
      },
      {
        action: 'access_security_settings',
        route: '/security',
        expected_result: 'denied',
        description: 'Should be denied access to security settings'
      }
    ]
  },
  {
    id: 'candidate-profile-access',
    name: 'Candidate Profile Management Test',
    description: 'Test that candidates can only access their profile and interviews',
    user_id: 'candidate-001',
    expected_permissions: ['PROFILE_MANAGE', 'INTERVIEW_PARTICIPATE'],
    restricted_routes: ['/admin', '/interviews/manage', '/security', '/observer'],
    test_actions: [
      {
        action: 'access_profile',
        route: '/profile',
        expected_result: 'success',
        description: 'Should access own profile'
      },
      {
        action: 'access_interview_management',
        route: '/interviews/manage',
        expected_result: 'denied',
        description: 'Should be denied access to interview management'
      },
      {
        action: 'access_admin_panel',
        route: '/admin',
        expected_result: 'denied',
        description: 'Should be denied access to admin panel'
      }
    ]
  },
  {
    id: 'observer-monitoring-access',
    name: 'Observer Monitoring Access Test',
    description: 'Test that observers have read-only access to monitoring functions',
    user_id: 'observer-001',
    expected_permissions: [
      'INTERVIEW_OBSERVE', 'ANALYTICS_VIEW', 'REPORTS_VIEW', 'AUDIT_VIEW'
    ],
    restricted_routes: ['/admin', '/interviews/create', '/security'],
    test_actions: [
      {
        action: 'access_observer_dashboard',
        route: '/observer',
        expected_result: 'success',
        description: 'Should access observer dashboard'
      },
      {
        action: 'access_analytics',
        route: '/observer/analytics',
        expected_result: 'success',
        description: 'Should access analytics'
      },
      {
        action: 'access_interview_creation',
        route: '/interviews/create',
        expected_result: 'denied',
        description: 'Should be denied access to interview creation'
      }
    ]
  },
  {
    id: 'security-clearance-test',
    name: 'Security Clearance Access Test',
    description: 'Test that users can only access content matching their security clearance',
    user_id: 'selector-003', // Junior selector with RESTRICTED clearance
    expected_permissions: ['INTERVIEW_CREATE', 'INTERVIEW_MANAGE'],
    restricted_routes: ['/admin', '/security', '/classified-content'],
    test_actions: [
      {
        action: 'access_restricted_content',
        route: '/interviews',
        expected_result: 'success',
        description: 'Should access basic interview functions'
      },
      {
        action: 'access_classified_content',
        route: '/classified-content',
        expected_result: 'denied',
        description: 'Should be denied access to classified content'
      }
    ]
  },
  {
    id: 'inactive-user-test',
    name: 'Inactive User Access Test',
    description: 'Test that inactive users cannot access the system',
    user_id: 'inactive-001',
    expected_permissions: [],
    restricted_routes: ['*'],
    test_actions: [
      {
        action: 'login_attempt',
        expected_result: 'denied',
        description: 'Should be denied login access'
      },
      {
        action: 'access_any_route',
        route: '/dashboard',
        expected_result: 'redirect',
        description: 'Should be redirected to login'
      }
    ]
  }
]

class TestUserManager {
  private static instance: TestUserManager
  private currentTestUser: TestUser | null = null
  private originalUser: any = null

  static getInstance(): TestUserManager {
    if (!TestUserManager.instance) {
      TestUserManager.instance = new TestUserManager()
    }
    return TestUserManager.instance
  }

  // Get test user by ID
  getTestUser(userId: string): TestUser | undefined {
    return TEST_USERS.find(user => user.id === userId)
  }

  // Get test users by role
  getTestUsersByRole(role: UserRole): TestUser[] {
    return TEST_USERS.filter(user => user.role === role)
  }

  // Get all active test users
  getActiveTestUsers(): TestUser[] {
    return TEST_USERS.filter(user => user.is_active)
  }

  // Switch to test user (for testing purposes)
  async switchToTestUser(userId: string): Promise<boolean> {
    const testUser = this.getTestUser(userId)
    if (!testUser) {
      console.error(`Test user ${userId} not found`)
      return false
    }

    try {
      // Store original user if not already stored
      if (!this.originalUser) {
        this.originalUser = this.getCurrentUser()
      }

      // Switch to test user
      this.currentTestUser = testUser
      await this.updateAuthContext(testUser)
      
      console.log(`Switched to test user: ${testUser.full_name} (${testUser.role})`)
      return true
    } catch (error) {
      console.error('Error switching to test user:', error)
      return false
    }
  }

  // Restore original user
  async restoreOriginalUser(): Promise<boolean> {
    if (!this.originalUser) {
      console.warn('No original user to restore')
      return false
    }

    try {
      await this.updateAuthContext(this.originalUser)
      this.currentTestUser = null
      this.originalUser = null
      
      console.log('Restored original user')
      return true
    } catch (error) {
      console.error('Error restoring original user:', error)
      return false
    }
  }

  // Check if currently using a test user
  isUsingTestUser(): boolean {
    return this.currentTestUser !== null
  }

  // Get current test user
  getCurrentTestUser(): TestUser | null {
    return this.currentTestUser
  }

  // Run test scenario
  async runTestScenario(scenarioId: string): Promise<{
    success: boolean
    results: Array<{
      action: string
      expected: string
      actual: string
      passed: boolean
    }>
  }> {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) {
      throw new Error(`Test scenario ${scenarioId} not found`)
    }

    const testUser = this.getTestUser(scenario.user_id)
    if (!testUser) {
      throw new Error(`Test user ${scenario.user_id} not found`)
    }

    // Switch to test user
    await this.switchToTestUser(scenario.user_id)

    const results = []
    let allPassed = true

    // Run each test action
    for (const action of scenario.test_actions) {
      try {
        const result = await this.executeTestAction(action)
        const passed = result === action.expected_result
        
        results.push({
          action: action.action,
          expected: action.expected_result,
          actual: result,
          passed
        })

        if (!passed) {
          allPassed = false
        }
      } catch (error) {
        results.push({
          action: action.action,
          expected: action.expected_result,
          actual: 'error',
          passed: false
        })
        allPassed = false
      }
    }

    return {
      success: allPassed,
      results
    }
  }

  // Execute individual test action
  private async executeTestAction(action: TestAction): Promise<string> {
    // This would integrate with your routing and permission system
    // For now, return mock results based on the action
    
    if (action.route) {
      // Check if route is accessible
      const hasAccess = await this.checkRouteAccess(action.route)
      if (hasAccess) {
        return 'success'
      } else {
        return 'denied'
      }
    }

    // Handle non-route actions
    switch (action.action) {
      case 'login_attempt':
        return this.currentTestUser?.is_active ? 'success' : 'denied'
      default:
        return 'success'
    }
  }

  // Check route access (mock implementation)
  private async checkRouteAccess(route: string): Promise<boolean> {
    if (!this.currentTestUser) return false
    
    // Mock route access logic based on user role
    const restrictedRoutes = {
      [UserRole.CANDIDATE]: ['/admin', '/interviews/manage', '/security', '/observer'],
      [UserRole.SELECTOR]: ['/admin', '/security'],
      [UserRole.OBSERVER]: ['/admin', '/interviews/create', '/security'],
      [UserRole.ADMINISTRATOR]: []
    }

    const userRestrictedRoutes = restrictedRoutes[this.currentTestUser.role] || []
    return !userRestrictedRoutes.some(restricted => route.startsWith(restricted))
  }

  // Get current user (mock implementation)
  private getCurrentUser(): any {
    // This would integrate with your auth context
    return {
      id: 'original-user',
      email: 'original@example.com',
      role: UserRole.ADMINISTRATOR
    }
  }

  // Update auth context (mock implementation)
  private async updateAuthContext(user: any): Promise<void> {
    // This would update your actual auth context
    console.log('Updating auth context for user:', user.email)
  }

  // Generate test report
  generateTestReport(): {
    total_users: number
    users_by_role: Record<UserRole, number>
    active_users: number
    verified_users: number
    mfa_enabled_users: number
  } {
    const usersByRole = TEST_USERS.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<UserRole, number>)

    return {
      total_users: TEST_USERS.length,
      users_by_role: usersByRole,
      active_users: TEST_USERS.filter(u => u.is_active).length,
      verified_users: TEST_USERS.filter(u => u.email_verified).length,
      mfa_enabled_users: TEST_USERS.filter(u => u.mfa_enabled).length
    }
  }
}

export const testUserManager = TestUserManager.getInstance()

// Utility functions for testing
export const TestUtils = {
  // Quick login as test user
  quickLogin: async (userRole: UserRole): Promise<TestUser | null> => {
    const users = testUserManager.getTestUsersByRole(userRole)
    const activeUser = users.find(u => u.is_active && u.email_verified)
    
    if (activeUser) {
      await testUserManager.switchToTestUser(activeUser.id)
      return activeUser
    }
    
    return null
  },

  // Run all test scenarios
  runAllTests: async (): Promise<{
    total: number
    passed: number
    failed: number
    results: Array<{
      scenario: string
      success: boolean
      details: any
    }>
  }> => {
    const results = []
    let passed = 0
    let failed = 0

    for (const scenario of TEST_SCENARIOS) {
      try {
        const result = await testUserManager.runTestScenario(scenario.id)
        results.push({
          scenario: scenario.name,
          success: result.success,
          details: result.results
        })
        
        if (result.success) {
          passed++
        } else {
          failed++
        }
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          details: { error: error.message }
        })
        failed++
      }
    }

    return {
      total: TEST_SCENARIOS.length,
      passed,
      failed,
      results
    }
  },

  // Get test credentials for quick reference
  getTestCredentials: (): Array<{
    role: UserRole
    email: string
    password: string
    description: string
  }> => {
    return TEST_USERS
      .filter(user => user.is_active && user.email_verified)
      .map(user => ({
        role: user.role,
        email: user.email,
        password: user.password,
        description: user.description
      }))
  }
}