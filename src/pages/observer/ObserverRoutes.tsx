/**
 * Observer Routes - Navigation and routing for observer workflow
 */

import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye,
  Monitor,
  BarChart3,
  FileText,
  Settings,
  Activity,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  Video,
  MessageSquare
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import ObserverDashboard from './ObserverDashboard'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  permissions?: Permission[]
  badge?: string
  description: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Monitor,
    path: '/observer',
    permissions: [Permission.INTERVIEW_OBSERVE],
    description: 'Live interview monitoring and overview'
  },
  {
    id: 'live-monitoring',
    label: 'Live Monitoring',
    icon: Video,
    path: '/observer/live',
    permissions: [Permission.INTERVIEW_OBSERVE],
    badge: 'Live',
    description: 'Real-time interview observation'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/observer/analytics',
    permissions: [Permission.ANALYTICS_VIEW],
    description: 'Interview quality metrics and insights'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    path: '/observer/reports',
    permissions: [Permission.REPORTS_VIEW],
    description: 'Quality assurance reports'
  },
  {
    id: 'quality-alerts',
    label: 'Quality Alerts',
    icon: AlertTriangle,
    path: '/observer/alerts',
    permissions: [Permission.INTERVIEW_OBSERVE],
    badge: '3',
    description: 'Active quality and bias alerts'
  },
  {
    id: 'activity-log',
    label: 'Activity Log',
    icon: Activity,
    path: '/observer/activity',
    permissions: [Permission.AUDIT_VIEW],
    description: 'System activity and audit trail'
  }
]

// Placeholder components for observer pages
const LiveMonitoring: React.FC = () => (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Video className="h-5 w-5" />
          <span>Live Interview Monitoring</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Monitoring Interface</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Real-time observation interface for active interviews with video feeds, 
            participant monitoring, and quality assessment tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Multi-Stream View</h4>
              <p className="text-sm text-gray-600">Monitor multiple interviews simultaneously</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Quality Metrics</h4>
              <p className="text-sm text-gray-600">Real-time audio/video quality monitoring</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bias Detection</h4>
              <p className="text-sm text-gray-600">AI-powered bias and fairness monitoring</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Alert System</h4>
              <p className="text-sm text-gray-600">Instant notifications for quality issues</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ObserverAnalytics: React.FC = () => (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Observer Analytics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Analytics Dashboard</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comprehensive analytics on interview quality, bias detection, 
            engagement metrics, and overall system performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Quality Trends</h4>
              <p className="text-sm text-gray-600">Interview quality over time</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bias Analysis</h4>
              <p className="text-sm text-gray-600">Bias detection patterns and trends</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Engagement Metrics</h4>
              <p className="text-sm text-gray-600">Candidate and interviewer engagement</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Performance Insights</h4>
              <p className="text-sm text-gray-600">System and process optimization</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Compliance Reports</h4>
              <p className="text-sm text-gray-600">Regulatory compliance tracking</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Predictive Analysis</h4>
              <p className="text-sm text-gray-600">AI-powered quality predictions</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ObserverReports: React.FC = () => (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Quality Assurance Reports</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">QA Reports & Documentation</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Generate and access quality assurance reports, compliance documentation, 
            and detailed analysis of interview processes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Daily QA Reports</h4>
              <p className="text-sm text-gray-600">Automated daily quality summaries</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Bias Assessment</h4>
              <p className="text-sm text-gray-600">Detailed bias detection reports</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Compliance Audit</h4>
              <p className="text-sm text-gray-600">Regulatory compliance documentation</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Performance Analysis</h4>
              <p className="text-sm text-gray-600">System performance and optimization</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Custom Reports</h4>
              <p className="text-sm text-gray-600">Generate custom analysis reports</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Export & Share</h4>
              <p className="text-sm text-gray-600">Export reports in multiple formats</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const QualityAlerts: React.FC = () => (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Quality Alert Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Management System</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Monitor and manage quality alerts, bias detection notifications, 
            and system health warnings in real-time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-4 border rounded-lg border-red-200 bg-red-50">
              <h4 className="font-medium mb-2 text-red-800">Critical Alerts</h4>
              <p className="text-sm text-red-600">High-priority quality and bias issues</p>
            </div>
            <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
              <h4 className="font-medium mb-2 text-yellow-800">Warning Alerts</h4>
              <p className="text-sm text-yellow-600">Medium-priority system warnings</p>
            </div>
            <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
              <h4 className="font-medium mb-2 text-blue-800">Info Alerts</h4>
              <p className="text-sm text-blue-600">Low-priority informational notices</p>
            </div>
            <div className="p-4 border rounded-lg border-green-200 bg-green-50">
              <h4 className="font-medium mb-2 text-green-800">Resolved Alerts</h4>
              <p className="text-sm text-green-600">Successfully resolved issues</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Alert Configuration</h4>
              <p className="text-sm text-gray-600">Customize alert thresholds and rules</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Notification Settings</h4>
              <p className="text-sm text-gray-600">Configure alert delivery preferences</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ActivityLog: React.FC = () => (
  <div className="p-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>System Activity Log</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity & Audit Trail</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comprehensive logging of system activities, user actions, 
            and security events for audit and compliance purposes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">User Activities</h4>
              <p className="text-sm text-gray-600">Track user login, actions, and sessions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">System Events</h4>
              <p className="text-sm text-gray-600">Monitor system operations and changes</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Security Events</h4>
              <p className="text-sm text-gray-600">Security-related activities and alerts</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Interview Events</h4>
              <p className="text-sm text-gray-600">Interview lifecycle and participant actions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Data Access</h4>
              <p className="text-sm text-gray-600">Track data access and modifications</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Export Logs</h4>
              <p className="text-sm text-gray-600">Export activity logs for external analysis</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

const ObserverRoutes: React.FC = () => {
  const location = useLocation()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()

  const isActivePath = (path: string) => {
    if (path === '/observer') {
      return location.pathname === '/observer' || location.pathname === '/observer/'
    }
    return location.pathname.startsWith(path)
  }

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!item.permissions) return true
    return item.permissions.some(permission => hasPermission(permission))
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Observer Panel</h2>
              <p className="text-sm text-gray-500">Quality Monitoring</p>
            </div>
          </div>
          {userProfile && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {userProfile.full_name?.charAt(0) || 'O'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)
            
            return (
              <PermissionGate key={item.id} permissions={item.permissions || []}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-3 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => window.location.href = item.path}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={isActive ? "secondary" : "outline"} 
                            className={`text-xs ${
                              isActive ? 'bg-white/20 text-white border-white/30' : ''
                            } ${
                              item.badge === 'Live' ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : ''
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </PermissionGate>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">System Status</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Monitoring</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Quality Check</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">AI Analysis</span>
                <span className="text-green-600 font-medium">Running</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<ObserverDashboard />} />
          <Route path="/live" element={<LiveMonitoring />} />
          <Route path="/analytics" element={<ObserverAnalytics />} />
          <Route path="/reports" element={<ObserverReports />} />
          <Route path="/alerts" element={<QualityAlerts />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="*" element={<Navigate to="/observer" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default ObserverRoutes