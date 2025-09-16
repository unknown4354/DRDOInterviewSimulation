/**
 * Interview Management - Selector interface for managing interviews
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreHorizontal,
  Video,
  FileText,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  MapPin,
  User
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import { toast } from 'sonner'

interface Interview {
  id: string
  title: string
  description: string
  position: string
  candidate_id: string
  candidate_name: string
  candidate_email: string
  interviewer_id: string
  interviewer_name: string
  scheduled_time: Date
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  interview_type: 'technical' | 'behavioral' | 'panel' | 'screening'
  location: 'virtual' | 'in_person'
  room_url?: string
  notes?: string
  evaluation_criteria: string[]
  overall_score?: number
  feedback?: string
  created_at: Date
  updated_at: Date
}

interface InterviewFilters {
  status?: Interview['status']
  interview_type?: Interview['interview_type']
  location?: Interview['location']
  date_range?: 'today' | 'week' | 'month' | 'all'
  search: string
}

interface InterviewStats {
  total: number
  scheduled: number
  completed: number
  in_progress: number
  cancelled: number
  average_score: number
}

const InterviewManagement: React.FC = () => {
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<InterviewStats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    in_progress: 0,
    cancelled: 0,
    average_score: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<InterviewFilters>({ search: '' })
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    fetchInterviews()
  }, [])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [interviews, filters])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      
      // Mock data for demonstration
      const mockInterviews: Interview[] = [
        {
          id: '1',
          title: 'Software Engineer - Frontend',
          description: 'Technical interview for React/TypeScript position',
          position: 'Software Engineer',
          candidate_id: 'candidate-1',
          candidate_name: 'John Doe',
          candidate_email: 'john.doe@example.com',
          interviewer_id: userProfile?.id || 'interviewer-1',
          interviewer_name: userProfile?.full_name || 'Current User',
          scheduled_time: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
          duration_minutes: 60,
          status: 'scheduled',
          interview_type: 'technical',
          location: 'virtual',
          room_url: 'https://meet.drdo.gov.in/room/abc123',
          evaluation_criteria: ['Technical Skills', 'Problem Solving', 'Communication'],
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01')
        },
        {
          id: '2',
          title: 'Data Scientist - ML Engineer',
          description: 'Panel interview for machine learning position',
          position: 'Data Scientist',
          candidate_id: 'candidate-2',
          candidate_name: 'Jane Smith',
          candidate_email: 'jane.smith@example.com',
          interviewer_id: userProfile?.id || 'interviewer-1',
          interviewer_name: userProfile?.full_name || 'Current User',
          scheduled_time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          duration_minutes: 90,
          status: 'completed',
          interview_type: 'panel',
          location: 'virtual',
          overall_score: 8.5,
          feedback: 'Strong technical background with excellent problem-solving skills.',
          evaluation_criteria: ['ML Knowledge', 'Statistics', 'Programming', 'Communication'],
          created_at: new Date('2024-01-28'),
          updated_at: new Date('2024-01-28')
        },
        {
          id: '3',
          title: 'Cybersecurity Analyst',
          description: 'Security clearance interview',
          position: 'Cybersecurity Analyst',
          candidate_id: 'candidate-3',
          candidate_name: 'Mike Johnson',
          candidate_email: 'mike.johnson@example.com',
          interviewer_id: userProfile?.id || 'interviewer-1',
          interviewer_name: userProfile?.full_name || 'Current User',
          scheduled_time: new Date(Date.now() + 1000 * 60 * 30), // In 30 minutes
          duration_minutes: 45,
          status: 'in_progress',
          interview_type: 'behavioral',
          location: 'in_person',
          notes: 'Candidate has relevant security certifications',
          evaluation_criteria: ['Security Knowledge', 'Risk Assessment', 'Communication'],
          created_at: new Date('2024-02-10'),
          updated_at: new Date('2024-02-15')
        }
      ]
      
      setInterviews(mockInterviews)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...interviews]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(interview => 
        interview.title.toLowerCase().includes(searchLower) ||
        interview.candidate_name.toLowerCase().includes(searchLower) ||
        interview.position.toLowerCase().includes(searchLower) ||
        interview.description.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      filtered = filtered.filter(interview => interview.status === filters.status)
    }

    if (filters.interview_type) {
      filtered = filtered.filter(interview => interview.interview_type === filters.interview_type)
    }

    if (filters.location) {
      filtered = filtered.filter(interview => interview.location === filters.location)
    }

    if (filters.date_range && filters.date_range !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      let dateFilter: (interview: Interview) => boolean
      
      switch (filters.date_range) {
        case 'today':
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          dateFilter = (interview) => 
            interview.scheduled_time >= startOfDay && interview.scheduled_time < endOfDay
          break
        case 'week':
          const weekFromNow = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000)
          dateFilter = (interview) => 
            interview.scheduled_time >= startOfDay && interview.scheduled_time < weekFromNow
          break
        case 'month':
          const monthFromNow = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, startOfDay.getDate())
          dateFilter = (interview) => 
            interview.scheduled_time >= startOfDay && interview.scheduled_time < monthFromNow
          break
        default:
          dateFilter = () => true
      }
      
      filtered = filtered.filter(dateFilter)
    }

    setFilteredInterviews(filtered)
  }

  const calculateStats = () => {
    const total = interviews.length
    const scheduled = interviews.filter(i => i.status === 'scheduled').length
    const completed = interviews.filter(i => i.status === 'completed').length
    const in_progress = interviews.filter(i => i.status === 'in_progress').length
    const cancelled = interviews.filter(i => i.status === 'cancelled').length
    
    const completedWithScores = interviews.filter(i => i.status === 'completed' && i.overall_score)
    const average_score = completedWithScores.length > 0 
      ? completedWithScores.reduce((sum, i) => sum + (i.overall_score || 0), 0) / completedWithScores.length
      : 0

    setStats({ total, scheduled, completed, in_progress, cancelled, average_score })
  }

  const handleCreateInterview = async (interviewData: Partial<Interview>) => {
    try {
      // TODO: Implement actual interview creation API call
      console.log('Creating interview:', interviewData)
      toast.success('Interview scheduled successfully')
      setShowCreateDialog(false)
      fetchInterviews()
    } catch (error) {
      console.error('Error creating interview:', error)
      toast.error('Failed to schedule interview')
    }
  }

  const handleUpdateInterview = async (interviewId: string, updates: Partial<Interview>) => {
    try {
      // TODO: Implement actual interview update API call
      console.log('Updating interview:', interviewId, updates)
      toast.success('Interview updated successfully')
      setShowEditDialog(false)
      setSelectedInterview(null)
      fetchInterviews()
    } catch (error) {
      console.error('Error updating interview:', error)
      toast.error('Failed to update interview')
    }
  }

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      // TODO: Implement actual interview deletion API call
      console.log('Deleting interview:', interviewId)
      toast.success('Interview cancelled successfully')
      setShowDeleteDialog(false)
      setSelectedInterview(null)
      fetchInterviews()
    } catch (error) {
      console.error('Error deleting interview:', error)
      toast.error('Failed to cancel interview')
    }
  }

  const handleStartInterview = async (interviewId: string) => {
    try {
      // TODO: Implement actual interview start API call
      console.log('Starting interview:', interviewId)
      toast.success('Interview started')
      // Redirect to interview room
      window.location.href = `/interview-room/${interviewId}`
    } catch (error) {
      console.error('Error starting interview:', error)
      toast.error('Failed to start interview')
    }
  }

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in_progress': return <Play className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'rescheduled': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: Interview['interview_type']) => {
    switch (type) {
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'behavioral': return 'bg-green-100 text-green-800'
      case 'panel': return 'bg-blue-100 text-blue-800'
      case 'screening': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
                <p className="text-sm text-gray-500">Schedule and manage interviews</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {filteredInterviews.length} of {interviews.length} interviews
              </Badge>
              <PermissionGate permissions={[Permission.INTERVIEW_CREATE]}>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              </PermissionGate>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <p className="text-xs text-blue-600 mt-1">All interviews</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.scheduled}</div>
              <p className="text-xs text-yellow-600 mt-1">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">In Progress</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.in_progress}</div>
              <p className="text-xs text-green-600 mt-1">Active now</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <p className="text-xs text-gray-600 mt-1">Finished</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Avg Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.average_score.toFixed(1)}</div>
              <p className="text-xs text-purple-600 mt-1">Out of 10</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search interviews..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.status || ''} onValueChange={(value) => setFilters({ ...filters, status: value as Interview['status'] || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.interview_type || ''} onValueChange={(value) => setFilters({ ...filters, interview_type: value as Interview['interview_type'] || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="panel">Panel</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.location || ''} onValueChange={(value) => setFilters({ ...filters, location: value as Interview['location'] || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.date_range || 'all'} onValueChange={(value) => setFilters({ ...filters, date_range: value as InterviewFilters['date_range'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setFilters({ search: '' })}>
                  Clear
                </Button>
                <Button variant="outline" onClick={fetchInterviews}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interviews Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Interviews</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interview</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{interview.title}</div>
                          <div className="text-sm text-gray-500">{interview.position}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {interview.location === 'virtual' ? (
                              <Video className="h-3 w-3 text-blue-500" />
                            ) : (
                              <MapPin className="h-3 w-3 text-green-500" />
                            )}
                            <span className="text-xs text-gray-500 capitalize">{interview.location}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {interview.candidate_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{interview.candidate_name}</div>
                            <div className="text-sm text-gray-500">{interview.candidate_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(interview.interview_type)}>
                          {interview.interview_type.charAt(0).toUpperCase() + interview.interview_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interview.scheduled_time.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {interview.scheduled_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{interview.duration_minutes} min</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(interview.status)} flex items-center space-x-1 w-fit`}>
                          {getStatusIcon(interview.status)}
                          <span className="capitalize">{interview.status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {interview.overall_score ? (
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {interview.overall_score}/10
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedInterview(interview)
                              setShowDetailsDialog(true)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            {interview.status === 'scheduled' && (
                              <DropdownMenuItem onClick={() => handleStartInterview(interview.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Interview
                              </DropdownMenuItem>
                            )}
                            
                            <PermissionGate permissions={[Permission.INTERVIEW_UPDATE]}>
                              <DropdownMenuItem onClick={() => {
                                setSelectedInterview(interview)
                                setShowEditDialog(true)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            
                            <DropdownMenuSeparator />
                            
                            <PermissionGate permissions={[Permission.INTERVIEW_DELETE]}>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedInterview(interview)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredInterviews.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                <p className="text-gray-500 mb-4">
                  {filters.search || filters.status || filters.interview_type || filters.location || filters.date_range !== 'all'
                    ? 'Try adjusting your search criteria.'
                    : 'Get started by scheduling your first interview.'}
                </p>
                <PermissionGate permissions={[Permission.INTERVIEW_CREATE]}>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </PermissionGate>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs would be implemented here */}
      {/* CreateInterviewDialog, EditInterviewDialog, DeleteInterviewDialog, InterviewDetailsDialog */}
    </div>
  )
}

export default InterviewManagement