/**
 * Security Management System
 * Handles MFA, session management, device tracking, and security logging
 */

export interface SecurityEvent {
  id: string
  user_id: string
  event_type: SecurityEventType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata: Record<string, any>
  ip_address: string
  user_agent: string
  timestamp: Date
  resolved: boolean
  resolved_by?: string
  resolved_at?: Date
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_SUCCESS = 'mfa_success',
  MFA_FAILED = 'mfa_failed',
  DEVICE_REGISTERED = 'device_registered',
  DEVICE_REMOVED = 'device_removed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_DENIED = 'permission_denied',
  DATA_ACCESS = 'data_access',
  DATA_EXPORT = 'data_export',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  SESSION_EXPIRED = 'session_expired',
  CONCURRENT_SESSION = 'concurrent_session',
  ROLE_CHANGED = 'role_changed',
  SECURITY_SETTINGS_CHANGED = 'security_settings_changed'
}

export interface MFAMethod {
  id: string
  type: 'totp' | 'sms' | 'email' | 'backup_codes'
  name: string
  enabled: boolean
  verified: boolean
  created_at: Date
  last_used?: Date
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  id: string
  user_id: string
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  ip_address: string
  location?: {
    country: string
    city: string
    region: string
  }
  trusted: boolean
  first_seen: Date
  last_seen: Date
  session_count: number
  is_current: boolean
}

export interface SessionInfo {
  id: string
  user_id: string
  device_id: string
  ip_address: string
  user_agent: string
  created_at: Date
  last_activity: Date
  expires_at: Date
  is_active: boolean
  location?: {
    country: string
    city: string
    region: string
  }
}

export interface SecuritySettings {
  user_id: string
  mfa_required: boolean
  session_timeout_minutes: number
  max_concurrent_sessions: number
  device_trust_duration_days: number
  login_attempt_limit: number
  lockout_duration_minutes: number
  password_expiry_days: number
  require_password_change: boolean
  allow_remember_device: boolean
  email_notifications: boolean
  sms_notifications: boolean
  updated_at: Date
}

export interface PasswordPolicy {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_numbers: boolean
  require_special_chars: boolean
  prevent_reuse_count: number
  expiry_days: number
  complexity_score_min: number
}

class SecurityManager {
  private static instance: SecurityManager
  private securityEvents: SecurityEvent[] = []
  private activeSessions: Map<string, SessionInfo> = new Map()
  private trustedDevices: Map<string, DeviceInfo> = new Map()
  private mfaMethods: Map<string, MFAMethod[]> = new Map()

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Security Event Logging
  async logSecurityEvent(
    userId: string,
    eventType: SecurityEventType,
    severity: SecurityEvent['severity'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateId(),
      user_id: userId,
      event_type: eventType,
      severity,
      description,
      metadata,
      ip_address: await this.getCurrentIP(),
      user_agent: navigator.userAgent,
      timestamp: new Date(),
      resolved: false
    }

    this.securityEvents.push(event)
    
    // Send to backend for persistence
    try {
      await this.sendEventToBackend(event)
    } catch (error) {
      console.error('Failed to log security event:', error)
    }

    // Trigger alerts for high severity events
    if (severity === 'high' || severity === 'critical') {
      await this.triggerSecurityAlert(event)
    }
  }

  async getSecurityEvents(
    userId?: string,
    eventType?: SecurityEventType,
    severity?: SecurityEvent['severity'],
    limit: number = 100
  ): Promise<SecurityEvent[]> {
    let events = [...this.securityEvents]

    if (userId) {
      events = events.filter(event => event.user_id === userId)
    }

    if (eventType) {
      events = events.filter(event => event.event_type === eventType)
    }

    if (severity) {
      events = events.filter(event => event.severity === severity)
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // MFA Management
  async enableMFA(userId: string, method: Omit<MFAMethod, 'id' | 'created_at'>): Promise<MFAMethod> {
    const mfaMethod: MFAMethod = {
      ...method,
      id: this.generateId(),
      created_at: new Date()
    }

    const userMethods = this.mfaMethods.get(userId) || []
    userMethods.push(mfaMethod)
    this.mfaMethods.set(userId, userMethods)

    await this.logSecurityEvent(
      userId,
      SecurityEventType.MFA_ENABLED,
      'medium',
      `MFA method ${method.type} enabled`,
      { method_type: method.type, method_name: method.name }
    )

    return mfaMethod
  }

  async disableMFA(userId: string, methodId: string): Promise<void> {
    const userMethods = this.mfaMethods.get(userId) || []
    const methodIndex = userMethods.findIndex(m => m.id === methodId)
    
    if (methodIndex === -1) {
      throw new Error('MFA method not found')
    }

    const method = userMethods[methodIndex]
    userMethods.splice(methodIndex, 1)
    this.mfaMethods.set(userId, userMethods)

    await this.logSecurityEvent(
      userId,
      SecurityEventType.MFA_DISABLED,
      'medium',
      `MFA method ${method.type} disabled`,
      { method_type: method.type, method_name: method.name }
    )
  }

  async verifyMFA(userId: string, methodId: string, code: string): Promise<boolean> {
    const userMethods = this.mfaMethods.get(userId) || []
    const method = userMethods.find(m => m.id === methodId)
    
    if (!method) {
      await this.logSecurityEvent(
        userId,
        SecurityEventType.MFA_FAILED,
        'medium',
        'MFA verification failed - method not found',
        { method_id: methodId }
      )
      return false
    }

    // TODO: Implement actual MFA verification logic
    const isValid = await this.validateMFACode(method, code)
    
    if (isValid) {
      method.last_used = new Date()
      await this.logSecurityEvent(
        userId,
        SecurityEventType.MFA_SUCCESS,
        'low',
        `MFA verification successful for ${method.type}`,
        { method_type: method.type }
      )
    } else {
      await this.logSecurityEvent(
        userId,
        SecurityEventType.MFA_FAILED,
        'medium',
        `MFA verification failed for ${method.type}`,
        { method_type: method.type }
      )
    }

    return isValid
  }

  getMFAMethods(userId: string): MFAMethod[] {
    return this.mfaMethods.get(userId) || []
  }

  // Session Management
  async createSession(userId: string, deviceInfo: Partial<DeviceInfo>): Promise<SessionInfo> {
    const deviceId = await this.registerOrUpdateDevice(userId, deviceInfo)
    
    const session: SessionInfo = {
      id: this.generateId(),
      user_id: userId,
      device_id: deviceId,
      ip_address: await this.getCurrentIP(),
      user_agent: navigator.userAgent,
      created_at: new Date(),
      last_activity: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      is_active: true,
      location: await this.getLocationFromIP()
    }

    this.activeSessions.set(session.id, session)

    await this.logSecurityEvent(
      userId,
      SecurityEventType.LOGIN_SUCCESS,
      'low',
      'User session created',
      { session_id: session.id, device_id: deviceId }
    )

    return session
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.last_activity = new Date()
      this.activeSessions.set(sessionId, session)
    }
  }

  async terminateSession(sessionId: string, reason: string = 'user_logout'): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.is_active = false
      this.activeSessions.delete(sessionId)

      await this.logSecurityEvent(
        session.user_id,
        SecurityEventType.LOGOUT,
        'low',
        `Session terminated: ${reason}`,
        { session_id: sessionId, reason }
      )
    }
  }

  async terminateAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.user_id === userId && session.id !== exceptSessionId)

    for (const session of userSessions) {
      await this.terminateSession(session.id, 'admin_action')
    }
  }

  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.user_id === userId && session.is_active)
  }

  // Device Management
  async registerOrUpdateDevice(userId: string, deviceInfo: Partial<DeviceInfo>): Promise<string> {
    const deviceFingerprint = await this.generateDeviceFingerprint()
    let device = Array.from(this.trustedDevices.values())
      .find(d => d.user_id === userId && d.id === deviceFingerprint)

    if (device) {
      // Update existing device
      device.last_seen = new Date()
      device.session_count += 1
      device.is_current = true
    } else {
      // Register new device
      device = {
        id: deviceFingerprint,
        user_id: userId,
        device_name: deviceInfo.device_name || this.getDeviceName(),
        device_type: deviceInfo.device_type || this.getDeviceType(),
        browser: this.getBrowserInfo(),
        os: this.getOSInfo(),
        ip_address: await this.getCurrentIP(),
        location: await this.getLocationFromIP(),
        trusted: false,
        first_seen: new Date(),
        last_seen: new Date(),
        session_count: 1,
        is_current: true
      }

      await this.logSecurityEvent(
        userId,
        SecurityEventType.DEVICE_REGISTERED,
        'medium',
        'New device registered',
        { device_id: device.id, device_name: device.device_name }
      )
    }

    this.trustedDevices.set(device.id, device)
    return device.id
  }

  async trustDevice(userId: string, deviceId: string): Promise<void> {
    const device = this.trustedDevices.get(deviceId)
    if (device && device.user_id === userId) {
      device.trusted = true
      this.trustedDevices.set(deviceId, device)

      await this.logSecurityEvent(
        userId,
        SecurityEventType.DEVICE_REGISTERED,
        'low',
        'Device marked as trusted',
        { device_id: deviceId }
      )
    }
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const device = this.trustedDevices.get(deviceId)
    if (device && device.user_id === userId) {
      this.trustedDevices.delete(deviceId)

      // Terminate all sessions for this device
      const deviceSessions = Array.from(this.activeSessions.values())
        .filter(session => session.device_id === deviceId)
      
      for (const session of deviceSessions) {
        await this.terminateSession(session.id, 'device_removed')
      }

      await this.logSecurityEvent(
        userId,
        SecurityEventType.DEVICE_REMOVED,
        'medium',
        'Device removed from trusted devices',
        { device_id: deviceId }
      )
    }
  }

  getUserDevices(userId: string): DeviceInfo[] {
    return Array.from(this.trustedDevices.values())
      .filter(device => device.user_id === userId)
      .sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime())
  }

  // Password Policy
  validatePassword(password: string, policy: PasswordPolicy): {
    isValid: boolean
    errors: string[]
    score: number
  } {
    const errors: string[] = []
    let score = 0

    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`)
    } else {
      score += Math.min(password.length * 2, 20)
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    } else if (/[A-Z]/.test(password)) {
      score += 10
    }

    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    } else if (/[a-z]/.test(password)) {
      score += 10
    }

    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    } else if (/\d/.test(password)) {
      score += 10
    }

    if (policy.require_special_chars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 15
    }

    // Additional complexity checks
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars * 2, 20)

    const isValid = errors.length === 0 && score >= policy.complexity_score_min

    return { isValid, errors, score }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  private async getCurrentIP(): Promise<string> {
    // TODO: Implement actual IP detection
    return '127.0.0.1'
  }

  private async getLocationFromIP(): Promise<{ country: string; city: string; region: string } | undefined> {
    // TODO: Implement geolocation from IP
    return undefined
  }

  private async generateDeviceFingerprint(): Promise<string> {
    // TODO: Implement device fingerprinting
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')

    // Simple hash function
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      return 'Mobile Device'
    }
    return 'Desktop Computer'
  }

  private getDeviceType(): DeviceInfo['device_type'] {
    const ua = navigator.userAgent
    if (/iPad/.test(ua)) return 'tablet'
    if (/Mobile|Android|iPhone/.test(ua)) return 'mobile'
    return 'desktop'
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOSInfo(): string {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private async validateMFACode(method: MFAMethod, code: string): Promise<boolean> {
    // TODO: Implement actual MFA validation
    // This is a mock implementation
    return code.length === 6 && /^\d{6}$/.test(code)
  }

  private async sendEventToBackend(event: SecurityEvent): Promise<void> {
    // TODO: Implement backend API call
    console.log('Security event logged:', event)
  }

  private async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // TODO: Implement alert system (email, SMS, push notifications)
    console.warn('Security alert triggered:', event)
  }
}

export const securityManager = SecurityManager.getInstance()

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_special_chars: true,
  prevent_reuse_count: 5,
  expiry_days: 90,
  complexity_score_min: 60
}

// Security utility functions
export const SecurityUtils = {
  isPasswordExpired: (lastChanged: Date, expiryDays: number): boolean => {
    const expiryDate = new Date(lastChanged.getTime() + expiryDays * 24 * 60 * 60 * 1000)
    return new Date() > expiryDate
  },

  isSessionExpired: (session: SessionInfo): boolean => {
    return new Date() > session.expires_at
  },

  shouldRequireMFA: (user: any, settings: SecuritySettings): boolean => {
    return settings.mfa_required || user.role === 'Administrator'
  },

  calculateRiskScore: (events: SecurityEvent[]): number => {
    let score = 0
    const recentEvents = events.filter(e => 
      e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
    )

    recentEvents.forEach(event => {
      switch (event.severity) {
        case 'critical': score += 50; break
        case 'high': score += 25; break
        case 'medium': score += 10; break
        case 'low': score += 2; break
      }
    })

    return Math.min(score, 100)
  }
}