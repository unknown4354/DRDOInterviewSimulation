/**
 * Testing Dashboard - Comprehensive testing interface for role workflows
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TestTube,
  Users,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Clock,
  Shield,
  Key,
  UserCheck,
  UserX,
  Zap,
  Target,
  BarChart3,
  FileText,
  Filter,
  Search,
  ChevronRight,
  Info,
  Bug,
  Wrench
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
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
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission, UserRole } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import {
  testUserManager,
  TestUser,
  TestScenario,
  TEST_USERS,
  TEST_SCENARIOS,
  TestUtils
} from '../../lib/testUsers'
import { toast } from 'sonner'

interface TestResult {
  scenario: string
  success: boolean
  details: Array<{
    action: string
    expected: string
    actual: string
    passed: boolean
  }>
  timestamp: Date
  duration: number
}

interface TestStats {
  total_tests: number
  passed_tests: number
  failed_tests: number
  success_rate: number
  last_run: Date | null
  total_users: number
  active_users: number
  roles_covered: number
}

const TestingDashboard: React.FC = () => {
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [stats, setStats] = useState<TestStats>({
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    success_rate: 0,
    last_run: null,
    total_users: 0,
    active_users: 0,
    roles_covered: 0
  })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const [currentTestUser, setCurrentTestUser] = useState<TestUser | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoTest, setAutoTest] = useState(false)

  useEffect(() => {
    initializeTestingData()
    
    // Check if currently using a test user
    const testUser = testUserManager.getCurrentTestUser()
    setCurrentTestUser(testUser)
  }, [])

  const initializeTestingData = () => {
    const report = testUserManager.generateTestReport()
    const uniqueRoles = new Set(TEST_USERS.map(u => u.role)).size
    
    setStats({
      total_tests: TEST_SCENARIOS.length,
      passed_tests: 0,
      failed_tests: 0,
      success_rate: 0,
      last_run: null,
      total_users: report.total_users,
      active_users: report.active_users,
      roles_covered: uniqueRoles
    })
  }

  const runSingleTest = async (scenarioId: string) => {
    setRunningTests(prev => new Set([...prev, scenarioId]))
    
    try {
      const startTime = Date.now()
      const result = await testUserManager.runTestScenario(scenarioId)
      const duration = Date.now() - startTime
      
      const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId)
      const testResult: TestResult = {
        scenario: scenario?.name || scenarioId,
        success: result.success,
        details: result.results,
        timestamp: new Date(),
        duration
      }
      
      setTestResults(prev => [testResult, ...prev.slice(0, 49)]) // Keep last 50 results
      
      if (result.success) {
        toast.success(`Test passed: ${scenario?.name}`)
      } else {
        toast.error(`Test failed: ${scenario?.name}`)
      }
      
      updateStats()
    } catch (error) {
      console.error('Test execution error:', error)
      toast.error(`Test error: ${error.message}`)
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioId)
        return newSet
      })
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    
    try {
      const startTime = Date.now()
      const results = await TestUtils.runAllTests()
      const duration = Date.now() - startTime
      
      const newResults: TestResult[] = results.results.map(result => ({
        scenario: result.scenario,
        success: result.success,
        details: result.details.results || [],
        timestamp: new Date(),
        duration: duration / results.results.length // Average duration per test
      }))
      
      setTestResults(prev => [...newResults, ...prev.slice(0, 50 - newResults.length)])
      
      toast.success(`All tests completed: ${results.passed}/${results.total} passed`)
      updateStats()
    } catch (error) {
      console.error('Error running all tests:', error)
      toast.error('Failed to run all tests')
    } finally {
      setLoading(false)
    }
  }

  const switchToTestUser = async (userId: string) => {
    try {
      const success = await testUserManager.switchToTestUser(userId)
      if (success) {
        const testUser = testUserManager.getCurrentTestUser()
        setCurrentTestUser(testUser)
        toast.success(`Switched to test user: ${testUser?.full_name}`)
      } else {
        toast.error('Failed to switch to test user')
      }
    } catch (error) {
      console.error('Error switching user:', error)
      toast.error('Error switching to test user')
    }
  }

  const restoreOriginalUser = async () => {
    try {
      const success = await testUserManager.restoreOriginalUser()
      if (success) {
        setCurrentTestUser(null)
        toast.success('Restored original user')
      } else {
        toast.error('Failed to restore original user')
      }
    } catch (error) {
      console.error('Error restoring user:', error)
      toast.error('Error restoring original user')
    }
  }

  const updateStats = () => {
    const recentResults = testResults.slice(0, 20) // Last 20 results
    const passed = recentResults.filter(r => r.success).length
    const failed = recentResults.length - passed
    const successRate = recentResults.length > 0 ? (passed / recentResults.length) * 100 : 0
    
    setStats(prev => ({
      ...prev,
      passed_tests: passed,
      failed_tests: failed,
      success_rate: successRate,
      last_run: new Date()
    }))
  }

  const copyCredentials = (user: TestUser) => {
    const credentials = `Email: ${user.email}\nPassword: ${user.password}\nRole: ${user.role}`
    navigator.clipboard.writeText(credentials)
    toast.success('Credentials copied to clipboard')
  }

  const exportTestResults = () => {
    const data = {
      stats,
      results: testResults,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Test results exported')
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR: return 'bg-red-100 text-red-800 border-red-200'
      case UserRole.SELECTOR: return 'bg-blue-100 text-blue-800 border-blue-200'
      case UserRole.CANDIDATE: return 'bg-green-100 text-green-800 border-green-200'
      case UserRole.OBSERVER: return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (success: boolean) => {
    return success 
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'
  }

  const filteredUsers = TEST_USERS.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesSearch = !searchTerm || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesRole && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <TestTube className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Testing Dashboard</h1>
                <p className="text-sm text-gray-500">Comprehensive role workflow testing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentTestUser && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 border border-yellow-200 rounded-lg">
                  <UserCheck className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Test User: {currentTestUser.full_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restoreOriginalUser}
                    className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Badge 
                variant="outline" 
                className={stats.success_rate >= 80 ? 'text-green-600 border-green-200' : 
                          stats.success_rate >= 60 ? 'text-yellow-600 border-yellow-200' : 
                          'text-red-600 border-red-200'}
              >
                Success Rate: {stats.success_rate.toFixed(1)}%
              </Badge>
              <Button variant="outline" size="sm" onClick={exportTestResults}>
                <Download className="h-4 w-4" />
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
              <CardTitle className="text-sm font-medium text-blue-800">Total Tests</CardTitle>
              <TestTube className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total_tests}</div>
              <p className="text-xs text-blue-600 mt-1">Test scenarios</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.passed_tests}</div>
              <p className="text-xs text-green-600 mt-1">Successful</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{stats.failed_tests}</div>
              <p className="text-xs text-red-600 mt-1">Failed tests</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Test Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.total_users}</div>
              <p className="text-xs text-purple-600 mt-1">{stats.active_users} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Roles Covered</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.roles_covered}</div>
              <p className="text-xs text-orange-600 mt-1">User roles</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${stats.success_rate >= 80 ? 'from-green-50 to-green-100 border-green-200' : stats.success_rate >= 60 ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stats.success_rate >= 80 ? 'text-green-800' : stats.success_rate >= 60 ? 'text-yellow-800' : 'text-red-800'}`}>Success Rate</CardTitle>
              <BarChart3 className={`h-4 w-4 ${stats.success_rate >= 80 ? 'text-green-600' : stats.success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.success_rate >= 80 ? 'text-green-900' : stats.success_rate >= 60 ? 'text-yellow-900' : 'text-red-900'}`}>
                {stats.success_rate.toFixed(1)}%
              </div>
              <p className={`text-xs mt-1 ${stats.success_rate >= 80 ? 'text-green-600' : stats.success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.last_run ? `Last: ${stats.last_run.toLocaleTimeString()}` : 'No tests run'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
            <TabsTrigger value="users">Test Users</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={runAllTests} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run All Tests
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => TestUtils.quickLogin(UserRole.ADMINISTRATOR)}
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Admin Login
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => TestUtils.quickLogin(UserRole.SELECTOR)}
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Selector Login
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => TestUtils.quickLogin(UserRole.CANDIDATE)}
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Candidate Login
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => TestUtils.quickLogin(UserRole.OBSERVER)}
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Observer Login
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor="auto-test" className="text-sm">Auto-run tests</Label>
                    <Switch
                      id="auto-test"
                      checked={autoTest}
                      onCheckedChange={setAutoTest}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Test Coverage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Test Coverage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.values(UserRole).map(role => {
                      const roleUsers = TEST_USERS.filter(u => u.role === role)
                      const roleScenarios = TEST_SCENARIOS.filter(s => {
                        const user = TEST_USERS.find(u => u.id === s.user_id)
                        return user?.role === role
                      })
                      
                      return (
                        <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge className={getRoleColor(role)}>
                              {role}
                            </Badge>
                            <div className="text-sm">
                              <div className="font-medium">{roleUsers.length} users</div>
                              <div className="text-gray-500">{roleScenarios.length} scenarios</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min((roleScenarios.length / 3) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.min(Math.round((roleScenarios.length / 3) * 100), 100)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Test Scenarios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {TEST_SCENARIOS.map((scenario) => {
                    const user = TEST_USERS.find(u => u.id === scenario.user_id)
                    const isRunning = runningTests.has(scenario.id)
                    
                    return (
                      <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              {user && (
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {scenario.test_actions.length} actions
                              </span>
                              <span className="text-xs text-gray-500">
                                User: {user?.full_name}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => runSingleTest(scenario.id)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">Test Actions:</h5>
                          {scenario.test_actions.map((action, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 ml-4">
                              <ChevronRight className="h-3 w-3" />
                              <span>{action.description}</span>
                              <Badge variant="outline" className="text-xs">
                                {action.expected_result}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Test Users</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="show-credentials" className="text-sm">Show Passwords</Label>
                      <Switch
                        id="show-credentials"
                        checked={showCredentials}
                        onCheckedChange={setShowCredentials}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-48"
                        />
                      </div>
                      <Select value={filterRole} onValueChange={(value: UserRole | 'all') => setFilterRole(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          {Object.values(UserRole).map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${user.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {user.is_active ? (
                            <UserCheck className={`h-4 w-4 ${user.is_active ? 'text-green-600' : 'text-gray-600'}`} />
                          ) : (
                            <UserX className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            {!user.is_active && (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                Inactive
                              </Badge>
                            )}
                            {user.mfa_enabled && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                MFA
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Email: {user.email}</div>
                            {showCredentials && (
                              <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1">
                                Password: {user.password}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {user.department} • {user.position} • {user.security_clearance}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCredentials(user)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {user.is_active && (
                          <Button
                            size="sm"
                            onClick={() => switchToTestUser(user.id)}
                            disabled={currentTestUser?.id === user.id}
                          >
                            {currentTestUser?.id === user.id ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Test Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{result.scenario}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{result.timestamp.toLocaleString()}</span>
                            </span>
                            <span>Duration: {result.duration}ms</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(result.success)}>
                          {result.success ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {result.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                            <span>{detail.action}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">Expected: {detail.expected}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">Actual: {detail.actual}</span>
                              {detail.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  
                  {testResults.length === 0 && (
                    <div className="text-center py-8">
                      <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No test results</h3>
                      <p className="text-gray-500 mb-4">
                        Run some tests to see results here.
                      </p>
                      <Button onClick={runAllTests}>
                        <Play className="h-4 w-4 mr-2" />
                        Run All Tests
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default TestingDashboard