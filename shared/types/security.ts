// Security and compliance types for DRDO system

import { BaseEntity } from './common';
import { UserRole, SecurityLevel } from './auth';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  MFA_SETUP = 'mfa_setup',
  MFA_VERIFICATION = 'mfa_verification',
  PERMISSION_CHANGE = 'permission_change',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SECURITY_VIOLATION = 'security_violation',
  SYSTEM_BREACH = 'system_breach',
  COMPLIANCE_VIOLATION = 'compliance_violation'
}

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ComplianceStandard {
  GDPR = 'gdpr',
  ISO_27001 = 'iso_27001',
  INDIAN_IT_ACT = 'indian_it_act',
  SOC_2 = 'soc_2',
  NIST = 'nist',
  DRDO_INTERNAL = 'drdo_internal'
}

export enum EncryptionAlgorithm {
  AES_256 = 'aes_256',
  RSA_2048 = 'rsa_2048',
  RSA_4096 = 'rsa_4096',
  ECDSA = 'ecdsa',
  CHACHA20 = 'chacha20'
}

// Security Events and Audit
export interface SecurityEvent extends BaseEntity {
  type: SecurityEventType;
  severity: ThreatLevel;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  falsePositive: boolean;
  relatedEvents: string[];
  riskScore: number;
  impact: string[];
  mitigation: string[];
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
}

export interface AuditTrail extends BaseEntity {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceType: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
  blockchainHash?: string;
  blockchainTxId?: string;
}

// Blockchain Integration
export interface BlockchainRecord {
  id: string;
  transactionId: string;
  blockNumber: number;
  blockHash: string;
  previousHash: string;
  timestamp: Date;
  data: any;
  hash: string;
  signature: string;
  verified: boolean;
  immutable: boolean;
  network: 'hyperledger' | 'ethereum' | 'private';
}

export interface BlockchainAuditLog {
  auditId: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  dataHash: string;
  blockchainTxId: string;
  blockNumber: number;
  gasUsed?: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  verificationStatus: 'verified' | 'unverified' | 'tampered';
}

// Access Control and Permissions
export interface AccessControlPolicy {
  id: string;
  name: string;
  description: string;
  type: 'rbac' | 'abac' | 'mac' | 'dac';
  rules: AccessRule[];
  isActive: boolean;
  priority: number;
  createdBy: string;
  lastModified: Date;
  version: string;
}

export interface AccessRule {
  id: string;
  subject: AccessSubject;
  resource: AccessResource;
  action: string[];
  conditions: AccessCondition[];
  effect: 'allow' | 'deny';
  priority: number;
  timeRestrictions?: TimeRestriction;
  locationRestrictions?: LocationRestriction[];
}

export interface AccessSubject {
  type: 'user' | 'role' | 'group' | 'department';
  identifier: string;
  attributes: Record<string, any>;
}

export interface AccessResource {
  type: 'interview' | 'user' | 'report' | 'system' | 'api';
  identifier: string;
  attributes: Record<string, any>;
}

export interface AccessCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  required: boolean;
}

export interface TimeRestriction {
  allowedHours: number[]; // 0-23
  allowedDays: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
  exceptions: Date[];
}

export interface LocationRestriction {
  type: 'country' | 'region' | 'ip_range' | 'coordinates';
  value: string;
  allowed: boolean;
}

// Encryption and Key Management
export interface EncryptionKey {
  id: string;
  name: string;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  purpose: 'data_encryption' | 'key_encryption' | 'signing' | 'authentication';
  publicKey?: string;
  privateKeyHash: string; // Never store actual private key
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  rotationSchedule?: KeyRotationSchedule;
  usage: KeyUsage;
  permissions: KeyPermissions;
}

export interface KeyRotationSchedule {
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'manual';
  nextRotation: Date;
  autoRotate: boolean;
  notifyBefore: number; // days
  backupCount: number;
}

export interface KeyUsage {
  totalOperations: number;
  encryptionOperations: number;
  decryptionOperations: number;
  signingOperations: number;
  verificationOperations: number;
  lastUsed: Date;
  usageLimit?: number;
}

export interface KeyPermissions {
  canEncrypt: string[]; // user IDs or roles
  canDecrypt: string[];
  canSign: string[];
  canVerify: string[];
  canRotate: string[];
  canRevoke: string[];
}

export interface EncryptedData {
  id: string;
  encryptedContent: string;
  algorithm: EncryptionAlgorithm;
  keyId: string;
  iv: string; // Initialization vector
  authTag?: string; // For authenticated encryption
  metadata: EncryptionMetadata;
  createdAt: Date;
  lastAccessed?: Date;
  accessCount: number;
}

export interface EncryptionMetadata {
  originalSize: number;
  encryptedSize: number;
  compressionUsed: boolean;
  integrityHash: string;
  version: string;
  additionalData?: Record<string, any>;
}

// Threat Detection and Response
export interface ThreatDetection {
  id: string;
  type: 'anomaly' | 'signature' | 'behavioral' | 'ml_based';
  name: string;
  description: string;
  severity: ThreatLevel;
  confidence: number;
  detectedAt: Date;
  source: string;
  indicators: ThreatIndicator[];
  affectedResources: string[];
  response: ThreatResponse;
  status: 'active' | 'investigating' | 'mitigated' | 'false_positive';
  assignedTo?: string;
  notes: string[];
}

export interface ThreatIndicator {
  type: 'ip' | 'domain' | 'hash' | 'pattern' | 'behavior';
  value: string;
  confidence: number;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  reputation: 'malicious' | 'suspicious' | 'unknown' | 'benign';
}

export interface ThreatResponse {
  automated: AutomatedResponse[];
  manual: ManualResponse[];
  escalation: EscalationRule[];
  containment: ContainmentAction[];
  recovery: RecoveryAction[];
}

export interface AutomatedResponse {
  action: 'block_ip' | 'disable_user' | 'quarantine' | 'alert' | 'log';
  parameters: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

export interface ManualResponse {
  action: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
}

export interface EscalationRule {
  condition: string;
  escalateTo: string[];
  timeframe: number; // minutes
  notificationMethod: 'email' | 'sms' | 'push' | 'call';
}

export interface ContainmentAction {
  type: 'isolate' | 'block' | 'restrict' | 'monitor';
  target: string;
  scope: 'user' | 'ip' | 'session' | 'resource';
  duration?: number; // minutes, null for permanent
  reversible: boolean;
}

export interface RecoveryAction {
  type: 'restore' | 'reset' | 'rebuild' | 'patch';
  target: string;
  priority: number;
  estimatedTime: number; // minutes
  dependencies: string[];
  rollbackPlan: string;
}

// Vulnerability Management
export interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore: number;
  category: 'injection' | 'authentication' | 'encryption' | 'configuration' | 'other';
  affectedComponents: string[];
  discoveredAt: Date;
  reportedBy: string;
  status: 'open' | 'investigating' | 'patching' | 'patched' | 'accepted_risk';
  remediation: RemediationPlan;
  timeline: VulnerabilityTimeline[];
}

export interface RemediationPlan {
  steps: RemediationStep[];
  estimatedEffort: number; // hours
  priority: 'immediate' | 'high' | 'medium' | 'low';
  assignedTo: string;
  dueDate: Date;
  dependencies: string[];
  testingRequired: boolean;
  rollbackPlan: string;
}

export interface RemediationStep {
  id: string;
  description: string;
  type: 'patch' | 'configuration' | 'code_change' | 'process_change';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  estimatedTime: number; // hours
  completedAt?: Date;
  notes: string;
}

export interface VulnerabilityTimeline {
  timestamp: Date;
  event: 'discovered' | 'reported' | 'acknowledged' | 'investigating' | 'patching' | 'patched' | 'verified';
  description: string;
  performedBy: string;
}

// Compliance and Governance
export interface ComplianceFramework {
  id: string;
  standard: ComplianceStandard;
  version: string;
  name: string;
  description: string;
  requirements: ComplianceRequirement[];
  assessments: ComplianceAssessment[];
  isActive: boolean;
  lastReview: Date;
  nextReview: Date;
  owner: string;
}

export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  controls: ComplianceControl[];
  evidence: ComplianceEvidence[];
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
  lastAssessed: Date;
  assessor: string;
  notes: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  automated: boolean;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  owner: string;
  implementation: ControlImplementation;
  effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
}

export interface ControlImplementation {
  status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'planned';
  implementationDate?: Date;
  testingDate?: Date;
  testingResults?: string;
  exceptions: ControlException[];
  compensatingControls: string[];
}

export interface ControlException {
  id: string;
  reason: string;
  approvedBy: string;
  approvalDate: Date;
  expiryDate: Date;
  riskAcceptance: string;
  compensatingMeasures: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'certificate' | 'report';
  name: string;
  description: string;
  url: string;
  hash: string;
  collectedAt: Date;
  collectedBy: string;
  validUntil?: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ComplianceAssessment {
  id: string;
  frameworkId: string;
  type: 'self_assessment' | 'internal_audit' | 'external_audit' | 'certification';
  assessor: string;
  startDate: Date;
  endDate: Date;
  scope: string[];
  findings: ComplianceFinding[];
  overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
  recommendations: string[];
  actionPlan: ComplianceActionPlan;
}

export interface ComplianceFinding {
  id: string;
  requirementId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'gap' | 'weakness' | 'non_compliance' | 'observation';
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  dueDate: Date;
  assignedTo: string;
}

export interface ComplianceActionPlan {
  id: string;
  assessmentId: string;
  actions: ComplianceAction[];
  overallProgress: number; // percentage
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  status: 'planning' | 'in_progress' | 'completed' | 'overdue';
  owner: string;
}

export interface ComplianceAction {
  id: string;
  findingId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // percentage
  estimatedEffort: number; // hours
  actualEffort?: number; // hours
  dependencies: string[];
  updates: ActionUpdate[];
}

export interface ActionUpdate {
  timestamp: Date;
  updatedBy: string;
  progress: number;
  status: string;
  notes: string;
  attachments: string[];
}

// Security Metrics and KPIs
export interface SecurityMetrics {
  timestamp: Date;
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: {
    securityEvents: number;
    threatsDetected: number;
    threatsBlocked: number;
    vulnerabilities: number;
    patchedVulnerabilities: number;
    complianceScore: number;
    meanTimeToDetection: number; // minutes
    meanTimeToResponse: number; // minutes
    meanTimeToResolution: number; // minutes
    falsePositiveRate: number; // percentage
    securityTrainingCompletion: number; // percentage
    accessViolations: number;
    dataBreaches: number;
    encryptionCoverage: number; // percentage
    backupSuccess: number; // percentage
    systemUptime: number; // percentage
  };
}

export interface SecurityDashboard {
  id: string;
  name: string;
  widgets: SecurityWidget[];
  refreshInterval: number; // seconds
  permissions: string[];
  isDefault: boolean;
  createdBy: string;
  lastModified: Date;
}

export interface SecurityWidget {
  id: string;
  type: 'threat_level' | 'security_events' | 'compliance_status' | 'vulnerability_trend' | 'incident_summary';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  dataSource: string;
  alertThresholds?: AlertThreshold[];
}

export interface AlertThreshold {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  value: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  notification: boolean;
}