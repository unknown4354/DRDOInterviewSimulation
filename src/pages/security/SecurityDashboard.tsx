/**
 * Security Dashboard - Comprehensive security management interface
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Users,
  Globe,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  XCircle,
  Info,
  Zap,
  Bell,
  Mail,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import {
  securityManager,
  SecurityEvent,
  SecurityEventType,
  MFAMethod,
  DeviceInfo,
  SessionInfo,
  SecuritySettings,
  DEFAULT_PASSWORD_POLICY,
  SecurityUtils
} from '../../lib/security'
import { toast } from 'sonner'

interface SecurityStats {
  total_events_today: number
  critical_alerts: number
  active_sessions: number
  trusted_devices: number
  mfa_enabled_users: number
  risk_score: number
}

const SecurityDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SecurityStats>({
    total_events_today: 0,
    critical_alerts: 0,
    active_sessions: 0,
    trusted_devices: 0,
    mfa_enabled_users: 0,
    risk_score: 0
  })
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [userSessions, setUserSessions] = useState<SessionInfo[]>([])
  const [userDevices, setUserDevices] = useState<DeviceInfo[]>([])
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    user_id: userProfile?.id || '',
    mfa_required: false,
    session_timeout_minutes: 480,
    max_concurrent_sessions: 3,
    device_trust_duration_days: 30,
    login_attempt_limit: 5,
    lockout_duration_minutes: 15,
    password_expiry_days: 90,
    require_password_change: false,
    allow_remember_device: true,
    email_notifications: true,
    sms_notifications: false,
    updated_at: new Date()
  })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [eventFilter, setEventFilter] = useState<{
    type?: SecurityEventType
    severity?: string
    search: string
  }>({ search: '' })
  const [showMFASetup, setShowMFASetup] = useState(false)
  const [newMFAMethod, setNewMFAMethod] = useState<{
    type: 'totp' | 'sms' | 'email'
    name: string
  }>({ type: 'totp', name: '' })

  useEffect(() => {
    if (userProfile?.id) {
      fetchSecurityData()
    }
  }, [userProfile?.id])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      if (!userProfile?.id) return

      // Fetch security events
      const events = await securityManager.getSecurityEvents(userProfile.id, undefined, undefined, 50)
      setSecurityEvents(events)

      // Fetch user sessions
      const sessions = securityManager.getUserSessions(userProfile.id)
      setUserSessions(sessions)

      // Fetch user devices
      const devices = securityManager.getUserDevices(userProfile.id)
      setUserDevices(devices)

      // Fetch MFA methods
      const mfa = securityManager.getMFAMethods(userProfile.id)
      setMfaMethods(mfa)

      // Calculate stats
      const todayEvents = events.filter(e => 
        e.timestamp.toDateString() === new Date().toDateString()
      )
      const criticalAlerts = events.filter(e => 
        e.severity === 'critical' && !e.resolved
      )
      const riskScore = SecurityUtils.calculateRiskScore(events)

      setStats({
        total_events_today: todayEvents.length,
        critical_alerts: criticalAlerts.length,
        active_sessions: sessions.length,
        trusted_devices: devices.filter(d => d.trusted).length,
        mfa_enabled_users: mfa.filter(m => m.enabled).length,
        risk_score: riskScore
      })
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await securityManager.terminateSession(sessionId, 'user_action')
      await fetchSecurityData()
      toast.success('Session terminated successfully')
    } catch (error) {
      console.error('Error terminating session:', error)
      toast.error('Failed to terminate session')
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      if (!userProfile?.id) return
      await securityManager.removeDevice(userProfile.id, deviceId)
      await fetchSecurityData()
      toast.success('Device removed successfully')
    } catch (error) {
      console.error('Error removing device:', error)
      toast.error('Failed to remove device')
    }
  }

  const handleTrustDevice = async (deviceId: string) => {
    try {
      if (!userProfile?.id) return
      await securityManager.trustDevice(userProfile.id, deviceId)
      await fetchSecurityData()
      toast.success('Device marked as trusted')
    } catch (error) {
      console.error('Error trusting device:', error)
      toast.error('Failed to trust device')
    }
  }

  const handleEnableMFA = async () => {
    try {
      if (!userProfile?.id || !newMFAMethod.name.trim()) {
        toast.error('Please provide a name for the MFA method')
        return
      }

      await securityManager.enableMFA(userProfile.id, {
        type: newMFAMethod.type,
        name: newMFAMethod.name,
        enabled: true,
        verified: false
      })

      await fetchSecurityData()
      setShowMFASetup(false)
      setNewMFAMethod({ type: 'totp', name: '' })
      toast.success('MFA method added successfully')
    } catch (error) {
      console.error('Error enabling MFA:', error)
      toast.error('Failed to enable MFA')
    }
  }

  const handleDisableMFA = async (methodId: string) => {
    try {
      if (!userProfile?.id) return
      await securityManager.disableMFA(userProfile.id, methodId)
      await fetchSecurityData()
      toast.success('MFA method disabled')
    } catch (error) {
      console.error('Error disabling MFA:', error)
      toast.error('Failed to disable MFA')
    }
  }

  const handleUpdateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    try {
      const updatedSettings = { ...securitySettings, ...updates, updated_at: new Date() }
      setSecuritySettings(updatedSettings)
      // TODO: Save to backend
      toast.success('Security settings updated')
    } catch (error) {
      console.error('Error updating security settings:', error)
      toast.error('Failed to update security settings')
    }
  }

  const getEventIcon = (eventType: SecurityEventType) => {
    switch (eventType) {
      case SecurityEventType.LOGIN_SUCCESS:
      case SecurityEventType.LOGIN_FAILED:
        return <Key className="h-4 w-4" />
      case SecurityEventType.MFA_ENABLED:
      case SecurityEventType.MFA_DISABLED:
        return <Smartphone className="h-4 w-4" />
      case SecurityEventType.DEVICE_REGISTERED:
      case SecurityEventType.DEVICE_REMOVED:
        return <Monitor className="h-4 w-4" />
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getEventColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesType = !eventFilter.type || event.event_type === eventFilter.type
    const matchesSeverity = !eventFilter.severity || event.severity === eventFilter.severity
    const matchesSearch = !eventFilter.search || 
      event.description.toLowerCase().includes(eventFilter.search.toLowerCase()) ||
      event.event_type.toLowerCase().includes(eventFilter.search.toLowerCase())
    
    return matchesType && matchesSeverity && matchesSearch
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
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
                <p className="text-sm text-gray-500">Manage security settings and monitor activities</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={`${getRiskScoreColor(stats.risk_score)} border-current`}
              >
                Risk Score: {stats.risk_score}/100
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchSecurityData}>
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
              <CardTitle className="text-sm font-medium text-blue-800">Today's Events</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total_events_today}</div>
              <p className="text-xs text-blue-600 mt-1">Security events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.critical_alerts}</div>
              <p className="text-xs text-red-600 mt-1">Unresolved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Sessions</CardTitle>
              <Monitor className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.active_sessions}</div>
              <p className="text-xs text-green-600 mt-1">Current</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Trusted Devices</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.trusted_devices}</div>
              <p className="text-xs text-purple-600 mt-1">Verified</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">MFA Methods</CardTitle>
              <Smartphone className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{mfaMethods.filter(m => m.enabled).length}</div>
              <p className="text-xs text-orange-600 mt-1">Active</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${stats.risk_score >= 70 ? 'from-red-50 to-red-100 border-red-200' : stats.risk_score >= 40 ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-green-50 to-green-100 border-green-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stats.risk_score >= 70 ? 'text-red-800' : stats.risk_score >= 40 ? 'text-yellow-800' : 'text-green-800'}`}>Risk Score</CardTitle>
              <TrendingUp className={`h-4 w-4 ${stats.risk_score >= 70 ? 'text-red-600' : stats.risk_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.risk_score >= 70 ? 'text-red-900' : stats.risk_score >= 40 ? 'text-yellow-900' : 'text-green-900'}`}>{stats.risk_score}/100</div>
              <p className={`text-xs mt-1 ${stats.risk_score >= 70 ? 'text-red-600' : stats.risk_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats.risk_score >= 70 ? 'High Risk' : stats.risk_score >= 40 ? 'Medium Risk' : 'Low Risk'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="sessions">Sessions & Devices</TabsTrigger>
            <TabsTrigger value="mfa">Multi-Factor Auth</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Security Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Security Events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className={`p-1 rounded ${getEventColor(event.severity)}`}>
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={getEventColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mfaMethods.filter(m => m.enabled).length === 0 && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Enable Multi-Factor Authentication
                          </p>
                          <p className="text-xs text-yellow-600 mt-1">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {userDevices.filter(d => d.trusted).length === 0 && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Trust Your Devices
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Mark frequently used devices as trusted
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {stats.risk_score >= 40 && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Review Security Events
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Your risk score is elevated. Review recent security events.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {stats.risk_score < 20 && (
                      <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Security Status: Excellent
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Your account security is in great shape!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Security Events</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search events..."
                        value={eventFilter.search}
                        onChange={(e) => setEventFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Select 
                      value={eventFilter.severity || 'all'} 
                      onValueChange={(value) => setEventFilter(prev => ({ 
                        ...prev, 
                        severity: value === 'all' ? undefined : value 
                      }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severity</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getEventColor(event.severity)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {event.description}
                          </p>
                          <Badge variant="outline" className={getEventColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{event.timestamp.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.ip_address}</span>
                          </span>
                          <span className="capitalize">
                            {event.event_type.replace('_', ' ')}
                          </span>
                        </div>
                        {Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <details className="cursor-pointer">
                              <summary>View Details</summary>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No security events</h3>
                      <p className="text-gray-500">
                        {eventFilter.search || eventFilter.severity 
                          ? 'No events match your search criteria.'
                          : 'No security events found.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions & Devices Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5" />
                    <span>Active Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userSessions.map((session) => {
                      const device = userDevices.find(d => d.id === session.device_id)
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Monitor className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {device?.device_name || 'Unknown Device'}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{session.ip_address}</span>
                                <span>•</span>
                                <span>{session.last_activity.toLocaleString()}</span>
                                {session.location && (
                                  <>
                                    <span>•</span>
                                    <span>{session.location.city}, {session.location.country}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                    
                    {userSessions.length === 0 && (
                      <div className="text-center py-6">
                        <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No active sessions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trusted Devices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Trusted Devices</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userDevices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            device.trusted ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {device.device_type === 'mobile' ? (
                              <Smartphone className={`h-4 w-4 ${
                                device.trusted ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            ) : (
                              <Monitor className={`h-4 w-4 ${
                                device.trusted ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {device.device_name}
                              </p>
                              {device.trusted && (
                                <Badge variant="outline" className="text-green-600 border-green-200">
                                  Trusted
                                </Badge>
                              )}
                              {device.is_current && (
                                <Badge variant="outline" className="text-blue-600 border-blue-200">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{device.browser} on {device.os}</span>
                              <span>•</span>
                              <span>Last seen: {device.last_seen.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!device.trusted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrustDevice(device.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {!device.is_current && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveDevice(device.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {userDevices.length === 0 && (
                      <div className="text-center py-6">
                        <Smartphone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No devices registered</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MFA Tab */}
          <TabsContent value="mfa" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Multi-Factor Authentication</span>
                  </CardTitle>
                  <Dialog open={showMFASetup} onOpenChange={setShowMFASetup}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add MFA Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add MFA Method</DialogTitle>
                        <DialogDescription>
                          Choose a multi-factor authentication method to secure your account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="mfa-type">Authentication Method</Label>
                          <Select 
                            value={newMFAMethod.type} 
                            onValueChange={(value: 'totp' | 'sms' | 'email') => 
                              setNewMFAMethod(prev => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="totp">Authenticator App (TOTP)</SelectItem>
                              <SelectItem value="sms">SMS Text Message</SelectItem>
                              <SelectItem value="email">Email Verification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="mfa-name">Method Name</Label>
                          <Input
                            id="mfa-name"
                            placeholder="e.g., My Phone, Work Email"
                            value={newMFAMethod.name}
                            onChange={(e) => setNewMFAMethod(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMFASetup(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEnableMFA}>
                          Add Method
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mfaMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          method.enabled ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {method.type === 'totp' && <Smartphone className={`h-4 w-4 ${
                            method.enabled ? 'text-green-600' : 'text-gray-600'
                          }`} />}
                          {method.type === 'sms' && <MessageSquare className={`h-4 w-4 ${
                            method.enabled ? 'text-green-600' : 'text-gray-600'
                          }`} />}
                          {method.type === 'email' && <Mail className={`h-4 w-4 ${
                            method.enabled ? 'text-green-600' : 'text-gray-600'
                          }`} />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{method.name}</p>
                            <Badge variant="outline" className={method.enabled ? 'text-green-600 border-green-200' : 'text-gray-600 border-gray-200'}>
                              {method.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {method.verified && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 capitalize">
                            {method.type.replace('_', ' ')} • Added {method.created_at.toLocaleDateString()}
                            {method.last_used && ` • Last used ${method.last_used.toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisableMFA(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {mfaMethods.length === 0 && (
                    <div className="text-center py-8">
                      <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No MFA methods configured</h3>
                      <p className="text-gray-500 mb-4">
                        Add multi-factor authentication to secure your account with an extra layer of protection.
                      </p>
                      <Button onClick={() => setShowMFASetup(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First MFA Method
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Require MFA</Label>
                      <p className="text-xs text-gray-500">Always require multi-factor authentication</p>
                    </div>
                    <Switch
                      checked={securitySettings.mfa_required}
                      onCheckedChange={(checked) => handleUpdateSecuritySettings({ mfa_required: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Remember Devices</Label>
                      <p className="text-xs text-gray-500">Allow trusted devices to skip MFA</p>
                    </div>
                    <Switch
                      checked={securitySettings.allow_remember_device}
                      onCheckedChange={(checked) => handleUpdateSecuritySettings({ allow_remember_device: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-gray-500">Receive security alerts via email</p>
                    </div>
                    <Switch
                      checked={securitySettings.email_notifications}
                      onCheckedChange={(checked) => handleUpdateSecuritySettings({ email_notifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">SMS Notifications</Label>
                      <p className="text-xs text-gray-500">Receive security alerts via SMS</p>
                    </div>
                    <Switch
                      checked={securitySettings.sms_notifications}
                      onCheckedChange={(checked) => handleUpdateSecuritySettings({ sms_notifications: checked })}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Session Timeout (minutes)</Label>
                    <p className="text-xs text-gray-500 mb-2">Automatically log out after inactivity</p>
                    <Input
                      type="number"
                      value={securitySettings.session_timeout_minutes}
                      onChange={(e) => handleUpdateSecuritySettings({ 
                        session_timeout_minutes: parseInt(e.target.value) || 480 
                      })}
                      min={15}
                      max={1440}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Max Concurrent Sessions</Label>
                    <p className="text-xs text-gray-500 mb-2">Maximum number of active sessions</p>
                    <Input
                      type="number"
                      value={securitySettings.max_concurrent_sessions}
                      onChange={(e) => handleUpdateSecuritySettings({ 
                        max_concurrent_sessions: parseInt(e.target.value) || 3 
                      })}
                      min={1}
                      max={10}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Password Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Password Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Minimum length: {DEFAULT_PASSWORD_POLICY.min_length} characters</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require uppercase letters</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require lowercase letters</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require numbers</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require special characters</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Password expires every {DEFAULT_PASSWORD_POLICY.expiry_days} days</span>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SecurityDashboard