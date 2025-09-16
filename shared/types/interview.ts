// Interview management types for DRDO system

import { BaseEntity } from './common';
import { UserRole } from './auth';

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  TECHNICAL_ISSUES = 'technical_issues',
  POSTPONED = 'postponed'
}

export enum ParticipantRole {
  INTERVIEWER = 'interviewer',
  CANDIDATE = 'candidate',
  OBSERVER = 'observer',
  TECHNICAL_SUPPORT = 'technical_support'
}

export enum InterviewType {
  TECHNICAL = 'technical',
  BEHAVIORAL = 'behavioral',
  PANEL = 'panel',
  ONE_ON_ONE = 'one_on_one',
  GROUP = 'group',
  ASSESSMENT = 'assessment'
}

export interface Interview extends BaseEntity {
  title: string;
  description: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration: number; // in minutes
  participants: Participant[];
  evaluationCriteria: EvaluationCriteria;
  questionCategories: string[];
  settings: InterviewSettings;
  results?: InterviewResults;
  createdBy: string;
  roomId: string;
  recordingEnabled: boolean;
  recordingUrl?: string;
  metadata: Record<string, any>;
}

export interface CreateInterviewRequest {
  title: string;
  description: string;
  type: InterviewType;
  scheduledTime: Date;
  duration: number;
  participants: CreateParticipantRequest[];
  evaluationCriteria: EvaluationCriteria;
  questionCategories: string[];
  settings: InterviewSettings;
  recordingEnabled?: boolean;
}

export interface UpdateInterviewRequest {
  title?: string;
  description?: string;
  scheduledTime?: Date;
  duration?: number;
  evaluationCriteria?: Partial<EvaluationCriteria>;
  questionCategories?: string[];
  settings?: Partial<InterviewSettings>;
}

export interface Participant {
  id: string;
  userId: string;
  interviewId: string;
  role: ParticipantRole;
  joinedAt?: Date;
  leftAt?: Date;
  connectionQuality: ConnectionQuality;
  deviceInfo: DeviceInfo;
  permissions: ParticipantPermissions;
  status: 'invited' | 'joined' | 'left' | 'disconnected';
}

export interface CreateParticipantRequest {
  userId: string;
  role: ParticipantRole;
  permissions?: Partial<ParticipantPermissions>;
}

export interface ParticipantPermissions {
  canSpeak: boolean;
  canShareScreen: boolean;
  canViewAnalytics: boolean;
  canControlRecording: boolean;
  canManageParticipants: boolean;
  canEndInterview: boolean;
}

export interface ConnectionQuality {
  video: 'excellent' | 'good' | 'fair' | 'poor';
  audio: 'excellent' | 'good' | 'fair' | 'poor';
  network: 'stable' | 'unstable' | 'disconnected';
  latency: number; // in milliseconds
  bandwidth: number; // in kbps
  packetLoss: number; // percentage
  lastUpdated: Date;
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSpeakers: boolean;
  screenResolution: string;
  timezone: string;
}

export interface EvaluationCriteria {
  technicalSkills: CriteriaWeight;
  communicationSkills: CriteriaWeight;
  problemSolving: CriteriaWeight;
  domainKnowledge: CriteriaWeight;
  leadership: CriteriaWeight;
  teamwork: CriteriaWeight;
  adaptability: CriteriaWeight;
  customCriteria: CustomCriteria[];
}

export interface CriteriaWeight {
  weight: number; // percentage (0-100)
  description: string;
  enabled: boolean;
}

export interface CustomCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: 'numeric' | 'categorical';
  options?: string[]; // for categorical scale
  minValue?: number; // for numeric scale
  maxValue?: number; // for numeric scale
}

export interface InterviewSettings {
  language: string;
  translationEnabled: boolean;
  aiEvaluationEnabled: boolean;
  biasDetectionEnabled: boolean;
  emotionAnalysisEnabled: boolean;
  recordingEnabled: boolean;
  screenSharingEnabled: boolean;
  chatEnabled: boolean;
  breakoutRoomsEnabled: boolean;
  waitingRoomEnabled: boolean;
  maxParticipants: number;
  autoStartRecording: boolean;
  muteParticipantsOnJoin: boolean;
  requireApprovalToJoin: boolean;
  allowReconnection: boolean;
  sessionTimeout: number; // minutes
}

export interface InterviewResults {
  overallScore: number;
  criteriaScores: Record<string, number>;
  aiEvaluation: AIEvaluationSummary;
  participantFeedback: ParticipantFeedback[];
  duration: number; // actual duration in minutes
  questionsAsked: number;
  questionsAnswered: number;
  technicalIssues: TechnicalIssue[];
  recommendations: string[];
  nextSteps: string[];
  generatedAt: Date;
}

export interface AIEvaluationSummary {
  questionQualityScore: number;
  answerQualityScore: number;
  biasScore: number;
  emotionAnalysis: EmotionSummary;
  communicationMetrics: CommunicationMetrics;
  technicalAccuracy: number;
  confidence: number;
  recommendations: string[];
}

export interface EmotionSummary {
  dominantEmotion: string;
  confidenceLevel: number;
  stressLevel: number;
  engagementLevel: number;
  emotionTimeline: EmotionDataPoint[];
}

export interface EmotionDataPoint {
  timestamp: Date;
  emotion: string;
  confidence: number;
  stress: number;
  engagement: number;
}

export interface CommunicationMetrics {
  speakingTime: number; // seconds
  pauseFrequency: number;
  speechRate: number; // words per minute
  volumeVariation: number;
  clarityScore: number;
  articulationScore: number;
}

export interface ParticipantFeedback {
  participantId: string;
  role: ParticipantRole;
  rating: number; // 1-10
  comments: string;
  strengths: string[];
  improvementAreas: string[];
  wouldRecommend: boolean;
  submittedAt: Date;
}

export interface TechnicalIssue {
  id: string;
  type: 'audio' | 'video' | 'network' | 'screen_share' | 'recording' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurredAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  affectedParticipants: string[];
}

export interface InterviewTemplate {
  id: string;
  name: string;
  description: string;
  type: InterviewType;
  duration: number;
  evaluationCriteria: EvaluationCriteria;
  questionCategories: string[];
  settings: InterviewSettings;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface InterviewSchedule {
  interviewId: string;
  scheduledTime: Date;
  duration: number;
  participants: string[];
  roomId: string;
  remindersSent: Date[];
  status: 'scheduled' | 'reminded' | 'started' | 'completed' | 'cancelled';
}

export interface InterviewInvitation {
  id: string;
  interviewId: string;
  participantEmail: string;
  role: ParticipantRole;
  invitedBy: string;
  invitedAt: Date;
  token: string;
  expiresAt: Date;
  status: 'sent' | 'opened' | 'accepted' | 'declined' | 'expired';
  respondedAt?: Date;
  joinUrl: string;
}

export interface InterviewRoom {
  roomId: string;
  interviewId: string;
  isActive: boolean;
  participants: RoomParticipant[];
  settings: RoomSettings;
  createdAt: Date;
  endedAt?: Date;
}

export interface RoomParticipant {
  userId: string;
  socketId: string;
  role: ParticipantRole;
  joinedAt: Date;
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: ConnectionQuality;
}

export interface RoomSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenSharingEnabled: boolean;
  waitingRoomEnabled: boolean;
  muteOnJoin: boolean;
  requireApproval: boolean;
}