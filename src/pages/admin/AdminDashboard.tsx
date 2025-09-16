/**
 * Administrator Dashboard - Main admin interface with system overview
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Server,
  Lock,
  Eye,
  TrendingUp,
  UserPlus,
  FileText,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalInterviews: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  securityAlerts: number
  pendingApprovals: number
}

interface RecentActivity {
  id: string
  type: 'user_created' | 'user_login' | 'interview_completed' | 'security_alert' | 'system_config'
  description: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
  userId?: string
  userName?: string
}

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalInterviews: 0,
    systemHealth: 'healthy',
    securityAlerts: 0,
    pendingApprovals: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      
      // Mock data for demonstration
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        totalInterviews: 3456,
        systemHealth: 'healthy',
        securityAlerts: 2,
        pendingApprovals: 5
      })

      setRecentActivity([
        {
          id: '1',
          type: 'user_created',
          description: 'New user registered: john.doe@drdo.gov.in',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          severity: 'low',
          userId: 'user-123',
          userName: 'John Doe'
        },
        {
          id: '2',
          type: 'security_alert',
          description: 'Multiple failed login attempts detected',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          severity: 'high'
        },
        {
          id: '3',
          type: 'interview_completed',
          description: 'Interview session completed for Software Engineer position',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          severity: 'low'
        },
        {
          id: '4',
          type: 'system_config',
          description: 'System configuration updated by admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          severity: 'medium'
        }
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_created': return <UserPlus className="h-4 w-4" />
      case 'user_login': return <Users className="h-4 w-4" />
      case 'interview_completed': return <CheckCircle className="h-4 w-4" />
      case 'security_alert': return <AlertTriangle className="h-4 w-4" />
      case 'system_config': return <Settings className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthColor = (health: SystemStats['systemHealth']) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administrator Dashboard</h1>
                <p className="text-sm text-gray-500">System Management & Control</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {userProfile?.full_name}
              </Badge>
              <Badge className={getHealthColor(stats.systemHealth)}>
                System {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-blue-600 mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                {stats.activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Interviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.totalInterviews.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                Total conducted
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.securityAlerts}</div>
              <p className="text-xs text-yellow-600 mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.pendingApprovals}</div>
              <p className="text-xs text-purple-600 mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PermissionGate permissions={[Permission.USER_CREATE]}>
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New User
                  </Button>
                </PermissionGate>
                
                <PermissionGate permissions={[Permission.SYSTEM_CONFIG]}>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </PermissionGate>
                
                <PermissionGate permissions={[Permission.SECURITY_VIEW_LOGS]}>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Center
                  </Button>
                </PermissionGate>
                
                <PermissionGate permissions={[Permission.SYSTEM_AUDIT]}>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                </PermissionGate>
                
                <PermissionGate permissions={[Permission.SYSTEM_BACKUP]}>
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Backup & Recovery
                  </Button>
                </PermissionGate>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {activity.timestamp.toLocaleString()}
                          </p>
                          {activity.userName && (
                            <Badge variant="outline" className="text-xs">
                              {activity.userName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Database</h3>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">API Services</h3>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">AI Services</h3>
                  <p className="text-sm text-yellow-600">Degraded Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard