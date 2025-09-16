import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'administrator' | 'selector' | 'candidate' | 'observer';
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  department?: string;
  phoneNumber?: string;
  permissions?: string[];
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  department?: string;
  phoneNumber?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: User['role'];
  status?: User['status'];
  department?: string;
  phoneNumber?: string;
  permissions?: string[];
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockUsers: User[] = [
    {
      id: 'user_admin_1',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@drdo.gov.in',
      role: 'administrator',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      department: 'Administration',
      phoneNumber: '+91-9876543210',
      permissions: ['manage_users', 'manage_interviews', 'view_analytics', 'system_settings']
    },
    {
      id: 'user_selector_1',
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@drdo.gov.in',
      role: 'selector',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      department: 'Computer Science',
      phoneNumber: '+91-9876543211',
      permissions: ['conduct_interviews', 'evaluate_candidates', 'manage_questions']
    },
    {
      id: 'user_selector_2',
      name: 'Dr. Amit Patel',
      email: 'amit.patel@drdo.gov.in',
      role: 'selector',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      department: 'Cybersecurity',
      phoneNumber: '+91-9876543212',
      permissions: ['conduct_interviews', 'evaluate_candidates', 'manage_questions']
    },
    {
      id: 'user_selector_3',
      name: 'Dr. Sunita Reddy',
      email: 'sunita.reddy@drdo.gov.in',
      role: 'selector',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      department: 'AI Research',
      phoneNumber: '+91-9876543213',
      permissions: ['conduct_interviews', 'evaluate_candidates', 'manage_questions']
    },
    {
      id: 'user_candidate_1',
      name: 'John Doe',
      email: 'john.doe@email.com',
      role: 'candidate',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543214',
      permissions: ['join_interviews', 'view_feedback', 'update_profile']
    },
    {
      id: 'user_candidate_2',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      role: 'candidate',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543215',
      permissions: ['join_interviews', 'view_feedback', 'update_profile']
    },
    {
      id: 'user_candidate_3',
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      role: 'candidate',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543216',
      permissions: ['join_interviews', 'view_feedback', 'update_profile']
    },
    {
      id: 'user_candidate_4',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      role: 'candidate',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543217',
      permissions: ['join_interviews', 'view_feedback', 'update_profile']
    },
    {
      id: 'user_candidate_5',
      name: 'David Brown',
      email: 'david.brown@email.com',
      role: 'candidate',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543218',
      permissions: ['join_interviews', 'view_feedback', 'update_profile']
    },
    {
      id: 'user_observer_1',
      name: 'Dr. Meera Gupta',
      email: 'meera.gupta@drdo.gov.in',
      role: 'observer',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      department: 'HR',
      phoneNumber: '+91-9876543219',
      permissions: ['observe_interviews', 'view_recordings', 'add_notes']
    },
    {
      id: 'user_observer_2',
      name: 'Col. Vikram Singh',
      email: 'vikram.singh@drdo.gov.in',
      role: 'observer',
      status: 'active',
      lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      department: 'Security',
      phoneNumber: '+91-9876543220',
      permissions: ['observe_interviews', 'view_recordings', 'add_notes']
    },
    {
      id: 'user_inactive_1',
      name: 'Test User',
      email: 'test.user@email.com',
      role: 'candidate',
      status: 'inactive',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      phoneNumber: '+91-9876543221',
      permissions: ['join_interviews', 'view_feedback']
    }
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Load from localStorage or use mock data
      const saved = localStorage.getItem('mock_users');
      if (saved) {
        try {
          setUsers(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse saved users:', error);
          setUsers(mockUsers);
          localStorage.setItem('mock_users', JSON.stringify(mockUsers));
        }
      } else {
        setUsers(mockUsers);
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to fetch users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Check if email already exists
      const currentUsers = users || [];
      if (currentUsers.some(u => u.email === data.email)) {
        throw new Error('Email already exists');
      }
      
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        status: 'active',
        department: data.department,
        phoneNumber: data.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: getDefaultPermissions(data.role)
      };
      
      const updatedUsers = [...currentUsers, newUser];
      
      setUsers(updatedUsers);
      localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
      
      toast.success('User created successfully!');
      return newUser;
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to create user: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [users]);

  const updateUser = useCallback(async (id: string, data: UpdateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentUsers = users || [];
      const userIndex = currentUsers.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Check if email already exists (if email is being updated)
      if (data.email && data.email !== currentUsers[userIndex].email) {
        if (currentUsers.some(u => u.email === data.email && u.id !== id)) {
          throw new Error('Email already exists');
        }
      }
      
      const updatedUser: User = {
        ...currentUsers[userIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Update permissions if role changed
      if (data.role && data.role !== currentUsers[userIndex].role) {
        updatedUser.permissions = getDefaultPermissions(data.role);
      }
      
      const updatedUsers = [...currentUsers];
      updatedUsers[userIndex] = updatedUser;
      
      setUsers(updatedUsers);
      localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
      
      toast.success('User updated successfully!');
      return updatedUser;
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to update user: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [users]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const currentUsers = users || [];
      const updatedUsers = currentUsers.filter(u => u.id !== id);
      
      setUsers(updatedUsers);
      localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
      
      toast.success('User deleted successfully!');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to delete user: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [users]);

  const getUser = useCallback((id: string): User | null => {
    return users?.find(u => u.id === id) || null;
  }, [users]);

  const getUsersByRole = useCallback((role: User['role']): User[] => {
    return users?.filter(u => u.role === role) || [];
  }, [users]);

  const getUsersByStatus = useCallback((status: User['status']): User[] => {
    return users?.filter(u => u.status === status) || [];
  }, [users]);

  const searchUsers = useCallback((query: string): User[] => {
    if (!users || !query.trim()) return users || [];
    
    const lowercaseQuery = query.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.role.toLowerCase().includes(lowercaseQuery) ||
      (user.department && user.department.toLowerCase().includes(lowercaseQuery))
    );
  }, [users]);

  const activateUser = useCallback(async (id: string): Promise<void> => {
    await updateUser(id, { status: 'active' });
  }, [updateUser]);

  const deactivateUser = useCallback(async (id: string): Promise<void> => {
    await updateUser(id, { status: 'inactive' });
  }, [updateUser]);

  const suspendUser = useCallback(async (id: string): Promise<void> => {
    await updateUser(id, { status: 'suspended' });
  }, [updateUser]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    getUsersByRole,
    getUsersByStatus,
    searchUsers,
    activateUser,
    deactivateUser,
    suspendUser
  };
};

// Helper function to get default permissions based on role
const getDefaultPermissions = (role: User['role']): string[] => {
  switch (role) {
    case 'administrator':
      return [
        'manage_users',
        'manage_interviews',
        'view_analytics',
        'system_settings',
        'manage_roles',
        'export_data'
      ];
    case 'selector':
      return [
        'conduct_interviews',
        'evaluate_candidates',
        'manage_questions',
        'view_candidate_profiles',
        'generate_reports'
      ];
    case 'candidate':
      return [
        'join_interviews',
        'view_feedback',
        'update_profile',
        'practice_interviews'
      ];
    case 'observer':
      return [
        'observe_interviews',
        'view_recordings',
        'add_notes',
        'view_analytics'
      ];
    default:
      return [];
  }
};

// Helper hooks
export const useUser = (id: string) => {
  const { getUser } = useUsers();
  return getUser(id);
};

export const useUsersByRole = (role: User['role']) => {
  const { getUsersByRole } = useUsers();
  return getUsersByRole(role);
};