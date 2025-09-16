import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../database/connection';
import {
  WebRTCConnection,
  SocketEvent,
  RoomParticipant,
  ChatMessage,
  FileShare,
  RecordingSession,
  NetworkMonitoring,
  ConnectionStatus,
  MessageType,
  FileType,
  APIResponse
} from '../../shared/types';

interface Room {
  id: string;
  interview_id: string;
  participants: Map<string, RoomParticipant>;
  created_at: Date;
  recording?: RecordingSession;
  chat_history: ChatMessage[];
  shared_files: FileShare[];
}

interface PeerConnection {
  socket_id: string;
  user_id: string;
  peer_id: string;
  connection_status: ConnectionStatus;
  connection_quality: any;
  joined_at: Date;
}

export class CommunicationService {
  private io: SocketIOServer;
  private db: DatabaseConnection;
  private pool: Pool;
  private rooms: Map<string, Room>;
  private userSockets: Map<string, string>; // user_id -> socket_id
  private socketUsers: Map<string, string>; // socket_id -> user_id
  private peerConnections: Map<string, PeerConnection[]>; // room_id -> connections

  constructor(httpServer: HTTPServer) {
    this.db = DatabaseConnection.getInstance();
    this.pool = this.db.getPool();
    this.rooms = new Map();
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.peerConnections = new Map();

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
    this.startNetworkMonitoring();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authentication middleware
      socket.use(async (packet, next) => {
        try {
          const token = socket.handshake.auth.token;
          if (!token) {
            return next(new Error('Authentication required'));
          }

          // Verify JWT token (simplified - in production use proper JWT verification)
          const userId = await this.verifySocketToken(token);
          if (!userId) {
            return next(new Error('Invalid token'));
          }

          socket.data.userId = userId;
          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, userId);
          
          next();
        } catch (error) {
          next(new Error('Authentication failed'));
        }
      });

      // Room management events
      socket.on('join-room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      socket.on('leave-room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // WebRTC signaling events
      socket.on('webrtc-offer', async (data) => {
        await this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc-answer', async (data) => {
        await this.handleWebRTCAnswer(socket, data);
      });

      socket.on('webrtc-ice-candidate', async (data) => {
        await this.handleICECandidate(socket, data);
      });

      // Chat events
      socket.on('send-message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing-stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // File sharing events
      socket.on('share-file', async (data) => {
        await this.handleFileShare(socket, data);
      });

      socket.on('request-file', async (data) => {
        await this.handleFileRequest(socket, data);
      });

      // Recording events
      socket.on('start-recording', async (data) => {
        await this.handleStartRecording(socket, data);
      });

      socket.on('stop-recording', async (data) => {
        await this.handleStopRecording(socket, data);
      });

      // Screen sharing events
      socket.on('start-screen-share', async (data) => {
        await this.handleStartScreenShare(socket, data);
      });

      socket.on('stop-screen-share', async (data) => {
        await this.handleStopScreenShare(socket, data);
      });

      // Connection quality monitoring
      socket.on('connection-quality', (data) => {
        this.handleConnectionQuality(socket, data);
      });

      // Disconnect handling
      socket.on('disconnect', async (reason) => {
        await this.handleDisconnect(socket, reason);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  // Room Management Methods

  private async handleJoinRoom(socket: Socket, data: {
    room_id: string;
    interview_id: string;
    user_info: any;
  }): Promise<void> {
    try {
      const { room_id, interview_id, user_info } = data;
      const userId = socket.data.userId;

      // Validate room access
      const hasAccess = await this.validateRoomAccess(userId, interview_id);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      // Create or get room
      let room = this.rooms.get(room_id);
      if (!room) {
        room = {
          id: room_id,
          interview_id,
          participants: new Map(),
          created_at: new Date(),
          chat_history: [],
          shared_files: []
        };
        this.rooms.set(room_id, room);
      }

      // Add participant to room
      const participant: RoomParticipant = {
        socket_id: socket.id,
        user_id: userId,
        user_info,
        joined_at: new Date(),
        connection_status: 'connected',
        permissions: await this.getUserPermissions(userId, interview_id),
        media_state: {
          audio_enabled: false,
          video_enabled: false,
          screen_sharing: false
        }
      };

      room.participants.set(userId, participant);
      socket.join(room_id);

      // Notify other participants
      socket.to(room_id).emit('participant-joined', {
        participant: this.sanitizeParticipant(participant),
        room_info: this.getRoomInfo(room)
      });

      // Send room state to new participant
      socket.emit('room-joined', {
        room_info: this.getRoomInfo(room),
        participants: Array.from(room.participants.values()).map(p => this.sanitizeParticipant(p)),
        chat_history: room.chat_history.slice(-50), // Last 50 messages
        shared_files: room.shared_files
      });

      // Log join event
      await this.logRoomEvent(room_id, userId, 'participant_joined', {
        participant_info: user_info
      });

    } catch (error) {
      console.error('Error joining room:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        roomId: data.room_id,
        userId: socket.data.userId
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      socket.emit('error', { 
        message: errorMessage,
        code: 'ROOM_JOIN_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleLeaveRoom(socket: Socket, data: { room_id: string }): Promise<void> {
    try {
      const { room_id } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room) return;

      // Remove participant from room
      const participant = room.participants.get(userId);
      if (participant) {
        room.participants.delete(userId);
        socket.leave(room_id);

        // Notify other participants
        socket.to(room_id).emit('participant-left', {
          user_id: userId,
          room_info: this.getRoomInfo(room)
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.rooms.delete(room_id);
        }

        // Log leave event
        await this.logRoomEvent(room_id, userId, 'participant_left', {
          duration: Date.now() - participant.joined_at.getTime()
        });
      }

    } catch (error) {
      console.error('Error leaving room:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        roomId: data.room_id,
        userId: socket.data.userId
      });
    }
  }

  // WebRTC Signaling Methods

  private async handleWebRTCOffer(socket: Socket, data: {
    room_id: string;
    target_user_id: string;
    offer: RTCSessionDescriptionInit;
    media_type: 'audio' | 'video' | 'screen';
  }): Promise<void> {
    try {
      const { room_id, target_user_id, offer, media_type } = data;
      const userId = socket.data.userId;

      const targetSocketId = this.userSockets.get(target_user_id);
      if (!targetSocketId) {
        socket.emit('webrtc-error', { message: 'Target user not connected' });
        return;
      }

      // Forward offer to target user
      this.io.to(targetSocketId).emit('webrtc-offer', {
        room_id,
        from_user_id: userId,
        offer,
        media_type
      });

      // Log WebRTC event
      await this.logWebRTCEvent(room_id, userId, target_user_id, 'offer_sent', {
        media_type
      });

    } catch (error) {
      console.error('Error handling WebRTC offer:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        roomId: data.room_id,
        targetUserId: data.target_user_id,
        fromUserId: socket.data.userId
      });
      
      socket.emit('webrtc-error', { 
        message: 'Failed to send offer',
        code: 'WEBRTC_OFFER_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleWebRTCAnswer(socket: Socket, data: {
    room_id: string;
    target_user_id: string;
    answer: RTCSessionDescriptionInit;
  }): Promise<void> {
    try {
      const { room_id, target_user_id, answer } = data;
      const userId = socket.data.userId;

      const targetSocketId = this.userSockets.get(target_user_id);
      if (!targetSocketId) {
        socket.emit('webrtc-error', { message: 'Target user not connected' });
        return;
      }

      // Forward answer to target user
      this.io.to(targetSocketId).emit('webrtc-answer', {
        room_id,
        from_user_id: userId,
        answer
      });

      // Log WebRTC event
      await this.logWebRTCEvent(room_id, userId, target_user_id, 'answer_sent', {});

    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
      socket.emit('webrtc-error', { message: 'Failed to send answer' });
    }
  }

  private async handleICECandidate(socket: Socket, data: {
    room_id: string;
    target_user_id: string;
    candidate: RTCIceCandidateInit;
  }): Promise<void> {
    try {
      const { room_id, target_user_id, candidate } = data;
      const userId = socket.data.userId;

      const targetSocketId = this.userSockets.get(target_user_id);
      if (!targetSocketId) return;

      // Forward ICE candidate to target user
      this.io.to(targetSocketId).emit('webrtc-ice-candidate', {
        room_id,
        from_user_id: userId,
        candidate
      });

    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Chat Methods

  private async handleSendMessage(socket: Socket, data: {
    room_id: string;
    content: string;
    message_type?: MessageType;
    reply_to?: string;
  }): Promise<void> {
    try {
      const { room_id, content, message_type = 'text', reply_to } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        socket.emit('error', { message: 'Not in room or room not found' });
        return;
      }

      // Create message
      const message: ChatMessage = {
        id: uuidv4(),
        interview_id: room.interview_id,
        sender_id: userId,
        sender_name: room.participants.get(userId)?.user_info?.name || 'Unknown',
        message_type,
        content,
        reply_to,
        created_at: new Date(),
        edited: false,
        reactions: [],
        read_by: []
      };

      // Add to room chat history
      room.chat_history.push(message);

      // Store in database
      await this.storeChatMessage(message);

      // Broadcast to all participants in room
      this.io.to(room_id).emit('new-message', message);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: Socket, data: { room_id: string }): void {
    const userId = socket.data.userId;
    socket.to(data.room_id).emit('user-typing', { user_id: userId, typing: true });
  }

  private handleTypingStop(socket: Socket, data: { room_id: string }): void {
    const userId = socket.data.userId;
    socket.to(data.room_id).emit('user-typing', { user_id: userId, typing: false });
  }

  // File Sharing Methods

  private async handleFileShare(socket: Socket, data: {
    room_id: string;
    file_info: {
      name: string;
      size: number;
      type: string;
      data: string; // base64 encoded
    };
    description?: string;
  }): Promise<void> {
    try {
      const { room_id, file_info, description } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        socket.emit('error', { message: 'Not in room or room not found' });
        return;
      }

      // Validate file size (max 10MB)
      if (file_info.size > 10 * 1024 * 1024) {
        socket.emit('error', { message: 'File size exceeds 10MB limit' });
        return;
      }

      // Create file share record
      const fileShare: FileShare = {
        id: uuidv4(),
        interview_id: room.interview_id,
        uploaded_by: userId,
        file_name: file_info.name,
        original_name: file_info.name,
        file_size: file_info.size,
        mime_type: file_info.type,
        description,
        created_at: new Date(),
        download_count: 0,
        is_public: true
      };

      // Store file (in production, use proper file storage)
      await this.storeSharedFile(fileShare, file_info.data);

      // Add to room shared files
      room.shared_files.push(fileShare);

      // Notify all participants
      this.io.to(room_id).emit('file-shared', fileShare);

    } catch (error) {
      console.error('Error sharing file:', error);
      socket.emit('error', { message: 'Failed to share file' });
    }
  }

  private async handleFileRequest(socket: Socket, data: {
    room_id: string;
    file_id: string;
  }): Promise<void> {
    try {
      const { room_id, file_id } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        socket.emit('error', { message: 'Not in room or room not found' });
        return;
      }

      // Find file in room
      const file = room.shared_files.find(f => f.id === file_id);
      if (!file) {
        socket.emit('error', { message: 'File not found' });
        return;
      }

      // Get file data (in production, retrieve from file storage)
      const fileData = await this.getSharedFileData(file_id);
      
      // Send file to requester
      socket.emit('file-data', {
        file_id,
        file_info: file,
        data: fileData
      });

      // Update download count
      file.download_count++;
      await this.updateFileDownloadCount(file_id);

    } catch (error) {
      console.error('Error requesting file:', error);
      socket.emit('error', { message: 'Failed to retrieve file' });
    }
  }

  // Recording Methods

  private async handleStartRecording(socket: Socket, data: {
    room_id: string;
    recording_settings: {
      quality: string;
      format: string;
      include_audio: boolean;
      include_video: boolean;
    };
  }): Promise<void> {
    try {
      const { room_id, recording_settings } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        socket.emit('error', { message: 'Not in room or room not found' });
        return;
      }

      // Check recording permissions
      const participant = room.participants.get(userId);
      if (!participant?.permissions?.can_control_recording) {
        socket.emit('error', { message: 'No permission to control recording' });
        return;
      }

      // Start recording session
      const recording: RecordingSession = {
        id: uuidv4(),
        interview_id: room.interview_id,
        file_name: `recording_${room_id}_${Date.now()}`,
        format: recording_settings.format,
        quality: recording_settings.quality,
        started_by: userId,
        started_at: new Date(),
        participants: Array.from(room.participants.keys()),
        status: 'recording',
        processing_progress: 0
      };

      room.recording = recording;

      // Store recording session
      await this.storeRecordingSession(recording);

      // Notify all participants
      this.io.to(room_id).emit('recording-started', {
        recording_id: recording.id,
        started_by: userId
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      socket.emit('error', { message: 'Failed to start recording' });
    }
  }

  private async handleStopRecording(socket: Socket, data: {
    room_id: string;
  }): Promise<void> {
    try {
      const { room_id } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId) || !room.recording) {
        socket.emit('error', { message: 'No active recording found' });
        return;
      }

      // Check recording permissions
      const participant = room.participants.get(userId);
      if (!participant?.permissions?.can_control_recording) {
        socket.emit('error', { message: 'No permission to control recording' });
        return;
      }

      // Stop recording
      room.recording.ended_at = new Date();
      room.recording.status = 'processing';

      // Update recording session
      await this.updateRecordingSession(room.recording);

      // Notify all participants
      this.io.to(room_id).emit('recording-stopped', {
        recording_id: room.recording.id,
        stopped_by: userId
      });

      // Clear room recording
      room.recording = undefined;

    } catch (error) {
      console.error('Error stopping recording:', error);
      socket.emit('error', { message: 'Failed to stop recording' });
    }
  }

  // Screen Sharing Methods

  private async handleStartScreenShare(socket: Socket, data: {
    room_id: string;
  }): Promise<void> {
    try {
      const { room_id } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        socket.emit('error', { message: 'Not in room or room not found' });
        return;
      }

      // Update participant media state
      const participant = room.participants.get(userId);
      if (participant) {
        participant.media_state.screen_sharing = true;
      }

      // Notify other participants
      socket.to(room_id).emit('screen-share-started', {
        user_id: userId,
        user_name: participant?.user_info?.name
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      socket.emit('error', { message: 'Failed to start screen sharing' });
    }
  }

  private async handleStopScreenShare(socket: Socket, data: {
    room_id: string;
  }): Promise<void> {
    try {
      const { room_id } = data;
      const userId = socket.data.userId;

      const room = this.rooms.get(room_id);
      if (!room || !room.participants.has(userId)) {
        return;
      }

      // Update participant media state
      const participant = room.participants.get(userId);
      if (participant) {
        participant.media_state.screen_sharing = false;
      }

      // Notify other participants
      socket.to(room_id).emit('screen-share-stopped', {
        user_id: userId
      });

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  // Connection Quality Monitoring

  private handleConnectionQuality(socket: Socket, data: {
    room_id: string;
    quality_metrics: {
      bandwidth: number;
      latency: number;
      packet_loss: number;
      jitter: number;
    };
  }): void {
    const { room_id, quality_metrics } = data;
    const userId = socket.data.userId;

    const room = this.rooms.get(room_id);
    if (!room || !room.participants.has(userId)) {
      return;
    }

    // Update participant connection quality
    const participant = room.participants.get(userId);
    if (participant) {
      participant.connection_quality = quality_metrics;
    }

    // Notify other participants if quality is poor
    if (quality_metrics.packet_loss > 0.05 || quality_metrics.latency > 500) {
      socket.to(room_id).emit('connection-quality-warning', {
        user_id: userId,
        quality: 'poor'
      });
    }
  }

  // Disconnect Handling

  private async handleDisconnect(socket: Socket, reason: string): Promise<void> {
    try {
      const userId = this.socketUsers.get(socket.id);
      if (!userId) return;

      console.log(`User ${userId} disconnected: ${reason}`);

      // Remove from user mappings
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);

      // Remove from all rooms
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.participants.has(userId)) {
          const participant = room.participants.get(userId);
          room.participants.delete(userId);

          // Notify other participants
          socket.to(roomId).emit('participant-disconnected', {
            user_id: userId,
            reason
          });

          // Log disconnect event
          if (participant) {
            await this.logRoomEvent(roomId, userId, 'participant_disconnected', {
              reason,
              duration: Date.now() - participant.joined_at.getTime()
            });
          }

          // Clean up empty rooms
          if (room.participants.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  // Network Monitoring

  private startNetworkMonitoring(): void {
    setInterval(() => {
      this.monitorNetworkHealth();
    }, 30000); // Every 30 seconds
  }

  private async monitorNetworkHealth(): Promise<void> {
    try {
      const activeRooms = this.rooms.size;
      const totalParticipants = Array.from(this.rooms.values())
        .reduce((sum, room) => sum + room.participants.size, 0);

      // Log network metrics
      console.log(`Network Health - Rooms: ${activeRooms}, Participants: ${totalParticipants}`);

      // Store metrics in database
      await this.storeNetworkMetrics({
        active_rooms: activeRooms,
        total_participants: totalParticipants,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error monitoring network health:', error);
    }
  }

  // Helper Methods

  private async verifySocketToken(token: string): Promise<string | null> {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // In production, verify JWT token properly
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      
      if (!decoded.userId) {
        throw new Error('Invalid token payload');
      }

      return decoded.userId;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  private async validateRoomAccess(userId: string, interviewId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT 1 FROM interview_participants 
        WHERE interview_id = $1 AND user_id = $2
      `, [interviewId, userId]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error validating room access:', error);
      return false;
    }
  }

  private async getUserPermissions(userId: string, interviewId: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT permissions FROM interview_participants 
        WHERE interview_id = $1 AND user_id = $2
      `, [interviewId, userId]);
      
      if (result.rows.length > 0) {
        return typeof result.rows[0].permissions === 'string' 
          ? JSON.parse(result.rows[0].permissions)
          : result.rows[0].permissions;
      }
      
      return {};
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {};
    }
  }

  private getRoomInfo(room: Room): any {
    return {
      id: room.id,
      interview_id: room.interview_id,
      participant_count: room.participants.size,
      created_at: room.created_at,
      recording_active: !!room.recording
    };
  }

  private sanitizeParticipant(participant: RoomParticipant): any {
    return {
      user_id: participant.user_id,
      user_info: participant.user_info,
      joined_at: participant.joined_at,
      connection_status: participant.connection_status,
      media_state: participant.media_state,
      connection_quality: participant.connection_quality
    };
  }

  // Database Methods

  private async storeChatMessage(message: ChatMessage): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO chat_messages (
          id, interview_id, sender_id, sender_name, message_type,
          content, reply_to, edited, reactions, read_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        message.id,
        message.interview_id,
        message.sender_id,
        message.sender_name,
        message.message_type,
        message.content,
        message.reply_to,
        message.edited,
        JSON.stringify(message.reactions),
        JSON.stringify(message.read_by)
      ]);
    } catch (error) {
      console.error('Error storing chat message:', error);
    }
  }

  private async storeSharedFile(fileShare: FileShare, fileData: string): Promise<void> {
    try {
      // In production, store file in proper file storage (S3, etc.)
      await this.pool.query(`
        INSERT INTO file_uploads (
          id, interview_id, uploaded_by, file_name, original_name,
          file_size, mime_type, description, download_count, is_public
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        fileShare.id,
        fileShare.interview_id,
        fileShare.uploaded_by,
        fileShare.file_name,
        fileShare.original_name,
        fileShare.file_size,
        fileShare.mime_type,
        fileShare.description,
        fileShare.download_count,
        fileShare.is_public
      ]);
    } catch (error) {
      console.error('Error storing shared file:', error);
    }
  }

  private async getSharedFileData(fileId: string): Promise<string> {
    // In production, retrieve from file storage
    return 'mock-file-data';
  }

  private async updateFileDownloadCount(fileId: string): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE file_uploads 
        SET download_count = download_count + 1 
        WHERE id = $1
      `, [fileId]);
    } catch (error) {
      console.error('Error updating file download count:', error);
    }
  }

  private async storeRecordingSession(recording: RecordingSession): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO recording_sessions (
          id, interview_id, file_name, format, quality,
          started_by, started_at, participants, status, processing_progress
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        recording.id,
        recording.interview_id,
        recording.file_name,
        recording.format,
        recording.quality,
        recording.started_by,
        recording.started_at,
        recording.participants,
        recording.status,
        recording.processing_progress
      ]);
    } catch (error) {
      console.error('Error storing recording session:', error);
    }
  }

  private async updateRecordingSession(recording: RecordingSession): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE recording_sessions 
        SET ended_at = $2, status = $3, processing_progress = $4
        WHERE id = $1
      `, [
        recording.id,
        recording.ended_at,
        recording.status,
        recording.processing_progress
      ]);
    } catch (error) {
      console.error('Error updating recording session:', error);
    }
  }

  private async logRoomEvent(
    roomId: string,
    userId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      // Log to database or monitoring system
      console.log(`Room Event - ${roomId}: ${eventType} by ${userId}`, eventData);
    } catch (error) {
      console.error('Error logging room event:', error);
    }
  }

  private async logWebRTCEvent(
    roomId: string,
    fromUserId: string,
    toUserId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      // Log WebRTC signaling events
      console.log(`WebRTC Event - ${roomId}: ${eventType} from ${fromUserId} to ${toUserId}`, eventData);
    } catch (error) {
      console.error('Error logging WebRTC event:', error);
    }
  }

  private async storeNetworkMetrics(metrics: any): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO system_metrics (metric_name, metric_value, category, timestamp)
        VALUES 
          ('active_rooms', $1, 'network', $3),
          ('total_participants', $2, 'network', $3)
      `, [metrics.active_rooms, metrics.total_participants, metrics.timestamp]);
    } catch (error) {
      console.error('Error storing network metrics:', error);
    }
  }

  // Public API Methods

  public getActiveRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  public getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getParticipantCount(): number {
    return Array.from(this.rooms.values())
      .reduce((sum, room) => sum + room.participants.size, 0);
  }

  public async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
    this.io.to(roomId).emit(event, data);
  }

  public async sendToUser(userId: string, event: string, data: any): Promise<void> {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

export default CommunicationService;