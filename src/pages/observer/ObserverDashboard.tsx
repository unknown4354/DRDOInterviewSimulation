/**
 * Observer Dashboard - Read-only monitoring interface for observers
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Monitor, 
  BarChart3, 
  Clock, 
  Users, 
  Video, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import { toast } from 'sonner'

interface LiveInterview {
  id: string
  title: string
  candidate_name: string
  interviewer_name: string
  position: string
  start_time: Date
  duration_minutes: number
  elapsed_minutes: number
  status: 'starting' | 'in_progress' | 'break' | 'ending'
  participants_count: number
  quality_score: number
  engagement_level: 'low' | 'medium' | 'high'
  current_phase: 'introduction' | 'technical' | 'behavioral' | 'questions' | 'conclusion'
  ai_insights: {
    candidate_confidence: number
    question_quality: number
    bias_detected: boolean
    communication_score: number
  }
}

interface ObserverStats {
  total_interviews_today: number
  active_interviews: number
  completed_interviews: number
  average_quality_score: number
  total_observers: number
  alerts_count: number
}

interface QualityAlert {
  id: string
  interview_id: string
  interview_title: string
  type: 'bias_detected' | 'poor_audio' | 'connection_issue' | 'inappropriate_question' | 'low_engagement'
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: Date
  resolved: boolean
}

const ObserverDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [liveInterviews, setLiveInterviews] = useState<LiveInterview[]>([])
  const [stats, setStats] = useState<ObserverStats>({
    total_interviews_today: 0,
    active_interviews: 0,
    completed_interviews: 0,
    average_quality_score: 0,
    total_observers: 0,
    alerts_count: 0
  })
  const [qualityAlerts, setQualityAlerts] = useState<QualityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInterview, setSelectedInterview] = useState<LiveInterview | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchObserverData()
    
    // Set up auto-refresh for live data
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchObserverData, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchObserverData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      
      // Mock live interviews data
      const mockLiveInterviews: LiveInterview[] = [
        {
          id: '1',
          title: 'Software Engineer - Frontend',
          candidate_name: 'John Doe',
          interviewer_name: 'Sarah Wilson',
          position: 'Software Engineer',
          start_time: new Date(Date.now() - 1000 * 60 * 25), // Started 25 minutes ago
          duration_minutes: 60,
          elapsed_minutes: 25,
          status: 'in_progress',
          participants_count: 3,
          quality_score: 8.5,
          engagement_level: 'high',
          current_phase: 'technical',
          ai_insights: {
            candidate_confidence: 0.82,
            question_quality: 0.91,
            bias_detected: false,
            communication_score: 0.88
          }
        },
        {
          id: '2',
          title: 'Data Scientist - ML Engineer',
          candidate_name: 'Jane Smith',
          interviewer_name: 'Mike Johnson',
          position: 'Data Scientist',
          start_time: new Date(Date.now() - 1000 * 60 * 10), // Started 10 minutes ago
          duration_minutes: 90,
          elapsed_minutes: 10,
          status: 'in_progress',
          participants_count: 4,
          quality_score: 7.2,
          engagement_level: 'medium',
          current_phase: 'introduction',
          ai_insights: {
            candidate_confidence: 0.65,
            question_quality: 0.78,
            bias_detected: true,
            communication_score: 0.72
          }
        }
      ]
      
      // Mock stats
      const mockStats: ObserverStats = {
        total_interviews_today: 12,
        active_interviews: mockLiveInterviews.length,
        completed_interviews: 8,
        average_quality_score: 8.1,
        total_observers: 5,
        alerts_count: 3
      }
      
      // Mock quality alerts
      const mockAlerts: QualityAlert[] = [
        {
          id: '1',
          interview_id: '2',
          interview_title: 'Data Scientist - ML Engineer',
          type: 'bias_detected',
          severity: 'high',
          message: 'Potential bias detected in interviewer questions',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          resolved: false
        },
        {
          id: '2',
          interview_id: '1',
          interview_title: 'Software Engineer - Frontend',
          type: 'poor_audio',
          severity: 'medium',
          message: 'Audio quality degraded for candidate',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          resolved: true
        }
      ]
      
      setLiveInterviews(mockLiveInterviews)
      setStats(mockStats)
      setQualityAlerts(mockAlerts)
    } catch (error) {
      console.error('Error fetching observer data:', error)
      toast.error('Failed to load observer data')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinObservation = (interviewId: string) => {
    // TODO: Implement join observation functionality
    console.log('Joining observation for interview:', interviewId)
    toast.success('Joining interview observation...')
    // Redirect to observation room
    window.location.href = `/interview-room/${interviewId}?mode=observer`
  }

  const handleResolveAlert = (alertId: string) => {
    setQualityAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    )
    toast.success('Alert marked as resolved')
  }

  const getStatusColor = (status: LiveInterview['status']) => {
    switch (status) {
      case 'starting': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'break': return 'bg-blue-100 text-blue-800'
      case 'ending': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEngagementColor = (level: LiveInterview['engagement_level']) => {
    switch (level) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getAlertColor = (severity: QualityAlert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPhaseProgress = (interview: LiveInterview) => {
    const phases = ['introduction', 'technical', 'behavioral', 'questions', 'conclusion']
    const currentIndex = phases.indexOf(interview.current_phase)
    return ((currentIndex + 1) / phases.length) * 100
  }

  const filteredInterviews = liveInterviews.filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.interviewer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || interview.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Eye className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Observer Dashboard</h1>
                <p className="text-sm text-gray-500">Monitor live interviews and quality metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {userProfile?.full_name}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-500">
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchObserverData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Today's Total</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total_interviews_today}</div>
              <p className="text-xs text-blue-600 mt-1">Interviews</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Now</CardTitle>
              <Video className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.active_interviews}</div>
              <p className="text-xs text-green-600 mt-1">Live interviews</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completed_interviews}</div>
              <p className="text-xs text-gray-600 mt-1">Today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Avg Quality</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.average_quality_score}/10</div>
              <p className="text-xs text-purple-600 mt-1">Score</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Observers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.total_observers}</div>
              <p className="text-xs text-orange-600 mt-1">Online</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.alerts_count}</div>
              <p className="text-xs text-red-600 mt-1">Active</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Interviews */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Live Interviews</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search interviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="starting">Starting</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="ending">Ending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInterviews.map((interview) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{interview.title}</h4>
                          <p className="text-sm text-gray-600">{interview.position}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{interview.candidate_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{interview.elapsed_minutes}/{interview.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{interview.participants_count} participants</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(interview.status)}>
                            {interview.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              Quality: {interview.quality_score}/10
                            </div>
                            <div className={`text-xs ${getEngagementColor(interview.engagement_level)}`}>
                              {interview.engagement_level.toUpperCase()} engagement
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Phase: {interview.current_phase}</span>
                          <span>{Math.round(getPhaseProgress(interview))}% complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${getPhaseProgress(interview)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* AI Insights */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Confidence</div>
                          <div className="text-sm font-medium">
                            {Math.round(interview.ai_insights.candidate_confidence * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Question Quality</div>
                          <div className="text-sm font-medium">
                            {Math.round(interview.ai_insights.question_quality * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Communication</div>
                          <div className="text-sm font-medium">
                            {Math.round(interview.ai_insights.communication_score * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Bias Status</div>
                          <div className={`text-sm font-medium ${
                            interview.ai_insights.bias_detected ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {interview.ai_insights.bias_detected ? 'Detected' : 'Clear'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {interview.ai_insights.bias_detected && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Bias Alert
                            </Badge>
                          )}
                        </div>
                        <PermissionGate permissions={[Permission.INTERVIEW_OBSERVE]}>
                          <Button 
                            size="sm" 
                            onClick={() => handleJoinObservation(interview.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Observe
                          </Button>
                        </PermissionGate>
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredInterviews.length === 0 && (
                    <div className="text-center py-8">
                      <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No live interviews</h3>
                      <p className="text-gray-500">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'No interviews match your search criteria.'
                          : 'No interviews are currently in progress.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Alerts */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Quality Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qualityAlerts.filter(alert => !alert.resolved).map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border rounded-lg p-3 ${getAlertColor(alert.severity)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{alert.interview_title}</p>
                      <p className="text-xs text-gray-600 mb-3">{alert.message}</p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7"
                          onClick={() => handleJoinObservation(alert.interview_id)}
                        >
                          View
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {qualityAlerts.filter(alert => !alert.resolved).length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No active alerts</p>
                    </div>
                  )}
                </div>
                
                {qualityAlerts.filter(alert => alert.resolved).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Resolved Alerts</h4>
                    <div className="space-y-2">
                      {qualityAlerts.filter(alert => alert.resolved).slice(0, 3).map((alert) => (
                        <div key={alert.id} className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{alert.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{alert.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ObserverDashboard