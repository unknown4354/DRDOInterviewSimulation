import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, Monitor, MonitorOff, Phone, Settings, Users } from 'lucide-react';
import WebRTCService from '../services/webrtcService';
import { toast } from 'sonner';

interface VideoConferenceProps {
  roomId: string;
  userId: string;
  userInfo: {
    name: string;
    role: string;
    avatar?: string;
  };
  onLeave?: () => void;
}

interface RemoteParticipant {
  userId: string;
  stream: MediaStream;
  name: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId,
  userId,
  userInfo,
  onLeave
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        const webrtcService = new WebRTCService({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: 'turn:your-turn-server.com:3478',
              username: 'your-username',
              credential: 'your-password'
            }
          ],
          socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
          roomId,
          userId,
          userInfo
        });

        // Set up event handlers
        webrtcService.onRemoteStream = (participantId: string, stream: MediaStream) => {
          setRemoteParticipants(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(participantId);
            newMap.set(participantId, {
              userId: participantId,
              stream,
              name: existing?.name || `User ${participantId.slice(0, 8)}`,
              connectionQuality: existing?.connectionQuality || 'good'
            });
            return newMap;
          });
        };

        webrtcService.onRemoteStreamRemoved = (participantId: string) => {
          setRemoteParticipants(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
          });
        };

        webrtcService.onConnectionStateChange = (participantId: string, state: RTCPeerConnectionState) => {
          console.log(`Connection state with ${participantId}: ${state}`);
          if (state === 'connected') {
            setConnectionStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            setConnectionStatus('disconnected');
          }
        };

        webrtcService.onConnectionQuality = (participantId: string, quality) => {
          setRemoteParticipants(prev => {
            const newMap = new Map(prev);
            const participant = newMap.get(participantId);
            if (participant) {
              participant.connectionQuality = quality.quality;
              newMap.set(participantId, participant);
            }
            return newMap;
          });
        };

        webrtcService.onError = (error: Error) => {
          console.error('WebRTC Error:', error);
          toast.error(`Connection error: ${error.message}`);
        };

        webrtcServiceRef.current = webrtcService;

        // Start local video
        const stream = await webrtcService.startLocalVideo();
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setConnectionStatus('connected');
        toast.success('Connected to video conference');

      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        toast.error('Failed to start video conference');
        setConnectionStatus('disconnected');
      }
    };

    initializeWebRTC();

    // Cleanup on unmount
    return () => {
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.disconnect();
      }
    };
  }, [roomId, userId, userInfo]);

  const toggleVideo = useCallback(() => {
    if (webrtcServiceRef.current) {
      const newState = !isVideoEnabled;
      webrtcServiceRef.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (webrtcServiceRef.current) {
      const newState = !isAudioEnabled;
      webrtcServiceRef.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!webrtcServiceRef.current) return;

    try {
      if (isScreenSharing) {
        await webrtcServiceRef.current.stopScreenShare();
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
      } else {
        const screenStream = await webrtcServiceRef.current.startScreenShare();
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
        
        // Update local video to show screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [isScreenSharing]);

  const handleLeave = use