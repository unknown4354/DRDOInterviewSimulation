import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  Video, 
  Plus, 
  Search, 
  Filter,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  Eye
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface Interview {
  id: string
  title: string
  candidate_name?: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  interview_type: string
  overall_score?: number
}

interface DashboardStats {
  totalInterviews: number
  completedInterviews: number
  upcomingInterviews: number
  averageScore: number
}

const Dashboard: React.FC = () => {
  const { user, userProfile, signOut } = useAuth()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    completedInterviews: 0,
    upcomingInterviews: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        console.log('No user ID available, skipping dashboard data fetch')
        setLoading(false)
        return
      }
      
      // Fetch interviews through interview_participants table based on user role
      let query = supabase
        .from('interviews')
        .select(`
          id,
          title,
          scheduled_time,
          duration_minutes,
          status,
          final_score,
          interview_participants!inner(
            user_id,
            role,
            users(
              full_name
            )
          )
        `)
      
      // Filter based on user participation
      query = query.eq('interview_participants.user_id', user.id)
      
      // Additional filtering based on user role if needed
      if (userProfile?.role === 'selector') {
        query = query.eq('interview_participants.role', 'interviewer')
      } else if (userProfile?.role === 'candidate') {
        query = query.eq('interview_participants.role', 'candidate')
      } else if (userProfile?.role === 'observer') {
        query = query.eq('interview_participants.role', 'observer')
      }
      
      const { data: interviewData, error } = await query.order('scheduled_time', { ascending: false })
      
      if (error) {
        console.error('Error fetching interviews:', error)
        toast.error('Failed to load dashboard data')
        return
      }
      
      const formattedInterviews: Interview[] = (interviewData || []).map(interview => {
        // Get candidate name from participants
        const candidateParticipant = interview.interview_participants?.find(
          (p: any) => p.role === 'candidate'
        )
        
        return {
          id: interview.id,
          title: interview.title,
          scheduled_at: interview.scheduled_time,
          duration_minutes: interview.duration_minutes,
          status: interview.status,
          interview_type: 'Technical', // Default type, can be enhanced later
          overall_score: interview.final_score,
          candidate_name: candidateParticipant?.users?.full_name || 'Unknown Candidate'
        }
      })
      
      setInterviews(formattedInterviews)
      
      // Calculate stats with proper null handling
      const totalInterviews = formattedInterviews.length
      const completedInterviews = formattedInterviews.filter(i => i.status === 'completed').length
      const upcomingInterviews = formattedInterviews.filter(i => 
        i.status === 'scheduled' && new Date(i.scheduled_at) > new Date()
      ).length
      
      const scoresArray = formattedInterviews
        .filter(i => i.overall_score !== null && i.overall_score !== undefined && !isNaN(Number(i.overall_score)))
        .map(i => Number(i.overall_score))
      
      const averageScore = scoresArray.length > 0 
        ? scoresArray.reduce((acc, score) => acc + score, 0) / scoresArray.length
        : 0
      
      setStats({
        totalInterviews,
        completedInterviews,
        upcomingInterviews,
        averageScore: Number(averageScore.toFixed(1))
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in_progress': return <PlayCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || interview.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  }

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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {userProfile?.role ? 
                  userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 
                  'User'
                }
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.profile_picture_url} />
                  <AvatarFallback>
                    {userProfile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.full_name}</p>
                  <p className="text-xs text-gray-500">{userProfile?.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your interviews today.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Interviews</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalInterviews || 0}</div>
              <p className="text-xs text-blue-600 mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.completedInterviews || 0}</div>
              <p className="text-xs text-green-600 mt-1">
                {stats.totalInterviews > 0 ? Math.round((stats.completedInterviews / stats.totalInterviews) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.upcomingInterviews || 0}</div>
              <p className="text-xs text-orange-600 mt-1">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Avg Score</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.averageScore || 0}/10</div>
              <p className="text-xs text-purple-600 mt-1">
                Performance metric
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions and Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search interviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {userProfile?.role !== 'candidate' && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          )}
        </motion.div>

        {/* Interviews List */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Recent Interviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInterviews.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by scheduling your first interview.'
                    }
                  </p>
                  {userProfile?.role !== 'candidate' && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInterviews.map((interview, index) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Video className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{interview.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{interview.candidate_name}</span>
                            <span>•</span>
                            <span>{new Date(interview.scheduled_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{interview.duration_minutes} min</span>
                            <span>•</span>
                            <span className="capitalize">{interview.interview_type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {interview.overall_score && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {interview.overall_score}/10
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                        )}
                        
                        <Badge className={`${getStatusColor(interview.status)} flex items-center space-x-1`}>
                          {getStatusIcon(interview.status)}
                          <span className="capitalize">{interview.status.replace('_', ' ')}</span>
                        </Badge>
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="h-6 w-6" />
                  <span>View Calendar</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Analytics</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Settings className="h-6 w-6" />
                  <span>Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Dashboard