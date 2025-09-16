import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  BarChart3,
  Star,
  MessageSquare,
  Video,
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Settings,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useInterviews } from '../../hooks/useInterviews';
import { useAI } from '../../hooks/useAI';

interface SelectorStats {
  totalInterviews: number;
  todayInterviews: number;
  completedInterviews: number;
  avgRating: number;
  pendingEvaluations: number;
}

interface InterviewSession {
  id: string;
  title: string;
  candidateName: string;
  position: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  roomId?: string;
  evaluationStatus: 'pending' | 'in_progress' | 'completed';
  overallScore?: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

export const SelectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { interviews, loading: interviewsLoading, fetchInterviews, updateInterview } = useInterviews();
  const { getInterviewInsights, evaluateAnswer, generateQuestions } = useAI();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'evaluations' | 'analytics'>('overview');
  const [stats, setStats] = useState<SelectorStats>({
    totalInterviews: 0,
    todayInterviews: 0,
    completedInterviews: 0,
    avgRating: 0,
    pendingEvaluations: 0
  });
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewSession[]>([]);
  const [recentInterviews, setRecentInterviews] = useState<InterviewSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'selector') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      await fetchInterviews();
      loadSelectorStats();
      loadUpcomingInterviews();
      loadRecentInterviews();
    } catch (error: any) {
      toast.error(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSelectorStats = () => {
    if (!interviews) return;
    
    const selectorInterviews = interviews.filter(i => 
      i.selectors?.includes(user?.id || '') || i.createdBy === user?.id
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayInterviews = selectorInterviews.filter(i => {
      const interviewDate = new Date(i.scheduledAt);
      return interviewDate >= today && interviewDate < tomorrow;
    });
    
    const completedInterviews = selectorInterviews.filter(i => i.status === 'completed');
    const pendingEvaluations = selectorInterviews.filter(i => 
      i.status === 'completed' && i.evaluationStatus === 'pending'
    );
    
    const avgRating = completedInterviews.length > 0 
      ? completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length
      : 0;
    
    setStats({
      totalInterviews: selectorInterviews.length,
      todayInterviews: todayInterviews.length,
      completedInterviews: completedInterviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      pendingEvaluations: pendingEvaluations.length
    });
  };

  const loadUpcomingInterviews = () => {
    if (!interviews) return;
    
    const now = new Date();
    const upcoming = interviews
      .filter(i => 
        (i.selectors?.includes(user?.id || '') || i.createdBy === user?.id) &&
        new Date(i.scheduledAt) > now &&
        i.status === 'scheduled'
      )
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
    
    setUpcomingInterviews(upcoming as InterviewSession[]);
  };

  const loadRecentInterviews = () => {
    if (!interviews) return;
    
    const recent = interviews
      .filter(i => 
        (i.selectors?.includes(user?.id || '') || i.createdBy === user?.id) &&
        (i.status === 'completed' || i.status === 'active')
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5);
    
    setRecentInterviews(recent as InterviewSession[]);
  };

  const handleStartInterview = async (interviewId: string) => {
    try {
      await updateInterview(interviewId, { status: 'active' });
      toast.success('Interview started successfully');
      // Navigate to interview room
      window.location.href = `/interview/${interviewId}`;
    } catch (error: any) {
      toast.error(`Failed to start interview: ${error.message}`);
    }
  };

  const handleCompleteInterview = async (interviewId: string) => {
    try {
      await updateInterview(interviewId, { 
        status: 'completed',
        evaluationStatus: 'pending'
      });
      toast.success('Interview completed successfully');
      await loadDashboardData();
    } catch (error: any) {
      toast.error(`Failed to complete interview: ${error.message}`);
    }
  };

  const handleGenerateQuestions = async (interviewId: string) => {
    try {
      const interview = interviews?.find(i => i.id === interviewId);
      if (!interview) return;
      
      const questions = await generateQuestions(
        interviewId,
        { position: interview.position },
        undefined,
        'intermediate',
        5
      );
      
      toast.success(`Generated ${questions.questions.length} questions`);
      // Navigate to question management
    } catch (error: any) {
      toast.error(`Failed to generate questions: ${error.message}`);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'schedule',
      title: 'Schedule Interview',
      description: 'Create a new interview session',
      icon: <Calendar className="w-6 h-6" />,
      action: () => {
        // Navigate to interview scheduling
        toast.info('Opening interview scheduler...');
      },
      color: 'bg-blue-500'
    },
    {
      id: 'questions',
      title: 'Question Bank',
      description: 'Manage interview questions',
      icon: <BookOpen className="w-6 h-6" />,
      action: () => {
        // Navigate to question bank
        toast.info('Opening question bank...');
      },
      color: 'bg-green-500'
    },
    {
      id: 'evaluations',
      title: 'Pending Evaluations',
      description: `${stats.pendingEvaluations} evaluations pending`,
      icon: <FileText className="w-6 h-6" />,
      action: () => {
        setActiveTab('evaluations');
      },
      color: 'bg-orange-500'
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      description: 'View interview insights',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => {
        setActiveTab('analytics');
      },
      color: 'bg-purple-500'
    }
  ];

  const filteredInterviews = interviews?.filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (interview.candidateName && interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || interview.status === filterStatus;
    const isSelector = interview.selectors?.includes(user?.id || '') || interview.createdBy === user?.id;
    return matchesSearch && matchesStatus && isSelector;
  }) || [];

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
              {trend} from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const InterviewCard: React.FC<{ interview: InterviewSession; showActions?: boolean }> = ({ 
    interview, 
    showActions = true 
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{interview.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{interview.position}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(interview.scheduledAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{interview.candidateName || 'TBD'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            interview.status === 'active' ? 'bg-green-100 text-green-800' :
            interview.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            interview.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {interview.status}
          </span>
        </div>
      </div>
      
      {showActions && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {interview.status === 'scheduled' && (
              <button
                onClick={() => handleStartInterview(interview.id)}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}
            {interview.status === 'active' && (
              <button
                onClick={() => handleCompleteInterview(interview.id)}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                <span>End</span>
              </button>
            )}
            <button
              onClick={() => handleGenerateQuestions(interview.id)}
              className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <BookOpen className="w-4 h-4" />
              <span>Questions</span>
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (user?.role !== 'selector') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the selector dashboard.</p>
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
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Selector Dashboard</h1>
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
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>New Interview</span>
              </button>
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
              { id: 'interviews', label: 'Interviews', icon: Calendar },
              { id: 'evaluations', label: 'Evaluations', icon: FileText },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard
                title="Total Interviews"
                value={stats.totalInterviews}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Today's Interviews"
                value={stats.todayInterviews}
                icon={<Clock className="w-6 h-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Completed"
                value={stats.completedInterviews}
                icon={<CheckCircle className="w-6 h-6 text-white" />}
                trend="+15%"
                color="bg-purple-500"
              />
              <StatCard
                title="Avg Rating"
                value={stats.avgRating}
                icon={<Star className="w-6 h-6 text-white" />}
                trend="+0.3"
                color="bg-yellow-500"
              />
              <StatCard
                title="Pending Evaluations"
                value={stats.pendingEvaluations}
                icon={<AlertCircle className="w-6 h-6 text-white" />}
                color="bg-red-500"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map(action => (
                  <motion.button
                    key={action.id}
                    onClick={action.action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <div className="text-white">{action.icon}</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
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
                      <InterviewCard key={interview.id} interview={interview} />
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
                      <p className="text-gray-600">No recent interviews</p>
                    </div>
                  ) : (
                    recentInterviews.map(interview => (
                      <InterviewCard key={interview.id} interview={interview} showActions={false} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-6">
            {/* Interviews Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Interview Management</h2>
              <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span>Schedule Interview</span>
              </button>
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
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interviews Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {interviewsLoading ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading interviews...</p>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                  <p className="text-gray-600 mb-4">Get started by scheduling your first interview.</p>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Schedule Interview
                  </button>
                </div>
              ) : (
                filteredInterviews.map(interview => (
                  <InterviewCard key={interview.id} interview={interview as InterviewSession} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Evaluation Center</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Evaluation Dashboard</h3>
              <p className="text-gray-600 mb-4">Review and evaluate completed interviews with AI assistance.</p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Start Evaluating
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-4">Comprehensive analytics and insights for your interviews.</p>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                View Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};