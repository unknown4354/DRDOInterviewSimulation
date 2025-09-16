// User management types for DRDO system

import { BaseEntity } from './common';
import { UserRole, SecurityLevel, UserProfile } from './auth';

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  expertise: string[];
  securityClearance: SecurityLevel;
  phoneNumber?: string;
  temporaryPassword?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  department?: string;
  expertise?: string[];
  securityClearance?: SecurityLevel;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UserSearchFilters {
  role?: UserRole;
  department?: string;
  securityClearance?: SecurityLevel;
  isActive?: boolean;
  expertise?: string[];
  searchTerm?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  parentDepartment?: string;
  head: string; // user ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpertiseArea {
  id: string;
  name: string;
  category: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[];
  isActive: boolean;
}

export interface UserActivity extends BaseEntity {
  userId: string;
  activityType: 'login' | 'logout' | 'interview_created' | 'interview_joined' | 'profile_updated' | 'password_changed';
  description: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export interface UserStats {
  userId: string;
  totalInterviews: number;
  interviewsAsSelector: number;
  interviewsAsCandidate: number;
  interviewsAsObserver: number;
  averageRating: number;
  totalHours: number;
  lastActivity: Date;
  joinDate: Date;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  questionQualityScore: number;
  biasDetectionScore: number;
  communicationScore: number;
  technicalAccuracy: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  improvementAreas: string[];
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  type: 'department' | 'project' | 'expertise' | 'security_clearance';
  members: string[]; // user IDs
  permissions: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInvitation extends BaseEntity {
  email: string;
  role: UserRole;
  department: string;
  securityClearance: SecurityLevel;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  accepted: boolean;
  acceptedAt?: Date;
}

export interface UserBulkOperation {
  operation: 'create' | 'update' | 'deactivate' | 'delete';
  users: any[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errors: string[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface UserNotificationSettings {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  interviewReminders: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    os: string;
    browser: string;
    ipAddress: string;
  };
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}

export interface UserPreferencesUpdate {
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  notifications?: Partial<UserNotificationSettings>;
  accessibility?: {
    highContrast?: boolean;
    largeText?: boolean;
    screenReader?: boolean;
    keyboardNavigation?: boolean;
    reducedMotion?: boolean;
  };
}

export interface UserSecuritySettings {
  userId: string;
  mfaEnabled: boolean;
  mfaMethods: string[];
  trustedDevices: string[];
  passwordLastChanged: Date;
  securityQuestions: {
    question: string;
    answerHash: string;
  }[];
  loginNotifications: boolean;
  sessionTimeout: number; // minutes
}