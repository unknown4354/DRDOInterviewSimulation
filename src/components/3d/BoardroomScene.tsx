import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera,
  Text,
  Box,
  Plane,
  Sphere,
  useTexture,
  Html,
  Stats,
  PositionalAudio
} from '@react-three/drei';
import { Suspense } from 'react';
import { Vector3, Euler } from 'three';

// Types for 3D environment
interface ParticipantAvatar {
  id: string;
  name: string;
  position: Vector3;
  rotation: Euler;
  isActive: boolean;
  isSpeaking: boolean;
  role: 'interviewer' | 'candidate' | 'observer';
  audioStream?: MediaStream;
  audioLevel?: number;
}

interface BoardroomProps {
  participants: ParticipantAvatar[];
  currentUserId: string;
  onParticipantClick?: (participantId: string) => void;
  onCameraMove?: (position: Vector3, target: Vector3) => void;
  environmentSettings: {
    lighting: 'professional' | 'warm' | 'bright';
    roomStyle: 'modern' | 'classic' | 'government';
    showUI: boolean;
  };
}

// Boardroom Environment Component
const BoardroomEnvironment: React.FC<{ style: string }> = ({ style }) => {
  const roomTexture = useTexture({
    map: '/textures/wood-floor.jpg',
    normalMap: '/textures/wood-normal.jpg'
  });

  return (
    <group>
      {/* Floor */}
      <Plane 
        args={[20, 20]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          map={roomTexture.map}
          normalMap={roomTexture.normalMap}
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>

      {/* Walls */}
      <group name="walls">
        {/* Back Wall */}
        <Plane args={[20, 8]} position={[0, 4, -10]}>
          <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
        </Plane>
        
        {/* Side Walls */}
        <Plane args={[20, 8]} position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </Plane>
        
        <Plane args={[20, 8]} position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </Plane>
      </group>

      {/* Ceiling */}
      <Plane 
        args={[20, 20]} 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, 8, 0]}
      >
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </Plane>

      {/* Conference Table */}
      <ConferenceTable />

      {/* Government Emblem */}
      {style === 'government' && (
        <group position={[0, 6, -9.8]}>
          <Box args={[2, 1.5, 0.1]}>
            <meshStandardMaterial color="#1a365d" />
          </Box>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            DRDO
          </Text>
        </group>
      )}

      {/* Ambient Decorations */}
      <AmbientDecorations style={style} />
    </group>
  );
};

// Conference Table Component
const ConferenceTable: React.FC = () => {
  return (
    <group name="conference-table">
      {/* Main Table Surface */}
      <Box args={[8, 0.2, 4]} position={[0, 1.5, 0]}>
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.3} 
          metalness={0.1}
        />
      </Box>
      
      {/* Table Legs */}
      {[
        [-3.5, 0.75, -1.5],
        [3.5, 0.75, -1.5],
        [-3.5, 0.75, 1.5],
        [3.5, 0.75, 1.5]
      ].map((position, index) => (
        <Box key={index} args={[0.3, 1.5, 0.3]} position={position}>
          <meshStandardMaterial color="#654321" />
        </Box>
      ))}

      {/* Table Accessories */}
      <TableAccessories />
    </group>
  );
};

// Table Accessories Component
const TableAccessories: React.FC = () => {
  return (
    <group name="table-accessories">
      {/* Microphones */}
      {[
        [-2, 1.8, 0],
        [0, 1.8, 0],
        [2, 1.8, 0]
      ].map((position, index) => (
        <group key={`mic-${index}`} position={position}>
          <Box args={[0.1, 0.3, 0.1]}>
            <meshStandardMaterial color="#333333" />
          </Box>
          <Sphere args={[0.08]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#666666" />
          </Sphere>
        </group>
      ))}

      {/* Documents/Tablets */}
      {[
        [-1.5, 1.72, -0.8],
        [1.5, 1.72, -0.8],
        [0, 1.72, 0.8]
      ].map((position, index) => (
        <Box key={`doc-${index}`} args={[0.6, 0.02, 0.4]} position={position}>
          <meshStandardMaterial color="#f8f8f8" />
        </Box>
      ))}

      {/* Water Glasses */}
      {[
        [-2.5, 1.72, 0.5],
        [2.5, 1.72, 0.5],
        [0, 1.72, -1.2]
      ].map((position, index) => (
        <group key={`glass-${index}`} position={position}>
          <Sphere args={[0.06, 8, 6]} scale={[1, 1.5, 1]}>
            <meshPhysicalMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3}
              roughness={0}
              transmission={0.9}
            />
          </Sphere>
        </group>
      ))}
    </group>
  );
};

// Ambient Decorations Component
const AmbientDecorations: React.FC<{ style: string }> = ({ style }) => {
  return (
    <group name="ambient-decorations">
      {/* Ceiling Lights */}
      <CeilingLights />
      
      {/* Wall Decorations */}
      {style === 'government' && (
        <group>
          {/* Flag */}
          <group position={[-8, 4, -9.5]}>
            <Box args={[1.5, 1, 0.05]}>
              <meshStandardMaterial color="#ff9933" />
            </Box>
            <Box args={[1.5, 1, 0.05]} position={[0, -1, 0]}>
              <meshStandardMaterial color="#ffffff" />
            </Box>
            <Box args={[1.5, 1, 0.05]} position={[0, -2, 0]}>
              <meshStandardMaterial color="#138808" />
            </Box>
          </group>

          {/* Certificates/Awards */}
          {[
            [6, 5, -9.8],
            [8, 5, -9.8]
          ].map((position, index) => (
            <Box key={`cert-${index}`} args={[1, 1.2, 0.05]} position={position}>
              <meshStandardMaterial color="#f5f5f5" />
            </Box>
          ))}
        </group>
      )}

      {/* Plants */}
      {[
        [-8, 0, 8],
        [8, 0, 8],
        [-8, 0, -8],
        [8, 0, -8]
      ].map((position, index) => (
        <Plant key={`plant-${index}`} position={position} />
      ))}
    </group>
  );
};

// Ceiling Lights Component
const CeilingLights: React.FC = () => {
  return (
    <group name="ceiling-lights">
      {[
        [-4, 7.5, -2],
        [4, 7.5, -2],
        [-4, 7.5, 2],
        [4, 7.5, 2]
      ].map((position, index) => (
        <group key={`light-${index}`} position={position}>
          {/* Light Fixture */}
          <Box args={[1.5, 0.2, 1.5]}>
            <meshStandardMaterial color="#e0e0e0" />
          </Box>
          
          {/* Light Source */}
          <pointLight
            intensity={0.8}
            distance={15}
            decay={2}
            color="#ffffff"
            position={[0, -0.2, 0]}
          />
        </group>
      ))}
    </group>
  );
};

// Plant Component
const Plant: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Pot */}
      <Sphere args={[0.5, 8, 6]} scale={[1, 0.6, 1]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#8B4513" />
      </Sphere>
      
      {/* Plant Stems */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.3;
        const z = Math.sin(angle) * 0.3;
        return (
          <Box 
            key={i} 
            args={[0.05, 1.5, 0.05]} 
            position={[x, 1.3, z]}
            rotation={[Math.random() * 0.2, 0, Math.random() * 0.2]}
          >
            <meshStandardMaterial color="#228B22" />
          </Box>
        );
      })}
    </group>
  );
};

// Spatial Audio Component for 3D positional audio
const SpatialAudio: React.FC<{
  audioStream?: MediaStream;
  position: Vector3;
  isActive: boolean;
  volume?: number;
}> = ({ audioStream, position, isActive, volume = 1 }) => {
  const audioRef = useRef<THREE.PositionalAudio>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    if (audioRef.current && audioStream && isActive) {
      try {
        // Create audio context and source
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        
        // Connect audio nodes
        source.connect(gainNode);
        
        // Set up positional audio properties
        audioRef.current.setRefDistance(1);
        audioRef.current.setRolloffFactor(2);
        audioRef.current.setDistanceModel('exponential');
        audioRef.current.setMaxDistance(20);
        
        // Update listener position to camera
        const listener = audioContext.listener;
        if (listener.positionX) {
          listener.positionX.value = camera.position.x;
          listener.positionY.value = camera.position.y;
          listener.positionZ.value = camera.position.z;
        }
        
      } catch (error) {
        console.error('Failed to setup spatial audio:', error);
      }
    }
  }, [audioStream, isActive, volume, camera]);
  
  useFrame(() => {
    if (audioRef.current) {
      // Update audio position
      audioRef.current.position.copy(position);
      
      // Update listener orientation based on camera
      const listener = audioRef.current.context.listener;
      if (listener.forwardX) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(camera.quaternion);
        
        listener.forwardX.value = forward.x;
        listener.forwardY.value = forward.y;
        listener.forwardZ.value = forward.z;
        listener.upX.value = up.x;
        listener.upY.value = up.y;
        listener.upZ.value = up.z;
      }
    }
  });
  
  if (!audioStream || !isActive) return null;
  
  return (
    <positionalAudio
      ref={audioRef}
      args={[camera]}
      position={position}
    />
  );
};

// Enhanced Participant Avatar Component with Advanced Animations
const ParticipantAvatar: React.FC<{
  participant: ParticipantAvatar;
  isCurrentUser: boolean;
  onClick?: () => void;
}> = ({ participant, isCurrentUser, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [emotionState, setEmotionState] = useState<'neutral' | 'speaking' | 'listening' | 'thinking'>('neutral');

  // Update emotion state based on participant activity
  useEffect(() => {
    if (participant.isSpeaking) {
      setEmotionState('speaking');
    } else if (participant.isActive) {
      setEmotionState('listening');
    } else {
      setEmotionState('neutral');
    }
  }, [participant.isSpeaking, participant.isActive]);

  useFrame((state) => {
    if (meshRef.current && headRef.current && bodyRef.current) {
      const time = state.clock.elapsedTime;
      
      // Enhanced speaking animation with head movement
      if (participant.isSpeaking) {
        // Gentle floating animation
        meshRef.current.position.y = participant.position.y + Math.sin(time * 2) * 0.1;
        
        // Head nodding animation
        headRef.current.rotation.x = Math.sin(time * 4) * 0.1;
        headRef.current.rotation.y = Math.sin(time * 2.5) * 0.05;
        
        // Body slight movement
        bodyRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;
      } else {
        // Subtle breathing animation for non-speaking participants
        const breathingIntensity = participant.isActive ? 0.05 : 0.02;
        meshRef.current.position.y = participant.position.y + Math.sin(time * 0.8) * breathingIntensity;
        
        // Occasional head movement for listening
        if (participant.isActive && Math.sin(time * 0.3) > 0.8) {
          headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        } else {
          headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.05);
        }
      }
      
      // Enhanced glow effect for active participants
      if (participant.isActive) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        const glowIntensity = participant.isSpeaking ? 0.4 : 0.2;
        material.emissive.setHex(participant.isSpeaking ? 0x004400 : 0x000044);
        material.emissiveIntensity = glowIntensity + Math.sin(time * 3) * 0.1;
      }
      
      // Hover animation
      if (hovered) {
        bodyRef.current.scale.setScalar(1 + Math.sin(time * 8) * 0.02);
      } else {
        bodyRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  const getAvatarColor = () => {
    switch (participant.role) {
      case 'interviewer': return '#2563eb'; // Blue
      case 'candidate': return '#dc2626'; // Red
      case 'observer': return '#16a34a'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <group 
      position={participant.position}
      rotation={participant.rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Avatar Body Group */}
      <group ref={bodyRef}>
        {/* Avatar Head */}
        <Sphere 
          ref={headRef}
          args={[0.25, 16, 16]} 
          position={[0, 2.4, 0]}
        >
          <meshStandardMaterial 
            color={getAvatarColor()}
            roughness={0.3}
            metalness={0.1}
            transparent
            opacity={isCurrentUser ? 0.8 : 1}
          />
        </Sphere>
        
        {/* Avatar Eyes */}
        <group position={[0, 2.4, 0]}>
          <Sphere args={[0.03]} position={[-0.08, 0.05, 0.2]}>
            <meshStandardMaterial color="#ffffff" />
          </Sphere>
          <Sphere args={[0.03]} position={[0.08, 0.05, 0.2]}>
            <meshStandardMaterial color="#ffffff" />
          </Sphere>
          <Sphere args={[0.015]} position={[-0.08, 0.05, 0.22]}>
            <meshStandardMaterial color="#000000" />
          </Sphere>
          <Sphere args={[0.015]} position={[0.08, 0.05, 0.22]}>
            <meshStandardMaterial color="#000000" />
          </Sphere>
        </group>
        
        {/* Avatar Body */}
        <Sphere 
          ref={meshRef}
          args={[0.35, 16, 16]} 
          position={[0, 1.8, 0]}
          scale={[1, 1.2, 0.8]}
        >
          <meshStandardMaterial 
            color={getAvatarColor()}
            roughness={0.4}
            metalness={0.1}
            transparent
            opacity={isCurrentUser ? 0.8 : 1}
          />
        </Sphere>
        
        {/* Avatar Arms */}
        <Sphere args={[0.15, 8, 8]} position={[-0.45, 1.8, 0]} scale={[1, 1.5, 1]}>
          <meshStandardMaterial color={getAvatarColor()} roughness={0.4} />
        </Sphere>
        <Sphere args={[0.15, 8, 8]} position={[0.45, 1.8, 0]} scale={[1, 1.5, 1]}>
          <meshStandardMaterial color={getAvatarColor()} roughness={0.4} />
        </Sphere>
      </group>

      {/* Chair */}
      <Chair position={[0, 0, 0]} />

      {/* Name Label */}
      <Html position={[0, 3, 0]} center>
        <div className={`
          px-2 py-1 rounded-md text-sm font-medium transition-all duration-200
          ${participant.isActive ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          {participant.name}
          {participant.isSpeaking && (
            <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </Html>

      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <group position={[0, 2.8, 0]}>
          {Array.from({ length: 3 }, (_, i) => (
            <Sphere key={i} args={[0.05]} position={[i * 0.15 - 0.15, 0, 0]}>
              <meshStandardMaterial 
                color="#ef4444" 
                emissive="#ef4444"
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}
        </group>
      )}

      {/* Role Indicator */}
      <group position={[0, 1.8, 0]}>
        <Text
          fontSize={0.15}
          color={getAvatarColor()}
          anchorX="center"
          anchorY="middle"
        >
          {participant.role.toUpperCase()}
        </Text>
      </group>
      
      {/* Spatial Audio */}
      <SpatialAudio
        audioStream={participant.audioStream}
        position={participant.position}
        isActive={participant.isActive && participant.isSpeaking}
        volume={participant.audioLevel || 1}
      />
    </group>
  );
};

// Chair Component
const Chair: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Seat */}
      <Box args={[0.8, 0.1, 0.8]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#4a5568" />
      </Box>
      
      {/* Backrest */}
      <Box args={[0.8, 1.2, 0.1]} position={[0, 1.6, -0.35]}>
        <meshStandardMaterial color="#4a5568" />
      </Box>
      
      {/* Chair Legs */}
      {[
        [-0.3, 0.5, -0.3],
        [0.3, 0.5, -0.3],
        [-0.3, 0.5, 0.3],
        [0.3, 0.5, 0.3]
      ].map((legPosition, index) => (
        <Box key={index} args={[0.05, 1, 0.05]} position={legPosition}>
          <meshStandardMaterial color="#2d3748" />
        </Box>
      ))}
    </group>
  );
};

// Camera Controller Component
const CameraController: React.FC<{
  participants: ParticipantAvatar[];
  currentUserId: string;
  onCameraMove?: (position: Vector3, target: Vector3) => void;
}> = ({ participants, currentUserId, onCameraMove }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  const focusOnParticipant = useCallback((participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (participant && controlsRef.current) {
      const targetPosition = new Vector3(
        participant.position.x + 2,
        participant.position.y + 1,
        participant.position.z + 2
      );
      
      controlsRef.current.setLookAt(
        targetPosition.x, targetPosition.y, targetPosition.z,
        participant.position.x, participant.position.y + 1, participant.position.z,
        true
      );
    }
  }, [participants]);

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(
        0, 8, 12,
        0, 2, 0,
        true
      );
    }
  }, []);

  useEffect(() => {
    // Auto-focus on speaking participant
    const speakingParticipant = participants.find(p => p.isSpeaking);
    if (speakingParticipant) {
      focusOnParticipant(speakingParticipant.id);
    }
  }, [participants, focusOnParticipant]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      onChange={(e) => {
        if (onCameraMove && e?.target) {
          const controls = e.target as any;
          onCameraMove(
            new Vector3().copy(controls.object.position),
            new Vector3().copy(controls.target)
          );
        }
      }}
    />
  );
};

// Lighting Setup Component
const LightingSetup: React.FC<{ style: string }> = ({ style }) => {
  const getLightingConfig = () => {
    switch (style) {
      case 'professional':
        return { ambient: 0.4, directional: 0.8, color: '#ffffff' };
      case 'warm':
        return { ambient: 0.5, directional: 0.7, color: '#fff8dc' };
      case 'bright':
        return { ambient: 0.6, directional: 0.9, color: '#f0f8ff' };
      default:
        return { ambient: 0.4, directional: 0.8, color: '#ffffff' };
    }
  };

  const config = getLightingConfig();

  return (
    <>
      <ambientLight intensity={config.ambient} color={config.color} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={config.directional}
        color={config.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight
        skyColor={config.color}
        groundColor="#444444"
        intensity={0.3}
      />
    </>
  );
};

// Main Boardroom Scene Component
const BoardroomScene: React.FC<BoardroomProps> = ({
  participants,
  currentUserId,
  onParticipantClick,
  onCameraMove,
  environmentSettings
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for 3D assets
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading 3D Boardroom...</p>
          <p className="text-sm text-gray-400 mt-2">Initializing WebGL renderer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 8, 12], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <LightingSetup style={environmentSettings.lighting} />
          
          {/* Environment */}
          <BoardroomEnvironment style={environmentSettings.roomStyle} />
          
          {/* Participants */}
          {participants.map((participant) => (
            <ParticipantAvatar
              key={participant.id}
              participant={participant}
              isCurrentUser={participant.id === currentUserId}
              onClick={() => onParticipantClick?.(participant.id)}
            />
          ))}
          
          {/* Camera Controls */}
          <CameraController
            participants={participants}
            currentUserId={currentUserId}
            onCameraMove={onCameraMove}
          />
          
          {/* Environment Mapping */}
          <Environment preset="city" background={false} />
        </Suspense>
        
        {/* Performance Stats (Development) */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>
      
      {/* UI Overlay */}
      {environmentSettings.showUI && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">3D Boardroom</h3>
          <div className="space-y-1 text-sm">
            <p>Participants: {participants.length}</p>
            <p>Active: {participants.filter(p => p.isActive).length}</p>
            <p>Speaking: {participants.filter(p => p.isSpeaking).length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardroomScene;
export type { ParticipantAvatar, BoardroomProps };