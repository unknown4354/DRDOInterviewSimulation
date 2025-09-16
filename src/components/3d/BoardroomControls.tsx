import React, { useState, useCallback } from 'react';
import { 
  Settings, 
  Camera, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Palette,
  Users,
  Maximize,
  Minimize,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Vector3 } from 'three';

interface BoardroomControlsProps {
  environmentSettings: {
    lighting: 'professional' | 'warm' | 'bright';
    roomStyle: 'modern' | 'classic' | 'government';
    showUI: boolean;
  };
  onEnvironmentChange: (settings: any) => void;
  mediaState: {
    audio: boolean;
    video: boolean;
    screenShare: boolean;
  };
  onMediaToggle: (type: 'audio' | 'video' | 'screenShare') => void;
  cameraPosition?: Vector3;
  onCameraReset: () => void;
  onViewModeChange: (mode: 'overview' | 'focus' | 'presentation') => void;
  currentViewMode: string;
  participants: any[];
  onParticipantFocus: (participantId: string) => void;
}

const BoardroomControls: React.FC<BoardroomControlsProps> = ({
  environmentSettings,
  onEnvironmentChange,
  mediaState,
  onMediaToggle,
  cameraPosition,
  onCameraReset,
  onViewModeChange,
  currentViewMode,
  participants,
  onParticipantFocus
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleLightingChange = (lighting: 'professional' | 'warm' | 'bright') => {
    onEnvironmentChange({
      ...environmentSettings,
      lighting
    });
  };

  const handleRoomStyleChange = (roomStyle: 'modern' | 'classic' | 'government') => {
    onEnvironmentChange({
      ...environmentSettings,
      roomStyle
    });
  };

  const toggleUI = () => {
    onEnvironmentChange({
      ...environmentSettings,
      showUI: !environmentSettings.showUI
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Main Control Panel - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl border border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Media Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onMediaToggle('audio')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  mediaState.audio 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={mediaState.audio ? 'Mute Audio' : 'Unmute Audio'}
              >
                {mediaState.audio ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={() => onMediaToggle('video')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  mediaState.video 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={mediaState.video ? 'Turn Off Video' : 'Turn On Video'}
              >
                {mediaState.video ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                onClick={() => onMediaToggle('screenShare')}
                className={`p-3 rounded-full transition-all duration-200 ${
                  mediaState.screenShare 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                title={mediaState.screenShare ? 'Stop Screen Share' : 'Start Screen Share'}
              >
                {mediaState.screenShare ? <MonitorOff size={20} /> : <Monitor size={20} />}
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-600"></div>

            {/* View Mode Controls */}
            <div className="flex items-center space-x-2">
              {['overview', 'focus', 'presentation'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentViewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-600"></div>

            {/* Utility Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onCameraReset}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                title="Reset Camera"
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                title="Show Participants"
              >
                <Users size={20} />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                title="Settings"
              >
                <Settings size={20} />
              </button>

              <button
                onClick={handleFullscreen}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-6 right-6 pointer-events-auto">
          <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Environment Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Lighting Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Sun className="inline w-4 h-4 mr-2" />
                  Lighting Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'professional', label: 'Professional', color: 'bg-blue-600' },
                    { value: 'warm', label: 'Warm', color: 'bg-orange-600' },
                    { value: 'bright', label: 'Bright', color: 'bg-yellow-600' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleLightingChange(option.value as any)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                        environmentSettings.lighting === option.value
                          ? `${option.color} text-white`
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Style Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Palette className="inline w-4 h-4 mr-2" />
                  Room Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'modern', label: 'Modern', color: 'bg-purple-600' },
                    { value: 'classic', label: 'Classic', color: 'bg-green-600' },
                    { value: 'government', label: 'Government', color: 'bg-red-600' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRoomStyleChange(option.value as any)}
                      className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                        environmentSettings.roomStyle === option.value
                          ? `${option.color} text-white`
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Interface Options
                </label>
                <div className="space-y-2">
                  <button
                    onClick={toggleUI}
                    className={`w-full p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                      environmentSettings.showUI
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className="flex items-center">
                      {environmentSettings.showUI ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span className="ml-2">Show UI Elements</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Camera Info */}
              {cameraPosition && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Camera className="inline w-4 h-4 mr-2" />
                    Camera Position
                  </label>
                  <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 font-mono">
                    <div>X: {cameraPosition.x.toFixed(2)}</div>
                    <div>Y: {cameraPosition.y.toFixed(2)}</div>
                    <div>Z: {cameraPosition.z.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <div className="absolute top-6 left-6 pointer-events-auto">
          <div className="bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants ({participants.length})
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => onParticipantFocus(participant.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      participant.isActive ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {participant.name}
                      </div>
                      <div className="text-gray-400 text-xs capitalize">
                        {participant.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {participant.isSpeaking && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <Volume2 className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onParticipantFocus(participant.id);
                      }}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      title="Focus on participant"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {participants.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No participants in the room</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions - Top Right */}
      <div className="absolute top-6 right-6 pointer-events-auto">
        {!showSettings && (
          <div className="flex flex-col space-y-2">
            {/* Connection Status */}
            <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm">Connected</span>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="text-white text-sm">WebGL: Active</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Indicator - Top Left */}
      <div className="absolute top-6 left-6 pointer-events-auto">
        {!showParticipants && (
          <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-700">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm capitalize">{currentViewMode} Mode</span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <div className="bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-700 text-xs text-gray-400">
          <div className="space-y-1">
            <div><kbd className="bg-gray-700 px-1 rounded">Space</kbd> Toggle Audio</div>
            <div><kbd className="bg-gray-700 px-1 rounded">V</kbd> Toggle Video</div>
            <div><kbd className="bg-gray-700 px-1 rounded">S</kbd> Screen Share</div>
            <div><kbd className="bg-gray-700 px-1 rounded">R</kbd> Reset Camera</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardroomControls;