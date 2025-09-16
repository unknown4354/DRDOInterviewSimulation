import { io, Socket } from 'socket.io-client';

interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  remoteStream?: MediaStream;
  dataChannel?: RTCDataChannel;
}

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  socketUrl: string;
  roomId: string;
  userId: string;
  userInfo: any;
}

interface ConnectionQuality {
  bandwidth: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class WebRTCService {
  private socket: Socket;
  private localStream?: MediaStream;
  private screenStream?: MediaStream;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private config: WebRTCConfig;
  private isConnected: boolean = false;
  private mediaConstraints: MediaConstraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  };

  // Event handlers
  public onRemoteStream?: (userId: string, stream: MediaStream) => void;
  public onRemoteStreamRemoved?: (userId: string) => void;
  public onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
  public onDataChannelMessage?: (userId: string, message: any) => void;
  public onConnectionQuality?: (userId: string, quality: ConnectionQuality) => void;
  public onError?: (error: Error) => void;

  constructor(config: WebRTCConfig) {
    this.config = config;
    this.socket = io(config.socketUrl, {
      auth: {
        token: localStorage.getItem('auth_token')
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    this.startConnectionQualityMonitoring();
  }

  private setupSocketHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.cleanup();
    });

    this.socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      this.isConnected = true;
    });

    this.socket.on('participant-joined', async (data) => {
      console.log('Participant joined:', data.participant.user_id);
      if (data.participant.user_id !== this.config.userId) {
        await this.createPeerConnection(data.participant.user_id, true);
      }
    });

    this.socket.on('participant-left', (data) => {
      console.log('Participant left:', data.user_id);
      this.removePeerConnection(data.user_id);
    });

    this.socket.on('webrtc-offer', async (data) => {
      await this.handleOffer(data);
    });

    this.socket.on('webrtc-answer', async (data) => {
      await this.handleAnswer(data);
    });

    this.socket.on('webrtc-ice-candidate', async (data) => {
      await this.handleIceCandidate(data);
    });

    this.socket.on('webrtc-error', (data) => {
      console.error('WebRTC error:', data);
      this.onError?.(new Error(data.message));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.onError?.(new Error(error.message || 'Socket connection error'));
    });
  }

  private async joinRoom(): Promise<void> {
    this.socket.emit('join-room', {
      room_id: this.config.roomId,
      interview_id: this.config.roomId, // Assuming room_id is interview_id
      user_info: this.config.userInfo
    });
  }

  private async createPeerConnection(userId: string, isInitiator: boolean): Promise<void> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track from:', userId);
        const remoteStream = event.streams[0];
        const peer = this.peerConnections.get(userId);
        if (peer) {
          peer.remoteStream = remoteStream;
          this.onRemoteStream?.(userId, remoteStream);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            room_id: this.config.roomId,
            target_user_id: userId,
            candidate: event.candidate.toJSON()
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
        this.onConnectionStateChange?.(userId, peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
          this.removePeerConnection(userId);
        }
      };

      // Create data channel for text communication
      let dataChannel: RTCDataChannel;
      if (isInitiator) {
        dataChannel = peerConnection.createDataChannel('messages', {
          ordered: true
        });
        this.setupDataChannel(dataChannel, userId);
      } else {
        peerConnection.ondatachannel = (event) => {
          dataChannel = event.channel;
          this.setupDataChannel(dataChannel, userId);
        };
      }

      const peer: PeerConnection = {
        id: userId,
        connection: peerConnection,
        dataChannel
      };

      this.peerConnections.set(userId, peer);

      // If initiator, create and send offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        await peerConnection.setLocalDescription(offer);
        
        this.socket.emit('webrtc-offer', {
          room_id: this.config.roomId,
          target_user_id: userId,
          offer: offer.toJSON(),
          media_type: 'video'
        });
      }

    } catch (error) {
      console.error('Error creating peer connection:', error);
      this.onError?.(error as Error);
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, userId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${userId}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onDataChannelMessage?.(userId, message);
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${userId}:`, error);
    };

    const peer = this.peerConnections.get(userId);
    if (peer) {
      peer.dataChannel = dataChannel;
    }
  }

  private async handleOffer(data: {
    room_id: string;
    from_user_id: string;
    offer: RTCSessionDescriptionInit;
    media_type: string;
  }): Promise<void> {
    try {
      const { from_user_id, offer } = data;
      
      // Create peer connection if it doesn't exist
      if (!this.peerConnections.has(from_user_id)) {
        await this.createPeerConnection(from_user_id, false);
      }

      const peer = this.peerConnections.get(from_user_id);
      if (!peer) return;

      await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      
      this.socket.emit('webrtc-answer', {
        room_id: this.config.roomId,
        target_user_id: from_user_id,
        answer: answer.toJSON()
      });

    } catch (error) {
      console.error('Error handling offer:', error);
      this.onError?.(error as Error);
    }
  }

  private async handleAnswer(data: {
    room_id: string;
    from_user_id: string;
    answer: RTCSessionDescriptionInit;
  }): Promise<void> {
    try {
      const { from_user_id, answer } = data;
      
      const peer = this.peerConnections.get(from_user_id);
      if (!peer) return;

      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));

    } catch (error) {
      console.error('Error handling answer:', error);
      this.onError?.(error as Error);
    }
  }

  private async handleIceCandidate(data: {
    room_id: string;
    from_user_id: string;
    candidate: RTCIceCandidateInit;
  }): Promise<void> {
    try {
      const { from_user_id, candidate } = data;
      
      const peer = this.peerConnections.get(from_user_id);
      if (!peer) return;

      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));

    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      this.onError?.(error as Error);
    }
  }

  private removePeerConnection(userId: string): void {
    const peer = this.peerConnections.get(userId);
    if (peer) {
      peer.connection.close();
      peer.dataChannel?.close();
      this.peerConnections.delete(userId);
      this.onRemoteStreamRemoved?.(userId);
    }
  }

  // Public API methods

  async startLocalVideo(constraints?: MediaConstraints): Promise<MediaStream> {
    try {
      const mediaConstraints = constraints || this.mediaConstraints;
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      // Add tracks to existing peer connections
      this.peerConnections.forEach(peer => {
        this.localStream!.getTracks().forEach(track => {
          peer.connection.addTrack(track, this.localStream!);
        });
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting local video:', error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: true
      });

      // Replace video track in peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peerConnections.forEach(peer => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      // Notify other participants
      this.socket.emit('start-screen-share', {
        room_id: this.config.roomId
      });

      return this.screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = undefined;

      // Restore camera video if available
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
          this.peerConnections.forEach(peer => {
            const sender = peer.connection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }

      // Notify other participants
      this.socket.emit('stop-screen-share', {
        room_id: this.config.roomId
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  sendDataChannelMessage(message: any, targetUserId?: string): void {
    const messageStr = JSON.stringify(message);
    
    if (targetUserId) {
      const peer = this.peerConnections.get(targetUserId);
      if (peer?.dataChannel && peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(messageStr);
      }
    } else {
      // Send to all connected peers
      this.peerConnections.forEach(peer => {
        if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
          peer.dataChannel.send(messageStr);
        }
      });
    }
  }

  getConnectionStats(userId: string): Promise<RTCStatsReport | null> {
    const peer = this.peerConnections.get(userId);
    if (!peer) return Promise.resolve(null);
    
    return peer.connection.getStats();
  }

  private async startConnectionQualityMonitoring(): Promise<void> {
    setInterval(async () => {
      for (const [userId, peer] of this.peerConnections) {
        try {
          const stats = await peer.connection.getStats();
          const quality = this.calculateConnectionQuality(stats);
          this.onConnectionQuality?.(userId, quality);
        } catch (error) {
          console.error(`Error getting stats for ${userId}:`, error);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private calculateConnectionQuality(stats: RTCStatsReport): ConnectionQuality {
    let bandwidth = 0;
    let packetLoss = 0;
    let latency = 0;
    let jitter = 0;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        bandwidth = report.bytesReceived || 0;
        packetLoss = report.packetsLost || 0;
        jitter = report.jitter || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime || 0;
      }
    });

    // Simple quality calculation
    let quality: ConnectionQuality['quality'] = 'excellent';
    if (latency > 0.3 || packetLoss > 5 || jitter > 0.05) {
      quality = 'poor';
    } else if (latency > 0.2 || packetLoss > 2 || jitter > 0.03) {
      quality = 'fair';
    } else if (latency > 0.1 || packetLoss > 1 || jitter > 0.02) {
      quality = 'good';
    }

    return {
      bandwidth,
      packetLoss,
      latency: latency * 1000, // Convert to ms
      jitter: jitter * 1000, // Convert to ms
      quality
    };
  }

  leaveRoom(): void {
    this.socket.emit('leave-room', {
      room_id: this.config.roomId
    });
    this.cleanup();
  }

  private cleanup(): void {
    // Stop local streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = undefined;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = undefined;
    }

    // Close all peer connections
    this.peerConnections.forEach(peer => {
      peer.connection.close();
      peer.dataChannel?.close();
    });
    this.peerConnections.clear();

    this.isConnected = false;
  }

  disconnect(): void {
    this.leaveRoom();
    this.socket.disconnect();
  }

  // Getters
  get localMediaStream(): MediaStream | undefined {
    return this.localStream;
  }

  get screenMediaStream(): MediaStream | undefined {
    return this.screenStream;
  }

  get connectedPeers(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  get isRoomConnected(): boolean {
    return this.isConnected;
  }
}

export default WebRTCService;