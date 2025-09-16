import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Calendar,
  Clock,
  Users,
  BarChart3,
  FileText,
  Video,
  MessageSquare,
  Star,
  TrendingUp,
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  BookOpen,
  Award,
  Target,
  Zap,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useInterviews } from '../../hooks/useInterviews';
import { useAI } from '../../hooks/useAI';

interface ObserverStats {
  totalObservedInterviews: number;
  activeInterviews: number;
  completedToday: number;
  avgInterviewRating: number;
}

interface InterviewSession {
  id: string;
  title: string;
  candidateName: string;
  position: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  selectors: string[];
  overallScore?: number;
  observerNotes?: string;
  isLive?: boolean;
}

interface LiveSession {
  id: string;
  interviewId: string;
  title: string;
  candidateName: string;
  startTime: Date;
  currentPhase: 'introduction' | 'technical' | 'behavioral' | 'conclusion';
  participantCount: number;
  isRecording: boolean;
}

interface ObservationNote {
  id: string;
  interviewId: string;
  timestamp: Date;
  content: string;
  category: 'technical' | 'behavioral' | 'communication' | 'general';
  isPrivate: boolean;
}

export const ObserverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { interviews, loading: interviewsLoading, fetchInterviews } = useInterviews();
  const { getInterviewInsights, getEmotionAnalysis } = useAI();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'live' | 'scheduled' | 'completed' | 'analytics'>('overview');
  const [stats, setStats] = useState<ObserverStats>({
    totalObservedInterviews: 0,
    activeInterviews: 0,
    completedToday: 0,
    avgInterviewRating: 0
  });
  const [liveInterviews, setLiveInterviews] = useState<LiveSession[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<InterviewSession[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<InterviewSession[]>([]);
  const [observationNotes, setObservationNotes] = useState<ObservationNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'observer') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await fetchInterviews();
      loadObserverStats();
      loadLiveInterviews();
      loadScheduledInterviews();
      loadCompletedInterviews();
      loadObservationNotes();
    } catch (error: any) {
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadObserverStats = () => {
    if (!interviews) return;
    
    const observedInterviews = interviews.filter(i => 
      i.observers?.includes(user?.id || '')
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const activeInterviews = observedInterviews.filter(i => i.status === 'active');
    const completedToday = observedInterviews.filter(i => {
      const completedDate = new Date(i.updatedAt || i.scheduledAt);
      return i.status === 'completed' && completedDate >= today && completedDate < tomorrow;
    });
    
    const completedWithScores = observedInterviews.filter(i => 
      i.status === 'completed' && i.overallScore
    );
    const avgRating = completedWithScores.length > 0 
      ? completedWithScores.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedWithScores.length
      : 0;
    
    setStats({
      totalObservedInterviews: observedInterviews.length,
      activeInterviews: activeInterviews.length,
      completedToday: completedToday.length,
      avgInterviewRating: Math.round(avgRating * 10) / 10
    });
  };

  const loadLiveInterviews = () => {
    // Mock live interviews data - replace with actual WebSocket connection
    const mockLiveInterviews: LiveSession[] = [
      {
        id: 'live_1',
        interviewId: 'int_123',
        title: 'Senior Software Engineer Interview',
        candidateName: 'John Doe',
        startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
        currentPhase: 'technical',
        participantCount: 4,
        isRecording: true
      },
      {
        id: 'live_2',
        interviewId: 'int_456',
        title: 'Data Scientist Position',
        candidateName: 'Jane Smith',
        startTime: new Date(Date.now() - 15 * 60 * 1000), // Started 15 minutes ago
        currentPhase: 'behavioral',
        participantCount: 3,
        isRecording: true
      }
    ];
    
    setLiveInterviews(mockLiveInterviews);
  };

  const loadScheduledInterviews = () => {
    if (!interviews) return;
    
    const now = new Date();
    const scheduled = interviews
      .filter(i => 
        i.observers?.includes(user?.id || '') &&
        new Date(i.scheduledAt) > now &&
        i.status === 'scheduled'
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 10);
    
    setScheduledInterviews(scheduled as InterviewSession[]);
  };

  const loadCompletedInterviews = () => {
    if (!interviews) return;
    
    const completed = interviews
      .filter(i => 
        i.observers?.includes(user?.id || '') &&
        i.status === 'completed'
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 10);
    
    setCompletedInterviews(completed as InterviewSession[]);
  };

  const loadObservationNotes = () => {
    // Mock observation notes - replace with actual API call
    const mockNotes: ObservationNote[] = [
      {
        id: 'note_1',
        interviewId: 'int_123',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        content: 'Candidate shows strong technical knowledge in React and Node.js',
        category: 'technical',
        isPrivate: false
      },
      {
        id: 'note_2',
        interviewId: 'int_123',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        content: 'Good communication skills, explains concepts clearly',
        category: 'communication',
        isPrivate: false
      }
    ];
    
    setObservationNotes(mockNotes);
  };

  const handleJoinLiveInterview = (interviewId: string) => {
    // Navigate to live interview observation
    window.location.href = `/interview/${interviewId}?mode=observer`;
  };

  const handleViewRecording = (interviewId: string) => {
    // Navigate to interview recording
    window.location.href = `/interview/${interviewId}/recording`;
  };

  const addObservationNote = (interviewId: string, content: string, category: string) => {
    const newNote: ObservationNote = {
      id: `note_${Date.now()}`,
      interviewId,
      timestamp: new Date(),
      content,
      category: category as any,
      isPrivate: false
    };
    
    setObservationNotes(prev => [newNote, ...prev]);
    toast.success('Observation note added');
  };

  const filteredInterviews = [...scheduledInterviews, ...completedInterviews].filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || interview.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend} from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const LiveInterviewCard: React.FC<{ session: LiveSession }> = ({ session }) => {
    const duration = Math.floor((new Date().getTime() - session.startTime.getTime()) / (1000 * 60));
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-600">LIVE</span>
            </div>
            <h4 className="font-medium text-gray-900">{session.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{session.candidateName}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{session.participantCount} participants</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span className="capitalize">{session.currentPhase}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {session.isRecording && (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium">REC</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              session.currentPhase === 'introduction' ? 'bg-blue-100 text-blue-800' :
              session.currentPhase === 'technical' ? 'bg-purple-100 text-purple-800' :
              session.currentPhase === 'behavioral' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {session.currentPhase}
            </span>
          </div>
          <button
            onClick={() => handleJoinLiveInterview(session.interviewId)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <Eye className="w-4 h-4" />
            <span>Observe</span>
          </button>
        </div>
      </div>
    );
  };

  const InterviewCard: React.FC<{ interview: InterviewSession }> = ({ interview }) => {
    const isUpcoming = interview.status === 'scheduled';
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{interview.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{interview.position}</p>
            <p className="text-sm text-gray-500">{interview.candidateName}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(interview.scheduledAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{interview.selectors?.length || 0} selectors</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              interview.status === 'active' ? 'bg-green-100 text-green-800' :
              interview.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              interview.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {interview.status}
            </span>
            {interview.overallScore && (
              <div className="flex items-center space-x-1 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{interview.overallScore}/10</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {isUpcoming ? 'Scheduled' : 'Completed'}
          </div>
          <div className="flex items-center space-x-2">
            {interview.status === 'completed' && (
              <button
                onClick={() => handleViewRecording(interview.id)}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Video className="w-4 h-4" />
                <span>Recording</span>
              </button>
            )}
            <button className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
              <Eye className="w-4 h-4" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (user?.role !== 'observer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the observer dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Eye className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Observer Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {stats.activeInterviews > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'live', label: 'Live Interviews', icon: Video },
              { id: 'scheduled', label: 'Scheduled', icon: Calendar },
              { id: 'completed', label: 'Completed', icon: CheckCircle },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'live' && stats.activeInterviews > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {stats.activeInterviews}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Observed"
                value={stats.totalObservedInterviews}
                icon={<Eye className="w-6 h-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Live Now"
                value={stats.activeInterviews}
                icon={<Activity className="w-6 h-6 text-white" />}
                color="bg-red-500"
              />
              <StatCard
                title="Completed Today"
                value={stats.completedToday}
                icon={<CheckCircle className="w-6 h-6 text-white" />}
                trend="+2"
                color="bg-green-500"
              />
              <StatCard
                title="Avg Rating"
                value={stats.avgInterviewRating || 'N/A'}
                icon={<Star className="w-6 h-6 text-white" />}
                trend="+0.2"
                color="bg-yellow-500"
              />
            </div>

            {/* Live Interviews */}
            {liveInterviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Live Interviews</span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveInterviews.map(session => (
                    <LiveInterviewCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming and Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Interviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
                <div className="space-y-4">
                  {scheduledInterviews.slice(0, 3).length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming interviews to observe</p>
                    </div>
                  ) : (
                    scheduledInterviews.slice(0, 3).map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))
                  )}
                </div>
              </div>

              {/* Recent Completed */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Completed</h3>
                <div className="space-y-4">
                  {completedInterviews.slice(0, 3).length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No completed interviews yet</p>
                    </div>
                  ) : (
                    completedInterviews.slice(0, 3).map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Live Interviews</span>
              </h2>
              <div className="text-sm text-gray-600">
                {stats.activeInterviews} active session{stats.activeInterviews !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveInterviews.length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Interviews</h3>
                  <p className="text-gray-600">There are currently no active interviews to observe.</p>
                </div>
              ) : (
                liveInterviews.map(session => (
                  <LiveInterviewCard key={session.id} session={session} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Scheduled Interviews</h2>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search interviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scheduledInterviews.length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Interviews</h3>
                  <p className="text-gray-600">No upcoming interviews are scheduled for observation.</p>
                </div>
              ) : (
                scheduledInterviews.map(interview => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Completed Interviews</h2>
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedInterviews.length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Interviews</h3>
                  <p className="text-gray-600">Completed interviews will appear here for review.</p>
                </div>
              ) : (
                completedInterviews.map(interview => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Observation Analytics</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-4">Comprehensive analytics and insights from observed interviews.</p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                View Detailed Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};