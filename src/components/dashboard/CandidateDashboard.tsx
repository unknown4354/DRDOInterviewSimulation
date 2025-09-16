import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  FileText,
  BarChart3,
  Star,
  MessageSquare,
  Video,
  Play,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Eye,
  Headphones,
  Mic,
  Camera,
  Wifi,
  Monitor,
  Volume2,
  HelpCircle,
  Target,
  Brain,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useInterviews } from '../../hooks/useInterviews';
import { useAI } from '../../hooks/useAI';

interface CandidateStats {
  totalInterviews: number;
  completedInterviews: number;
  upcomingInterviews: number;
  avgScore: number;
  lastInterviewScore?: number;
}

interface InterviewSession {
  id: string;
  title: string;
  position: string;
  company: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  roomId?: string;
  overallScore?: number;
  feedback?: string;
  selectors?: string[];
}

interface SystemCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  icon: React.ReactNode;
}

interface PreparationTip {
  id: string;
  category: 'technical' | 'behavioral' | 'general';
  title: string;
  description: string;
  completed: boolean;
}

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const { interviews, loading: interviewsLoading, fetchInterviews } = useInterviews();
  const { getInterviewInsights, getAnswerEvaluations } = useAI();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'feedback' | 'preparation'>('overview');
  const [stats, setStats] = useState<CandidateStats>({
    totalInterviews: 0,
    completedInterviews: 0,
    upcomingInterviews: 0,
    avgScore: 0
  });
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewSession[]>([]);
  const [recentInterviews, setRecentInterviews] = useState<InterviewSession[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [preparationTips, setPreparationTips] = useState<PreparationTip[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);

  useEffect(() => {
    if (user?.role === 'candidate') {
      loadDashboardData();
      runSystemCheck();
      loadPreparationTips();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await fetchInterviews();
      loadCandidateStats();
      loadUpcomingInterviews();
      loadRecentInterviews();
    } catch (error: any) {
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadCandidateStats = () => {
    if (!interviews) return;
    
    const candidateInterviews = interviews.filter(i => i.candidateId === user?.id);
    const completedInterviews = candidateInterviews.filter(i => i.status === 'completed');
    const upcomingInterviews = candidateInterviews.filter(i => 
      i.status === 'scheduled' && new Date(i.scheduledAt) > new Date()
    );
    
    const avgScore = completedInterviews.length > 0 
      ? completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length
      : 0;
    
    const lastInterview = completedInterviews
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
    
    setStats({
      totalInterviews: candidateInterviews.length,
      completedInterviews: completedInterviews.length,
      upcomingInterviews: upcomingInterviews.length,
      avgScore: Math.round(avgScore * 10) / 10,
      lastInterviewScore: lastInterview?.overallScore
    });
  };

  const loadUpcomingInterviews = () => {
    if (!interviews) return;
    
    const now = new Date();
    const upcoming = interviews
      .filter(i => 
        i.candidateId === user?.id &&
        new Date(i.scheduledAt) > now &&
        i.status === 'scheduled'
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3);
    
    setUpcomingInterviews(upcoming as InterviewSession[]);
  };

  const loadRecentInterviews = () => {
    if (!interviews) return;
    
    const recent = interviews
      .filter(i => 
        i.candidateId === user?.id &&
        i.status === 'completed'
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 3);
    
    setRecentInterviews(recent as InterviewSession[]);
  };

  const runSystemCheck = async () => {
    // Simulate system checks
    const checks: SystemCheck[] = [
      {
        id: 'camera',
        name: 'Camera Access',
        status: 'pass',
        message: 'Camera is working properly',
        icon: <Camera className="w-5 h-5" />
      },
      {
        id: 'microphone',
        name: 'Microphone Access',
        status: 'pass',
        message: 'Microphone is working properly',
        icon: <Mic className="w-5 h-5" />
      },
      {
        id: 'speakers',
        name: 'Audio Output',
        status: 'pass',
        message: 'Speakers/headphones detected',
        icon: <Volume2 className="w-5 h-5" />
      },
      {
        id: 'internet',
        name: 'Internet Connection',
        status: 'pass',
        message: 'Connection speed: 45 Mbps',
        icon: <Wifi className="w-5 h-5" />
      },
      {
        id: 'browser',
        name: 'Browser Compatibility',
        status: 'warning',
        message: 'Consider updating to latest version',
        icon: <Monitor className="w-5 h-5" />
      }
    ];
    
    setSystemChecks(checks);
  };

  const loadPreparationTips = () => {
    const tips: PreparationTip[] = [
      {
        id: '1',
        category: 'technical',
        title: 'Review Technical Concepts',
        description: 'Brush up on core technical skills relevant to the position',
        completed: false
      },
      {
        id: '2',
        category: 'behavioral',
        title: 'Prepare STAR Examples',
        description: 'Prepare Situation, Task, Action, Result examples for behavioral questions',
        completed: true
      },
      {
        id: '3',
        category: 'general',
        title: 'Research the Organization',
        description: 'Learn about company culture, values, and recent developments',
        completed: false
      },
      {
        id: '4',
        category: 'technical',
        title: 'Practice Coding Problems',
        description: 'Solve coding challenges similar to what might be asked',
        completed: false
      },
      {
        id: '5',
        category: 'general',
        title: 'Prepare Questions to Ask',
        description: 'Have thoughtful questions ready about the role and team',
        completed: true
      }
    ];
    
    setPreparationTips(tips);
  };

  const handleJoinInterview = (interviewId: string) => {
    // Navigate to interview room
    window.location.href = `/interview/${interviewId}`;
  };

  const toggleTipCompletion = (tipId: string) => {
    setPreparationTips(prev => prev.map(tip => 
      tip.id === tipId ? { ...tip, completed: !tip.completed } : tip
    ));
  };

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
              {trend} from last interview
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const InterviewCard: React.FC<{ interview: InterviewSession; showJoinButton?: boolean }> = ({ 
    interview, 
    showJoinButton = false 
  }) => {
    const isUpcoming = new Date(interview.scheduledAt) > new Date();
    const timeUntil = isUpcoming 
      ? Math.ceil((new Date(interview.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{interview.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{interview.position}</p>
            <p className="text-sm text-gray-500">{interview.company}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(interview.scheduledAt).toLocaleString()}</span>
              </div>
              {timeUntil !== null && timeUntil <= 7 && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>In {timeUntil} day{timeUntil !== 1 ? 's' : ''}</span>
                </div>
              )}
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
        
        {showJoinButton && interview.status === 'scheduled' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {timeUntil !== null && timeUntil <= 1 && (
                  <span className="text-green-600 font-medium">Ready to join</span>
                )}
              </div>
              <button
                onClick={() => handleJoinInterview(interview.id)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Video className="w-4 h-4" />
                <span>Join Interview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SystemCheckItem: React.FC<{ check: SystemCheck }> = ({ check }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          check.status === 'pass' ? 'bg-green-100 text-green-600' :
          check.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
          'bg-red-100 text-red-600'
        }`}>
          {check.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{check.name}</p>
          <p className="text-sm text-gray-600">{check.message}</p>
        </div>
      </div>
      <div className={`w-3 h-3 rounded-full ${
        check.status === 'pass' ? 'bg-green-500' :
        check.status === 'warning' ? 'bg-yellow-500' :
        'bg-red-500'
      }`}></div>
    </div>
  );

  if (user?.role !== 'candidate') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the candidate dashboard.</p>
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
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSystemCheck(!showSystemCheck)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                <span>System Check</span>
              </button>
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
                {stats.upcomingInterviews > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Check Modal */}
      {showSystemCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Check</h3>
                <button
                  onClick={() => setShowSystemCheck(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3">
                {systemChecks.map(check => (
                  <SystemCheckItem key={check.id} check={check} />
                ))}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSystemCheck(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={runSystemCheck}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Run Check Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'interviews', label: 'My Interviews', icon: Calendar },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare },
              { id: 'preparation', label: 'Preparation', icon: BookOpen }
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
                title="Total Interviews"
                value={stats.totalInterviews}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Upcoming"
                value={stats.upcomingInterviews}
                icon={<Clock className="w-6 h-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Completed"
                value={stats.completedInterviews}
                icon={<CheckCircle className="w-6 h-6 text-white" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Average Score"
                value={stats.avgScore || 'N/A'}
                icon={<Star className="w-6 h-6 text-white" />}
                trend={stats.lastInterviewScore ? `Last: ${stats.lastInterviewScore}/10` : undefined}
                color="bg-yellow-500"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  onClick={() => setShowSystemCheck(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">System Check</h4>
                      <p className="text-sm text-gray-600">Test your setup before interviews</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setActiveTab('preparation')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-500">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Interview Prep</h4>
                      <p className="text-sm text-gray-600">Preparation tips and resources</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setActiveTab('feedback')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">View Feedback</h4>
                      <p className="text-sm text-gray-600">Review your interview performance</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Upcoming and Recent Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Interviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
                <div className="space-y-4">
                  {upcomingInterviews.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming interviews scheduled</p>
                    </div>
                  ) : (
                    upcomingInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} showJoinButton={true} />
                    ))
                  )}
                </div>
              </div>

              {/* Recent Interviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Interviews</h3>
                <div className="space-y-4">
                  {recentInterviews.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No completed interviews yet</p>
                    </div>
                  ) : (
                    recentInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Interviews</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {interviewsLoading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading interviews...</p>
                </div>
              ) : [...upcomingInterviews, ...recentInterviews].length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                  <p className="text-gray-600">Your scheduled interviews will appear here.</p>
                </div>
              ) : (
                [...upcomingInterviews, ...recentInterviews].map(interview => (
                  <InterviewCard key={interview.id} interview={interview} showJoinButton={true} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Interview Feedback</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Center</h3>
              <p className="text-gray-600 mb-4">Detailed feedback and performance insights from your interviews.</p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                View Detailed Feedback
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preparation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Interview Preparation</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Preparation Tips */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Checklist</h3>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="space-y-4">
                    {preparationTips.map(tip => (
                      <div key={tip.id} className="flex items-start space-x-3">
                        <button
                          onClick={() => toggleTipCompletion(tip.id)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            tip.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {tip.completed && <CheckCircle className="w-3 h-3" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium ${
                              tip.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {tip.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              tip.category === 'technical' ? 'bg-blue-100 text-blue-800' :
                              tip.category === 'behavioral' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tip.category}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${
                            tip.completed ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Brain className="w-6 h-6 text-blue-500" />
                      <h4 className="font-medium text-gray-900">AI Practice</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Practice with AI-powered mock interviews
                    </p>
                    <button className="w-full px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                      Start Practice
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Target className="w-6 h-6 text-green-500" />
                      <h4 className="font-medium text-gray-900">Interview Tips</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Expert tips for interview success
                    </p>
                    <button className="w-full px-3 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50">
                      Read Tips
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <HelpCircle className="w-6 h-6 text-purple-500" />
                      <h4 className="font-medium text-gray-900">FAQ</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Common questions and answers
                    </p>
                    <button className="w-full px-3 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50">
                      View FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};