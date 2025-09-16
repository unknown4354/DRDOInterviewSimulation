/**
 * Admin Routes - Navigation and routing for administrator features
 */

import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Database, 
  Lock, 
  FileText, 
  BarChart3,
  Building,
  AlertTriangle,
  ChevronRight,
  Home
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import AdminDashboard from './AdminDashboard'
import UserManagement from './UserManagement'

// Navigation items for admin sidebar
const adminNavItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/admin',
    permissions: [Permission.SYSTEM_CONFIG]
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    path: '/admin/users',
    permissions: [Permission.USER_READ]
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: Building,
    path: '/admin/organizations',
    permissions: [Permission.ORG_READ]
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: Settings,
    path: '/admin/system',
    permissions: [Permission.SYSTEM_CONFIG]
  },
  {
    id: 'security',
    label: 'Security Center',
    icon: Lock,
    path: '/admin/security',
    permissions: [Permission.SECURITY_VIEW_LOGS]
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: FileText,
    path: '/admin/audit',
    permissions: [Permission.SYSTEM_AUDIT]
  },
  {
    id: 'analytics',
    label: 'System Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
    permissions: [Permission.ANALYTICS_VIEW]
  },
  {
    id: 'backup',
    label: 'Backup & Recovery',
    icon: Database,
    path: '/admin/backup',
    permissions: [Permission.SYSTEM_BACKUP]
  }
]

const AdminRoutes: React.FC = () => {
  const location = useLocation()
  const { hasAnyPermission } = usePermissions()

  // Filter navigation items based on user permissions
  const accessibleNavItems = adminNavItems.filter(item => 
    hasAnyPermission(item.permissions)
  )

  const getCurrentPageTitle = () => {
    const currentItem = adminNavItems.find(item => 
      location.pathname === item.path || 
      (item.path !== '/admin' && location.pathname.startsWith(item.path))
    )
    return currentItem?.label || 'Administration'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500">System Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {accessibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (item.path !== '/admin' && location.pathname.startsWith(item.path))
            
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

        {/* System Status in Sidebar */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-800">System Healthy</span>
            </div>
            <p className="text-xs text-green-600 mt-1">All services operational</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Administration</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">{getCurrentPageTitle()}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={
              <PermissionGate permissions={[Permission.USER_READ]}>
                <UserManagement />
              </PermissionGate>
            } />
            <Route path="organizations" element={
              <PermissionGate permissions={[Permission.ORG_READ]}>
                <OrganizationManagement />
              </PermissionGate>
            } />
            <Route path="system" element={
              <PermissionGate permissions={[Permission.SYSTEM_CONFIG]}>
                <SystemSettings />
              </PermissionGate>
            } />
            <Route path="security" element={
              <PermissionGate permissions={[Permission.SECURITY_VIEW_LOGS]}>
                <SecurityCenter />
              </PermissionGate>
            } />
            <Route path="audit" element={
              <PermissionGate permissions={[Permission.SYSTEM_AUDIT]}>
                <AuditLogs />
              </PermissionGate>
            } />
            <Route path="analytics" element={
              <PermissionGate permissions={[Permission.ANALYTICS_VIEW]}>
                <SystemAnalytics />
              </PermissionGate>
            } />
            <Route path="backup" element={
              <PermissionGate permissions={[Permission.SYSTEM_BACKUP]}>
                <BackupRecovery />
              </PermissionGate>
            } />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

// Placeholder components for admin pages (to be implemented)
const OrganizationManagement: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Organization Management</h3>
          <p className="text-gray-500 mb-4">
            Manage departments, organizational structure, and hierarchies.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const SystemSettings: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-500 mb-4">
            Configure system parameters, integrations, and global settings.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const SecurityCenter: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Center</h3>
          <p className="text-gray-500 mb-4">
            Monitor security events, manage access controls, and view security logs.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const AuditLogs: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Audit Logs</h3>
          <p className="text-gray-500 mb-4">
            View comprehensive audit trails and system activity logs.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const SystemAnalytics: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">System Analytics</h3>
          <p className="text-gray-500 mb-4">
            Monitor system performance, usage statistics, and operational metrics.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

const BackupRecovery: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-12 text-center">
          <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Backup & Recovery</h3>
          <p className="text-gray-500 mb-4">
            Manage system backups, data recovery, and disaster recovery procedures.
          </p>
          <Badge variant="outline">Coming Soon</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminRoutes