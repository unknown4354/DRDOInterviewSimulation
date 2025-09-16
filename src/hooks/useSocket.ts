import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketParticipant {
  user_id: string;
  user_info: {
    id: string;
    name: string;
    role: string;
  };
  connection_status: 'connected' | 'disconnected' | 'reconnecting';
  media_state: {
    audio_enabled: boolean;
    video_enabled: boolean;
    screen_sharing: boolean;
  };
  joined_at: Date;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: Date;
  message_type: 'text' | 'file' | 'system';
}

interface RoomInfo {
  id: string;
  interview_id: string;
  participant_count: number;
  created_at: Date;
  recording_active: boolean;
}

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<SocketParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setConnectionError('Authentication token not found');
      return;
    }

    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      toast.success('Connected to server');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setParticipants([]);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        toast.error('Disconnected by server');
      } else {
        toast.warning('Connection lost, attempting to reconnect...');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Failed to connect after multiple attempts');
        socketInstance.disconnect();
      }
    });

    // Room event handlers
    socketInstance.on('room-joined', (data) => {
      console.log('Joined room:', data);
      setRoomInfo(data.room_info);
      setParticipants(data.participants || []);
      setMessages(data.chat_history || []);
      toast.success('Joined interview room');
    });

    socketInstance.on('participant-joined', (data) => {
      console.log('Participant joined:', data);
      setParticipants(prev => {
        const existing = prev.find(p => p.user_id === data.participant.user_id);
        if (existing) {
          return prev.map(p => 
            p.user_id === data.participant.user_id ? data.participant : p
          );
        }
        return [...prev, data.participant];
      });
      
      if (data.room_info) {
        setRoomInfo(data.room_info);
      }
      
      toast.info(`${data.participant.user_info.name} joined the room`);
    });

    socketInstance.on('participant-left', (data) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
      
      if (data.room_info) {
        setRoomInfo(data.room_info);
      }
      
      const participant = participants.find(p => p.user_id === data.user_id);
      if (participant) {
        toast.info(`${participant.user_info.name} left the room`);
      }
    });

    socketInstance.on('participant-disconnected', (data) => {
      console.log('Participant disconnected:', data);
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === data.user_id 
            ? { ...p, connection_status: 'disconnected' }
            : p
        )
      );
      
      const participant = participants.find(p => p.user_id === data.user_id);
      if (participant) {
        toast.warning(`${participant.user_info.name} disconnected`);
      }
    });

    // Chat event handlers
    socketInstance.on('new-message', (message: ChatMessage) => {
      console.log('New message:', message);
      setMessages(prev => [...prev, message]);
    });

    socketInstance.on('user-typing', (data) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });

    // WebRTC signaling handlers
    socketInstance.on('webrtc-offer', (data) => {
      console.log('WebRTC offer received:', data);
      // This would be handled by the WebRTC hook
    });

    socketInstance.on('webrtc-answer', (data) => {
      console.log('WebRTC answer received:', data);
      // This would be handled by the WebRTC hook
    });

    socketInstance.on('webrtc-ice-candidate', (data) => {
      console.log('ICE candidate received:', data);
      // This would be handled by the WebRTC hook
    });

    // Media state handlers
    socketInstance.on('media-state-change', (data) => {
      console.log('Media state change:', data);
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === data.user_id 
            ? { 
                ...p, 
                media_state: {
                  ...p.media_state,
                  [data.media_type + '_enabled']: data.enabled
                }
              }
            : p
        )
      );
    });

    // Screen sharing handlers
    socketInstance.on('screen-share-started', (data) => {
      console.log('Screen share started:', data);
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === data.user_id 
            ? { ...p, media_state: { ...p.media_state, screen_sharing: true } }
            : p
        )
      );
      toast.info(`${data.user_name} started screen sharing`);
    });

    socketInstance.on('screen-share-stopped', (data) => {
      console.log('Screen share stopped:', data);
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === data.user_id 
            ? { ...p, media_state: { ...p.media_state, screen_sharing: false } }
            : p
        )
      );
      toast.info('Screen sharing stopped');
    });

    // Recording handlers
    socketInstance.on('recording-started', (data) => {
      console.log('Recording started:', data);
      setRoomInfo(prev => prev ? { ...prev, recording_active: true } : null);
      toast.info('Recording started');
    });

    socketInstance.on('recording-stopped', (data) => {
      console.log('Recording stopped:', data);
      setRoomInfo(prev => prev ? { ...prev, recording_active: false } : null);
      toast.info('Recording stopped');
    });

    // File sharing handlers
    socketInstance.on('file-shared', (data) => {
      console.log('File shared:', data);
      toast.info(`File shared: ${data.file_name}`);
    });

    // Error handlers
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Socket error occurred');
    });

    socketInstance.on('webrtc-error', (error) => {
      console.error('WebRTC error:', error);
      toast.error(error.message || 'WebRTC error occurred');
    });

    // Emergency disconnect handler
    socketInstance.on('emergency-disconnect', (data) => {
      console.log('Emergency disconnect:', data);
      toast.error(`Emergency disconnect: ${data.reason}`);
      socketInstance.disconnect();
    });

    return socketInstance;
  }, [participants]);

  // Join a room
  const joinRoom = useCallback(async (roomId: string, userInfo: any) => {
    if (!socketRef.current) {
      throw new Error('Socket not connected');
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join room timeout'));
      }, 10000);

      socketRef.current!.emit('join-room', {
        room_id: roomId,
        interview_id: userInfo.interview_id,
        user_info: userInfo.user_info
      });

      const handleJoined = () => {
        clearTimeout(timeout);
        socketRef.current!.off('room-joined', handleJoined);
        socketRef.current!.off('error', handleError);
        resolve();
      };

      const handleError = (error: any) => {
        clearTimeout(timeout);
        socketRef.current!.off('room-joined', handleJoined);
        socketRef.current!.off('error', handleError);
        reject(new Error(error.message || 'Failed to join room'));
      };

      socketRef.current!.once('room-joined', handleJoined);
      socketRef.current!.once('error', handleError);
    });
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { room_id: roomId });
      setParticipants([]);
      setMessages([]);
      setRoomInfo(null);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((roomId: string, content: string, messageType: 'text' | 'file' | 'system' = 'text') => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        room_id: roomId,
        content,
        message_type: messageType
      });
    }
  }, []);

  // Send typing indicator
  const sendTypingStart = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-start', { room_id: roomId });
    }
  }, []);

  const sendTypingStop = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { room_id: roomId });
    }
  }, []);

  // Share a file
  const shareFile = useCallback((roomId: string, fileInfo: any, description?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('share-file', {
        room_id: roomId,
        file_info: fileInfo,
        description
      });
    }
  }, []);

  // WebRTC signaling methods
  const sendWebRTCOffer = useCallback((roomId: string, targetUserId: string, offer: RTCSessionDescriptionInit, mediaType: string) => {
    if (socketRef.current) {
      socketRef.current.emit('webrtc-offer', {
        room_id: roomId,
        target_user_id: targetUserId,
        offer,
        media_type: mediaType
      });
    }
  }, []);

  const sendWebRTCAnswer = useCallback((roomId: string, targetUserId: string, answer: RTCSessionDescriptionInit) => {
    if (socketRef.current) {
      socketRef.current.emit('webrtc-answer', {
        room_id: roomId,
        target_user_id: targetUserId,
        answer
      });
    }
  }, []);

  const sendICECandidate = useCallback((roomId: string, targetUserId: string, candidate: RTCIceCandidateInit) => {
    if (socketRef.current) {
      socketRef.current.emit('webrtc-ice-candidate', {
        room_id: roomId,
        target_user_id: targetUserId,
        candidate
      });
    }
  }, []);

  // Recording control
  const startRecording = useCallback((roomId: string, settings: any) => {
    if (socketRef.current) {
      socketRef.current.emit('start-recording', {
        room_id: roomId,
        recording_settings: settings
      });
    }
  }, []);

  const stopRecording = useCallback((roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('stop-recording', {
        room_id: roomId
      });
    }
  }, []);

  // Connection quality reporting
  const reportConnectionQuality = useCallback((roomId: string, qualityMetrics: any) => {
    if (socketRef.current) {
      socketRef.current.emit('connection-quality', {
        room_id: roomId,
        quality_metrics: qualityMetrics
      });
    }
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    const socketInstance = initializeSocket();
    
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [initializeSocket]);

  // Reconnection logic
  useEffect(() => {
    if (!isConnected && socketRef.current && reconnectAttempts.current < maxReconnectAttempts) {
      const reconnectTimer = setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          console.log(`Attempting to reconnect... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          socketRef.current.connect();
        }
      }, Math.pow(2, reconnectAttempts.current) * 1000); // Exponential backoff

      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    participants,
    messages,
    roomInfo,
    connectionError,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    shareFile,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    startRecording,
    stopRecording,
    reportConnectionQuality
  };
};