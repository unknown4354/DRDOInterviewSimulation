// Real-time communication types for DRDO system

import { BaseEntity } from './common';
import { ParticipantRole } from './interview';

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

export enum MediaType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN = 'screen',
  DATA = 'data'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
  NOTIFICATION = 'notification',
  COMMAND = 'command'
}

// WebRTC Types
export interface RTCConfiguration {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  bundlePolicy: 'balanced' | 'max-compat' | 'max-bundle';
  rtcpMuxPolicy: 'negotiate' | 'require';
  sdpSemantics: 'plan-b' | 'unified-plan';
}

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface PeerConnection {
  id: string;
  userId: string;
  roomId: string;
  status: ConnectionStatus;
  localStreams: MediaStream[];
  remoteStreams: MediaStream[];
  dataChannels: RTCDataChannel[];
  statistics: ConnectionStatistics;
  createdAt: Date;
  lastActivity: Date;
}

export interface ConnectionStatistics {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  bandwidth: number;
  frameRate: number;
  resolution: string;
  audioLevel: number;
  videoQuality: 'low' | 'medium' | 'high' | 'hd';
  lastUpdated: Date;
}

export interface MediaConstraints {
  audio: AudioConstraints | boolean;
  video: VideoConstraints | boolean;
}

export interface AudioConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  deviceId?: string;
}

export interface VideoConstraints {
  width: { min?: number; ideal?: number; max?: number };
  height: { min?: number; ideal?: number; max?: number };
  frameRate: { min?: number; ideal?: number; max?: number };
  facingMode?: 'user' | 'environment';
  deviceId?: string;
}

export interface ScreenShareOptions {
  video: boolean;
  audio: boolean;
  cursor: 'always' | 'motion' | 'never';
  displaySurface: 'application' | 'browser' | 'monitor' | 'window';
}

// Socket.io Types
export interface SocketConnection {
  socketId: string;
  userId: string;
  roomId: string;
  status: ConnectionStatus;
  joinedAt: Date;
  lastPing: Date;
  userAgent: string;
  ipAddress: string;
  metadata: Record<string, any>;
}

export interface SocketEvent {
  event: string;
  data: any;
  timestamp: Date;
  socketId: string;
  userId: string;
  roomId: string;
}

// Room Management
export interface CommunicationRoom {
  id: string;
  interviewId: string;
  name: string;
  type: 'main' | 'breakout' | 'waiting';
  maxParticipants: number;
  participants: RoomParticipant[];
  settings: RoomCommunicationSettings;
  isActive: boolean;
  createdAt: Date;
  endedAt?: Date;
}

export interface RoomParticipant {
  userId: string;
  socketId: string;
  role: ParticipantRole;
  displayName: string;
  avatar?: string;
  status: 'joined' | 'speaking' | 'muted' | 'away' | 'disconnected';
  permissions: ParticipantCommunicationPermissions;
  mediaState: MediaState;
  joinedAt: Date;
  lastActivity: Date;
}

export interface ParticipantCommunicationPermissions {
  canSpeak: boolean;
  canVideo: boolean;
  canScreenShare: boolean;
  canChat: boolean;
  canSendFiles: boolean;
  canControlMedia: boolean;
  canInviteOthers: boolean;
  canKickParticipants: boolean;
}

export interface MediaState {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  audioMuted: boolean;
  videoMuted: boolean;
  audioDevice?: string;
  videoDevice?: string;
  audioLevel: number;
  videoQuality: string;
}

export interface RoomCommunicationSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  chatEnabled: boolean;
  fileShareEnabled: boolean;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  muteOnJoin: boolean;
  requireApproval: boolean;
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  chatRetention: number; // days
}

// Chat and Messaging
export interface ChatMessage extends BaseEntity {
  roomId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  replyTo?: string;
  edited: boolean;
  editedAt?: Date;
  reactions: MessageReaction[];
  readBy: MessageRead[];
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  duration?: number; // for audio/video
  thumbnail?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface MessageRead {
  userId: string;
  readAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  startedAt: Date;
  expiresAt: Date;
}

// File Sharing
export interface SharedFile extends BaseEntity {
  roomId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  downloadUrl: string;
  thumbnail?: string;
  description?: string;
  tags: string[];
  downloadCount: number;
  expiresAt?: Date;
  isPublic: boolean;
  scanStatus: 'pending' | 'clean' | 'infected' | 'failed';
  scanResults?: FileScanResults;
}

export interface FileScanResults {
  virusFound: boolean;
  threats: string[];
  scanEngine: string;
  scannedAt: Date;
  quarantined: boolean;
}

// Recording
export interface RecordingSession extends BaseEntity {
  roomId: string;
  interviewId: string;
  fileName: string;
  duration: number; // seconds
  fileSize: number; // bytes
  format: 'mp4' | 'webm' | 'avi';
  quality: 'low' | 'medium' | 'high' | 'hd';
  url: string;
  downloadUrl: string;
  thumbnail?: string;
  startedBy: string;
  startedAt: Date;
  endedAt: Date;
  participants: string[];
  status: 'recording' | 'processing' | 'completed' | 'failed';
  processingProgress: number; // 0-100
  metadata: RecordingMetadata;
}

export interface RecordingMetadata {
  audioTracks: number;
  videoTracks: number;
  screenTracks: number;
  resolution: string;
  frameRate: number;
  bitrate: number;
  codec: string;
  chapters: RecordingChapter[];
  transcription?: string;
  highlights: RecordingHighlight[];
}

export interface RecordingChapter {
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  description?: string;
  thumbnail?: string;
}

export interface RecordingHighlight {
  title: string;
  startTime: number;
  endTime: number;
  type: 'important' | 'question' | 'answer' | 'discussion';
  confidence: number;
  description: string;
}

// Network and Quality Monitoring
export interface NetworkQuality {
  userId: string;
  roomId: string;
  timestamp: Date;
  connectionType: 'wifi' | 'ethernet' | 'cellular' | 'unknown';
  bandwidth: {
    upload: number; // kbps
    download: number; // kbps
  };
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface QualityMetrics {
  audio: {
    bitrate: number;
    sampleRate: number;
    channels: number;
    codec: string;
    packetsLost: number;
    jitter: number;
  };
  video: {
    bitrate: number;
    resolution: string;
    frameRate: number;
    codec: string;
    packetsLost: number;
    framesDropped: number;
  };
  network: {
    rtt: number;
    bandwidth: number;
    packetLoss: number;
    jitter: number;
  };
}

// Events and Notifications
export interface CommunicationEvent {
  type: 'participant_joined' | 'participant_left' | 'media_changed' | 'chat_message' | 'file_shared' | 'recording_started' | 'recording_stopped' | 'quality_changed';
  roomId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface RealTimeNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  userId?: string; // if null, broadcast to all
  roomId: string;
  persistent: boolean;
  autoHide: boolean;
  hideAfter?: number; // seconds
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
  data?: any;
}

// Troubleshooting and Diagnostics
export interface ConnectionDiagnostics {
  userId: string;
  roomId: string;
  timestamp: Date;
  tests: DiagnosticTest[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export interface DiagnosticTest {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  value?: number;
  expected?: number;
  unit?: string;
  description: string;
  recommendation?: string;
}

export interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  expectedResult: string;
  category: 'audio' | 'video' | 'network' | 'browser' | 'permissions';
  difficulty: 'easy' | 'medium' | 'advanced';
  estimatedTime: number; // minutes
}