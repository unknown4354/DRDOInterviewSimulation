import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Vector3 } from 'three';
import BoardroomScene, { ParticipantAvatar } from '../3d/BoardroomScene';
import BoardroomControls from '../3d/BoardroomControls';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../hooks/useSocket';
import { useAI } from '../../hooks/useAI';
import { toast } from 'sonner';

interface InterviewRoom3DProps {
  interviewId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'interviewer' | 'candidate' | 'observer';
  };
  onLeaveRoom: () => void;
}

const InterviewRoom3D: React.FC<InterviewRoom3DProps> = ({
  interviewId,
  currentUser,
  onLeaveRoom
}) => {
  // State management
  const [participants, setParticipants] = useState<ParticipantAvatar[]>([]);
  const [environmentSettings, setEnvironmentSettings] = useState({
    lighting: 'professional' as const,
    roomStyle: 'government' as const,
    showUI: true
  });
  const [mediaState, setMediaState] = useState({
    audio: false,
    video: false,
    screenShare: false
  });
  const [currentViewMode, setCurrentViewMode] = useState('overview');
  const [cameraPosition, setCameraPosition] = useState<Vector3>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [roomStatus, setRoomStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  
  // Refs
  const roomIdRef = useRef<string>();
  const keyboardHandlerRef = useRef<(event: KeyboardEvent) => void>();
  const audioAnalyzers = useRef<Map<string, AnalyserNode>>(new Map());
  const animationFrameRef = useRef<number>();

  // Custom hooks
  const { 
    localStream, 
    remoteStreams, 
    isConnected: webrtcConnected,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare
  } = useWebRTC();

  const {
    socket,
    isConnected: socketConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    participants: socketParticipants
  } = useSocket();

  const {
    analyzeEmotion,
    evaluateAnswer,
    generateQuestions
  } = useAI();

  // Real-time audio level monitoring
  const startAudioLevelMonitoring = useCallback(() => {
    const monitorAudioLevels = () => {
      const newAudioLevels = new Map<string, number>();
      
      // Monitor remote streams
      remoteStreams.forEach(({ userId, stream }) => {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          let analyzer = audioAnalyzers.current.get(userId);
          
          if (!analyzer) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = audioContext.createMediaStreamSource(stream);
              analyzer = audioContext.createAnalyser();
              analyzer.fftSize = 256;
              source.connect(analyzer);
              audioAnalyzers.current.set(userId, analyzer);
            } catch (error) {
              console.error('Failed to create audio analyzer:', error);
              return;
            }
          }
          
          const dataArray = new Uint8Array(analyzer.frequencyBinCount);
          analyzer.getByteFrequencyData(dataArray);
          
          // Calculate average audio level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedLevel = average / 255;
          
          newAudioLevels.set(userId, normalizedLevel);
        } else {
          newAudioLevels.set(userId, 0);
        }
      });
      
      // Monitor local stream
      if (localStream && mediaState.audio) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          let analyzer = audioAnalyzers.current.get(currentUser.id);
          
          if (!analyzer) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = audioContext.createMediaStreamSource(localStream);
              analyzer = audioContext.createAnalyser();
              analyzer.fftSize = 256;
              source.connect(analyzer);
              audioAnalyzers.current.set(currentUser.id, analyzer);
            } catch (error) {
              console.error('Failed to create local audio analyzer:', error);
            }
          }
          
          if (analyzer) {
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            analyzer.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const normalizedLevel = average / 255;
            newAudioLevels.set(currentUser.id, normalizedLevel);
          }
        }
      }
      
      setAudioLevels(newAudioLevels);
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevels);
    };
    
    monitorAudioLevels();
  }, [remoteStreams, localStream, mediaState.audio, currentUser.id]);

  // Start audio monitoring when streams are available
  useEffect(() => {
    if ((remoteStreams.length > 0 || localStream) && roomStatus === 'connected') {
      startAudioLevelMonitoring();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [remoteStreams, localStream, roomStatus, startAudioLevelMonitoring]);

  // Initialize room and connections
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        // Generate room ID based on interview
        roomIdRef.current = `interview_${interviewId}`;
        
        // Join socket room
        if (socket && socketConnected) {
          await joinRoom(roomIdRef.current, {
            interview_id: interviewId,
            user_info: {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role
            }
          });
          
          setRoomStatus('connected');
          setIsInitialized(true);
          
          toast.success('Connected to 3D interview room');
        }
      } catch (error) {
        console.error('Failed to initialize room:', error);
        toast.error('Failed to connect to interview room');
        setRoomStatus('disconnected');
      }
    };

    if (socketConnected && !isInitialized) {
      initializeRoom();
    }
  }, [socketConnected, isInitialized, interviewId, currentUser, socket, joinRoom]);

  // Enhanced participant management with audio stream integration
  useEffect(() => {
    if (socketParticipants) {
      const avatars: ParticipantAvatar[] = socketParticipants.map((participant, index) => {
        // Calculate positions around the table with better spacing
        const totalParticipants = Math.max(socketParticipants.length, 1);
        const angle = (index / totalParticipants) * Math.PI * 2;
        const radius = Math.max(3, totalParticipants * 0.8); // Dynamic radius based on participant count
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Find corresponding remote stream for this participant
        const remoteStream = remoteStreams.find(rs => rs.userId === participant.user_id);
        
        // Get real-time audio level
         const audioLevel = audioLevels.get(participant.user_id) || 0;
         const speakingThreshold = 0.1; // Threshold for considering someone as speaking
        
        return {
          id: participant.user_id,
          name: participant.user_info?.name || 'Unknown',
          position: new Vector3(x, 0, z),
          rotation: new THREE.Euler(0, angle + Math.PI, 0),
          isActive: participant.connection_status === 'connected',
           isSpeaking: participant.media_state?.audio_enabled && audioLevel > speakingThreshold,
           role: participant.user_info?.role || 'observer',
          audioStream: remoteStream?.stream,
          audioLevel: audioLevel
        };
      });
      
      setParticipants(avatars);
    }
  }, [socketParticipants, remoteStreams, audioLevels]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      // Prevent default if we're handling the key
      const handled = true;
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handleMediaToggle('audio');
          break;
        case 'KeyV':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleMediaToggle('video');
          } else {
            return; // Don't handle Ctrl+V or Cmd+V
          }
          break;
        case 'KeyS':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleMediaToggle('screenShare');
          } else {
            return; // Don't handle Ctrl+S or Cmd+S
          }
          break;
        case 'KeyR':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            handleCameraReset();
          } else {
            return; // Don't handle Ctrl+R or Cmd+R
          }
          break;
        case 'Digit1':
          event.preventDefault();
          setCurrentViewMode('overview');
          break;
        case 'Digit2':
          event.preventDefault();
          setCurrentViewMode('focus');
          break;
        case 'Digit3':
          event.preventDefault();
          setCurrentViewMode('presentation');
          break;
        default:
          return; // Key not handled
      }
    };

    keyboardHandlerRef.current = handleKeyboard;
    document.addEventListener('keydown', handleKeyboard);
    
    return () => {
      if (keyboardHandlerRef.current) {
        document.removeEventListener('keydown', keyboardHandlerRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomIdRef.current) {
        leaveRoom(roomIdRef.current);
      }
      endCall();
    };
  }, [leaveRoom, endCall]);

  // Event handlers
  const handleMediaToggle = useCallback(async (type: 'audio' | 'video' | 'screenShare') => {
    try {
      switch (type) {
        case 'audio':
          await toggleAudio();
          const newAudioState = !mediaState.audio;
          setMediaState(prev => ({ ...prev, audio: newAudioState }));
          
          // Notify other participants
          if (socket && roomIdRef.current) {
            socket.emit('media-state-change', {
              room_id: roomIdRef.current,
              user_id: currentUser.id,
              media_type: 'audio',
              enabled: newAudioState
            });
          }
          
          // Update WebRTC peer connections
          if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = newAudioState;
            }
          }
          
          toast.success(newAudioState ? 'Microphone enabled' : 'Microphone disabled');
          break;
          
        case 'video':
          await toggleVideo();
          const newVideoState = !mediaState.video;
          setMediaState(prev => ({ ...prev, video: newVideoState }));
          
          if (socket && roomIdRef.current) {
            socket.emit('media-state-change', {
              room_id: roomIdRef.current,
              user_id: currentUser.id,
              media_type: 'video',
              enabled: newVideoState
            });
          }
          
          // Update WebRTC peer connections
          if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = newVideoState;
            }
          }
          
          toast.success(newVideoState ? 'Camera enabled' : 'Camera disabled');
          break;
          
        case 'screenShare':
          if (mediaState.screenShare) {
            await stopScreenShare();
            setMediaState(prev => ({ ...prev, screenShare: false }));
            
            if (socket && roomIdRef.current) {
              socket.emit('stop-screen-share', {
                room_id: roomIdRef.current
              });
            }
          } else {
            await shareScreen();
            setMediaState(prev => ({ ...prev, screenShare: true }));
            
            if (socket && roomIdRef.current) {
              socket.emit('start-screen-share', {
                room_id: roomIdRef.current
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to toggle ${type}:`, error);
      toast.error(`Failed to toggle ${type}`);
    }
  }, [toggleAudio, toggleVideo, shareScreen, stopScreenShare, mediaState, socket, currentUser.id]);

  const handleParticipantClick = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      toast.info(`Focusing on ${participant.name}`);
      
      // Trigger AI emotion analysis for the focused participant
      if (participantId !== currentUser.id) {
        analyzeEmotion(interviewId, participantId, {
          timestamp: new Date(),
          facial_expressions: {}, // Would come from video analysis
          voice_indicators: {}, // Would come from audio analysis
          body_language: {} // Would come from pose detection
        });
      }
    }
  }, [participants, currentUser.id, analyzeEmotion, interviewId]);

  const handleCameraMove = useCallback((position: Vector3, target: Vector3) => {
    setCameraPosition(position);
  }, []);

  const handleCameraReset = useCallback(() => {
    // This will be handled by the BoardroomScene component
    toast.info('Camera reset to overview');
  }, []);

  const handleViewModeChange = useCallback((mode: 'overview' | 'focus' | 'presentation') => {
    setCurrentViewMode(mode);
    toast.info(`Switched to ${mode} view`);
    
    // Log view change for analytics
    if (socket && roomIdRef.current) {
      socket.emit('view-mode-change', {
        room_id: roomIdRef.current,
        user_id: currentUser.id,
        view_mode: mode
      });
    }
  }, [socket, currentUser.id]);

  const handleParticipantFocus = useCallback((participantId: string) => {
    handleParticipantClick(participantId);
  }, [handleParticipantClick]);

  const handleEnvironmentChange = useCallback((newSettings: typeof environmentSettings) => {
    setEnvironmentSettings(newSettings);
    
    // Save preferences
    localStorage.setItem('boardroom-environment', JSON.stringify(newSettings));
  }, []);

  // Load saved environment preferences
  useEffect(() => {
    const saved = localStorage.getItem('boardroom-environment');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEnvironmentSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load environment preferences:', error);
      }
    }
  }, []);

  // Handle connection status changes
  useEffect(() => {
    if (roomStatus === 'disconnected') {
      toast.error('Disconnected from interview room');
    }
  }, [roomStatus]);

  // Render loading state
  if (!isInitialized || roomStatus === 'connecting') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Connecting to 3D Interview Room</h2>
          <p className="text-gray-400">Initializing WebRTC and Socket connections...</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className={`flex items-center justify-center space-x-2 ${
              socketConnected ? 'text-green-400' : 'text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
              }`}></div>
              <span>Socket Connection</span>
            </div>
            <div className={`flex items-center justify-center space-x-2 ${
              webrtcConnected ? 'text-green-400' : 'text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                webrtcConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
              }`}></div>
              <span>WebRTC Connection</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (roomStatus === 'disconnected') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-6">Unable to connect to the 3D interview room. Please check your internet connection and try again.</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={onLeaveRoom}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-900">
      {/* 3D Boardroom Scene */}
      <BoardroomScene
        participants={participants}
        currentUserId={currentUser.id}
        onParticipantClick={handleParticipantClick}
        onCameraMove={handleCameraMove}
        environmentSettings={environmentSettings}
      />
      
      {/* 3D Controls Overlay */}
      <BoardroomControls
        environmentSettings={environmentSettings}
        onEnvironmentChange={handleEnvironmentChange}
        mediaState={mediaState}
        onMediaToggle={handleMediaToggle}
        cameraPosition={cameraPosition}
        onCameraReset={handleCameraReset}
        onViewModeChange={handleViewModeChange}
        currentViewMode={currentViewMode}
        participants={participants}
        onParticipantFocus={handleParticipantFocus}
      />
      
      {/* Emergency Exit Button */}
      <button
        onClick={onLeaveRoom}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
      >
        Leave Room
      </button>
      
      {/* Status Indicators */}
      <div className="absolute bottom-4 left-4 space-y-2 z-40">
        {/* WebRTC Status */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          webrtcConnected 
            ? 'bg-green-900 bg-opacity-80 text-green-300' 
            : 'bg-red-900 bg-opacity-80 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            webrtcConnected ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span>WebRTC {webrtcConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {/* Participant Count */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-blue-900 bg-opacity-80 text-blue-300">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span>{participants.length} Participant{participants.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom3D;