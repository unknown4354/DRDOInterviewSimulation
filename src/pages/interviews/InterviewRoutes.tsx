/**
 * Interview Routes - Navigation and routing for interview management features
 */

import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Video, 
  Users, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronRight,
  Home,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import InterviewManagement from './InterviewManagement'

// Navigation items for interview sidebar
const interviewNavItems = [
  {
    id: 'dashboard',
    label: 'Interview Dashboard',
    icon: Home,
    path: '/interviews',
    permissions: [Permission.INTERVIEW_READ]
  },
  {
    id: 'schedule',
    label: 'Schedule Interview',
    icon: Calendar,
    path: '/interviews/schedule',
    permissions: [Permission.INTERVIEW_CREATE]
  },
  {
    id: 'active',
    label: 'Active Interviews',
    icon: Video,
    path: '/interviews/active',
    permissions: [Permission.INTERVIEW_CONDUCT]
  },
  {
    id: 'completed',
    label: 'Completed Interviews',
    icon: CheckCircle,
    path: '/interviews/completed',
    permissions: [Permission.INTERVIEW_READ]
  },
  {
    id: 'candidates',
    label: 'Candidate Pool',
    icon: Users,
    path: '/interviews/candidates',
    permissions: [Permission.USER_READ]
  },
  {
    id: 'analytics',
    label: 'Interview Analytics',
    icon: BarChart3,
    path: '/interviews/analytics',
    permissions: [Permission.ANALYTICS_VIEW]
  },
  {
    id: 'reports',
    label: 'Interview Reports',
    icon: FileText,
    path: '/interviews/reports',
    permissions: [Permission.REPORTS_VIEW]
  },
  {
    id: 'settings',
    label: 'Interview Settings',
    icon: Settings,
    path: '/interviews/settings',
    permissions: [Permission.INTERVIEW_UPDATE]
  }
]

const InterviewRoutes: React.FC = () => {
  const location = useLocation()
  const { hasAnyPermission } = usePermissions()

  // Filter navigation items based on user permissions
  const accessibleNavItems = interviewNavItems.filter(item => 
    hasAnyPermission(item.permissions)
  )

  const getCurrentPageTitle = () => {
    const currentItem = interviewNavItems.find(item => 
      location.pathname === item.path || 
      (item.path !== '/interviews' && location.pathname.startsWith(item.path))
    )
    return currentItem?.label || 'Interview Management'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Interviews</h2>
              <p className="text-sm text-gray-500">Management Center</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {accessibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (item.path !== '/interviews' && location.pathname.startsWith(item.path))
            
            return (
              <PermissionGate key={item.id} permissions={item.permissions}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => window.location.href = item.path}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Button>
              </PermissionGate>
            )
          })}
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Today's Interviews</span>
                <Badge className="bg-blue-600 text-white">3</Badge>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Active Now</span>
                <Badge className="bg-green-600 text-white">1</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Interviews</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{getCurrentPageTitle()}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          <Routes>
            <Route index element={<InterviewManagement />} />
            <Route path="schedule" element={
              <PermissionGate permissions={[Permission.INTERVIEW_CREATE]}>
                <ScheduleInterview />
              </PermissionGate>
            } />
            <Route path="active" element={
              <PermissionGate permissions={[Permission.INTERVIEW_CONDUCT]}>
                <ActiveInterviews />
              </PermissionGate>
            } />
            <Route path="completed" element={
              <PermissionGate permissions={[Permission.INTERVIEW_READ]}>
                <CompletedInterviews />
              </PermissionGate>
            } />
            <Route path="candidates" element={
              <PermissionGate permissions={[Permission.USER_READ]}>
                <CandidatePool />
              </PermissionGate>
            } />
            <Route path="analytics" element={
              <PermissionGate permissions={[Permission.ANALYTICS_VIEW]}>
                <InterviewAnalytics />
              </PermissionGate>
            } />
            <Route path="reports" element={
              <PermissionGate permissions={[Permission.REPORTS_VIEW]}>
                <InterviewReports />
              </PermissionGate>
            } />
            <Route path="settings" element={
              <PermissionGate permissions={[Permission.INTERVIEW_UPDATE]}>
                <InterviewSettings />
              </PermissionGate>
            } />
            <Route path="*" element={<Navigate to="/interviews" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for interview pages (to be implemented)
const ScheduleInterview: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule Interview</h3>
          <p className="text-gray-500 mb-4">
            Create and schedule new interviews with candidates.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const ActiveInterviews: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Active Interviews</h3>
          <p className="text-gray-500 mb-4">
            Monitor and manage currently ongoing interviews.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const CompletedInterviews: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Completed Interviews</h3>
          <p className="text-gray-500 mb-4">
            Review and analyze completed interview sessions.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const CandidatePool: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Candidate Pool</h3>
          <p className="text-gray-500 mb-4">
            Manage candidate profiles and interview history.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const InterviewAnalytics: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Analytics</h3>
          <p className="text-gray-500 mb-4">
            View detailed analytics and performance metrics for interviews.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const InterviewReports: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Reports</h3>
          <p className="text-gray-500 mb-4">
            Generate and export comprehensive interview reports.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const InterviewSettings: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Settings</h3>
          <p className="text-gray-500 mb-4">
            Configure interview parameters and evaluation criteria.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export default InterviewRoutes