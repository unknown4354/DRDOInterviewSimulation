// Authentication and authorization types for DRDO system

import { BaseEntity } from './common';

export enum UserRole {
  ADMINISTRATOR = 'administrator',
  SELECTOR = 'selector',
  CANDIDATE = 'candidate',
  OBSERVER = 'observer'
}

export enum SecurityLevel {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret'
}

export enum MFAMethod {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  BIOMETRIC = 'biometric'
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaToken?: string;
  deviceId: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  permissions: string[];
  expiresIn: number;
  requiresMFA: boolean;
  mfaMethods?: MFAMethod[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId: string;
}

export interface MFASetupRequest {
  method: MFAMethod;
  phoneNumber?: string;
  email?: string;
}

export interface MFAVerificationRequest {
  token: string;
  method: MFAMethod;
  deviceId: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  expertise: string[];
  securityClearance: SecurityLevel;
  isActive: boolean;
  lastLogin?: Date;
  profilePicture?: string;
  phoneNumber?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  interviewReminders: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  securityClearanceRequired: SecurityLevel;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SecurityEvent extends BaseEntity {
  userId: string;
  eventType: 'login' | 'logout' | 'failed_login' | 'password_change' | 'mfa_setup' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords to check
  lockoutThreshold: number; // failed attempts before lockout
  lockoutDuration: number; // minutes
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  trusted: boolean;
  registeredAt: Date;
  lastUsed: Date;
}

export interface JWTPayload {
  sub: string; // user ID
  username: string;
  role: UserRole;
  permissions: string[];
  securityClearance: SecurityLevel;
  deviceId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}