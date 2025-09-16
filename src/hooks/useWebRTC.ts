import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

interface RemoteStream {
  id: string;
  stream: MediaStream;
  userId: string;
}

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  const webrtcConfig: WebRTCConfig = {
    iceServers: [
      { urls: import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302' },
      { urls: import.meta.env.VITE_STUN_SERVER_2 || 'stun:stun1.l.google.com:19302' },
      { urls: import.meta.env.VITE_STUN_SERVER_3 || 'stun:stun2.l.google.com:19302' },
      {
        urls: import.meta.env.VITE_TURN_SERVER || 'turn:openrelay.metered.ca:80',
        username: import.meta.env.VITE_TURN_USERNAME || 'openrelayproject',
        credential: import.meta.env.VITE_TURN_PASSWORD || 'openrelayproject'
      },
      {
        urls: import.meta.env.VITE_TURN_SERVER_2 || 'turn:openrelay.metered.ca:443',
        username: import.meta.env.VITE_TURN_USERNAME || 'openrelayproject',
        credential: import.meta.env.VITE_TURN_PASSWORD || 'openrelayproject'
      }
    ]
  };

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', {
        error: error instanceof Error ? error.message : error,
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Failed to access camera/microphone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found. Please check your devices.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera/microphone is already in use by another application.';
        }
      }
      
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((userId: string) => {
    const peerConnection = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const existing = prev.find(rs => rs.userId === userId);
        if (existing) {
          return prev.map(rs => 
            rs.userId === userId 
              ? { ...rs, stream: remoteStream }
              : rs
          );
        }
        return [...prev, {
          id: `${userId}-${Date.now()}`,
          stream: remoteStream,
          userId
        }];
      });
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state: ${peerConnection.connectionState}`);
      
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        setIsConnected(false);
        // Attempt to reconnect
        setTimeout(() => {
          if (peerConnection.connectionState === 'failed') {
            peerConnection.restartIce();
          }
        }, 1000);
      }
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        // This would be handled by the socket connection
        console.log('ICE candidate generated:', event.candidate);
      }
    };
    
    peerConnections.current.set(userId, peerConnection);
    return peerConnection;
  }, [webrtcConfig]);

  // Start call with a user
  const startCall = useCallback(async (userId: string) => {
    try {
      if (!localStreamRef.current) {
        await initializeLocalStream();
      }
      
      const peerConnection = createPeerConnection(userId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to remote peer via signaling server
      return offer;
    } catch (error) {
      console.error('Failed to start call:', {
        error: error instanceof Error ? error.message : error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
      toast.error(`Call failed: ${errorMessage}`);
      throw error;
    }
  }, [initializeLocalStream, createPeerConnection]);

  // Answer incoming call
  const answerCall = useCallback(async (userId: string, offer: RTCSessionDescriptionInit) => {
    try {
      if (!localStreamRef.current) {
        await initializeLocalStream();
      }
      
      const peerConnection = createPeerConnection(userId);
      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      console.error('Failed to answer call:', {
        error: error instanceof Error ? error.message : error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to answer call';
      toast.error(`Answer failed: ${errorMessage}`);
      throw error;
    }
  }, [initializeLocalStream, createPeerConnection]);

  // Handle answer from remote peer
  const handleAnswer = useCallback(async (userId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = peerConnections.current.get(userId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('Failed to handle answer:', {
        error: error instanceof Error ? error.message : error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error('Connection error occurred');
    }
  }, []);

  // Handle ICE candidate from remote peer
  const handleIceCandidate = useCallback(async (userId: string, candidate: RTCIceCandidateInit) => {
    try {
      const peerConnection = peerConnections.current.get(userId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', {
        error: error instanceof Error ? error.message : error,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Don't show toast for ICE candidate errors as they're common and usually recoverable
    }
  }, []);

  // End call with a user
  const endCall = useCallback((userId?: string) => {
    if (userId) {
      const peerConnection = peerConnections.current.get(userId);
      if (peerConnection) {
        peerConnection.close();
        peerConnections.current.delete(userId);
        
        setRemoteStreams(prev => prev.filter(rs => rs.userId !== userId));
      }
    } else {
      // End all calls
      peerConnections.current.forEach((pc, id) => {
        pc.close();
      });
      peerConnections.current.clear();
      setRemoteStreams([]);
      setIsConnected(false);
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        // Update all peer connections
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'audio'
          );
          if (sender && sender.track) {
            sender.track.enabled = audioTrack.enabled;
          }
        });
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Update all peer connections
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && sender.track) {
            sender.track.enabled = videoTrack.enabled;
          }
        });
      }
    }
  }, []);

  // Share screen
  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      peerConnections.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };
      
      toast.success('Screen sharing started');
    } catch (error) {
      console.error('Failed to share screen:', error);
      toast.error('Failed to share screen');
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      
      // Restore camera video track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnections.current.forEach(async (pc) => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        });
      }
      
      toast.info('Screen sharing stopped');
    }
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(async (userId: string) => {
    const peerConnection = peerConnections.current.get(userId);
    if (peerConnection) {
      const stats = await peerConnection.getStats();
      const connectionStats = {
        bandwidth: 0,
        latency: 0,
        packetLoss: 0,
        jitter: 0
      };
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          connectionStats.bandwidth = report.bytesReceived || 0;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          connectionStats.latency = report.currentRoundTripTime || 0;
        }
      });
      
      return connectionStats;
    }
    return null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    initializeLocalStream,
    startCall,
    answerCall,
    handleAnswer,
    handleIceCandidate,
    endCall,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
    getConnectionStats
  };
};