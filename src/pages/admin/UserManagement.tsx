/**
 * User Management - Admin interface for managing users, roles, and permissions
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  EyeOff,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw
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
  DialogTrigger,
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
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import { UserRole, SecurityLevel } from '../../../shared/types/auth'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  department: string
  security_clearance: SecurityLevel
  is_active: boolean
  email_verified: boolean
  last_login?: Date
  created_at: Date
  avatar_url?: string
}

interface UserFilters {
  role?: UserRole
  department?: string
  security_clearance?: SecurityLevel
  is_active?: boolean
  search: string
}

const UserManagement: React.FC = () => {
  const { hasPermission } = usePermissions()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({ search: '' })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      
      // Mock data for demonstration
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin.user',
          email: 'admin@drdo.gov.in',
          full_name: 'Admin User',
          role: UserRole.ADMINISTRATOR,
          department: 'IT Administration',
          security_clearance: SecurityLevel.SECRET,
          is_active: true,
          email_verified: true,
          last_login: new Date(Date.now() - 1000 * 60 * 30),
          created_at: new Date('2024-01-15')
        },
        {
          id: '2',
          username: 'john.selector',
          email: 'john.selector@drdo.gov.in',
          full_name: 'John Selector',
          role: UserRole.SELECTOR,
          department: 'Human Resources',
          security_clearance: SecurityLevel.CONFIDENTIAL,
          is_active: true,
          email_verified: true,
          last_login: new Date(Date.now() - 1000 * 60 * 60 * 2),
          created_at: new Date('2024-02-01')
        },
        {
          id: '3',
          username: 'jane.candidate',
          email: 'jane.candidate@example.com',
          full_name: 'Jane Candidate',
          role: UserRole.CANDIDATE,
          department: 'Engineering',
          security_clearance: SecurityLevel.PUBLIC,
          is_active: true,
          email_verified: false,
          created_at: new Date('2024-02-15')
        },
        {
          id: '4',
          username: 'bob.observer',
          email: 'bob.observer@drdo.gov.in',
          full_name: 'Bob Observer',
          role: UserRole.OBSERVER,
          department: 'Quality Assurance',
          security_clearance: SecurityLevel.RESTRICTED,
          is_active: false,
          email_verified: true,
          last_login: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          created_at: new Date('2024-01-20')
        }
      ]
      
      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower)
      )
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department)
    }

    if (filters.security_clearance) {
      filtered = filtered.filter(user => user.security_clearance === filters.security_clearance)
    }

    if (filters.is_active !== undefined) {
      filtered = filtered.filter(user => user.is_active === filters.is_active)
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      // TODO: Implement actual user creation API call
      console.log('Creating user:', userData)
      toast.success('User created successfully')
      setShowCreateDialog(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // TODO: Implement actual user update API call
      console.log('Updating user:', userId, updates)
      toast.success('User updated successfully')
      setShowEditDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      // TODO: Implement actual user deletion API call
      console.log('Deleting user:', userId)
      toast.success('User deleted successfully')
      setShowDeleteDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      // TODO: Implement actual user status toggle API call
      console.log('Toggling user status:', userId, isActive)
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR: return 'bg-red-100 text-red-800'
      case UserRole.SELECTOR: return 'bg-blue-100 text-blue-800'
      case UserRole.CANDIDATE: return 'bg-green-100 text-green-800'
      case UserRole.OBSERVER: return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClearanceColor = (clearance: SecurityLevel) => {
    switch (clearance) {
      case SecurityLevel.SECRET: return 'bg-red-100 text-red-800'
      case SecurityLevel.CONFIDENTIAL: return 'bg-orange-100 text-orange-800'
      case SecurityLevel.RESTRICTED: return 'bg-yellow-100 text-yellow-800'
      case SecurityLevel.PUBLIC: return 'bg-green-100 text-green-800'
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
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {filteredUsers.length} of {users.length} users
              </Badge>
              <PermissionGate permissions={[Permission.USER_CREATE]}>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select value={filters.role || ''} onValueChange={(value) => setFilters({ ...filters, role: value as UserRole || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                  <SelectItem value={UserRole.SELECTOR}>Selector</SelectItem>
                  <SelectItem value={UserRole.CANDIDATE}>Candidate</SelectItem>
                  <SelectItem value={UserRole.OBSERVER}>Observer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.security_clearance || ''} onValueChange={(value) => setFilters({ ...filters, security_clearance: value as SecurityLevel || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clearances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clearances</SelectItem>
                  <SelectItem value={SecurityLevel.PUBLIC}>Public</SelectItem>
                  <SelectItem value={SecurityLevel.RESTRICTED}>Restricted</SelectItem>
                  <SelectItem value={SecurityLevel.CONFIDENTIAL}>Confidential</SelectItem>
                  <SelectItem value={SecurityLevel.SECRET}>Secret</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.is_active?.toString() || ''} onValueChange={(value) => setFilters({ ...filters, is_active: value === '' ? undefined : value === 'true' })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setFilters({ search: '' })}>
                  Clear
                </Button>
                <Button variant="outline" onClick={fetchUsers}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Users</CardTitle>
              <div className="flex space-x-2">
                <PermissionGate permissions={[Permission.USER_READ]}>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </PermissionGate>
                <PermissionGate permissions={[Permission.USER_CREATE]}>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Clearance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge className={getClearanceColor(user.security_clearance)}>
                          {user.security_clearance.charAt(0).toUpperCase() + user.security_clearance.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {!user.email_verified && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" title="Email not verified" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_login ? (
                          <span className="text-sm text-gray-500">
                            {user.last_login.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
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
                              setSelectedUser(user)
                              setShowEditDialog(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, !user.is_active)}>
                              {user.is_active ? (
                                <><EyeOff className="h-4 w-4 mr-2" />Deactivate</>
                              ) : (
                                <><Eye className="h-4 w-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <PermissionGate permissions={[Permission.USER_DELETE]}>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">
                  {filters.search || filters.role || filters.department || filters.security_clearance || filters.is_active !== undefined
                    ? 'Try adjusting your search criteria.'
                    : 'Get started by creating your first user.'}
                </p>
                <PermissionGate permissions={[Permission.USER_CREATE]}>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </PermissionGate>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog 
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={selectedUser}
          onSubmit={(updates) => handleUpdateUser(selectedUser.id, updates)}
        />
      )}

      {/* Delete User Dialog */}
      {selectedUser && (
        <DeleteUserDialog 
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          user={selectedUser}
          onConfirm={() => handleDeleteUser(selectedUser.id)}
        />
      )}
    </div>
  )
}

// Create User Dialog Component
interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userData: Partial<User>) => void
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: UserRole.CANDIDATE,
    department: '',
    security_clearance: SecurityLevel.PUBLIC
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: UserRole.CANDIDATE,
      department: '',
      security_clearance: SecurityLevel.PUBLIC
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive an email with login instructions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                  <SelectItem value={UserRole.SELECTOR}>Selector</SelectItem>
                  <SelectItem value={UserRole.CANDIDATE}>Candidate</SelectItem>
                  <SelectItem value={UserRole.OBSERVER}>Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clearance" className="text-right">
                Clearance
              </Label>
              <Select value={formData.security_clearance} onValueChange={(value) => setFormData({ ...formData, security_clearance: value as SecurityLevel })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SecurityLevel.PUBLIC}>Public</SelectItem>
                  <SelectItem value={SecurityLevel.RESTRICTED}>Restricted</SelectItem>
                  <SelectItem value={SecurityLevel.CONFIDENTIAL}>Confidential</SelectItem>
                  <SelectItem value={SecurityLevel.SECRET}>Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit User Dialog Component
interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSubmit: (updates: Partial<User>) => void
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, onOpenChange, user, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    department: user.department,
    security_clearance: user.security_clearance
  })

  useEffect(() => {
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      security_clearance: user.security_clearance
    })
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Username
              </Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="edit-full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                  <SelectItem value={UserRole.SELECTOR}>Selector</SelectItem>
                  <SelectItem value={UserRole.CANDIDATE}>Candidate</SelectItem>
                  <SelectItem value={UserRole.OBSERVER}>Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">
                Department
              </Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-clearance" className="text-right">
                Clearance
              </Label>
              <Select value={formData.security_clearance} onValueChange={(value) => setFormData({ ...formData, security_clearance: value as SecurityLevel })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SecurityLevel.PUBLIC}>Public</SelectItem>
                  <SelectItem value={SecurityLevel.RESTRICTED}>Restricted</SelectItem>
                  <SelectItem value={SecurityLevel.CONFIDENTIAL}>Confidential</SelectItem>
                  <SelectItem value={SecurityLevel.SECRET}>Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete User Dialog Component
interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onConfirm: () => void
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ open, onOpenChange, user, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900">{user.full_name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-sm text-gray-500">{user.role} • {user.department}</div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserManagement