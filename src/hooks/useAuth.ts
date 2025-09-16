import { useState, useEffect, createContext, useContext } from 'react';
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'selector' | 'observer';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return mock data for development
    return useMockAuth();
  }
  return context;
};

// Mock authentication hook for development
const useMockAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and check for existing session
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Failed to parse saved user:', error);
        }
      } else {
        // Set a default mock user for development
        const mockUser: User = {
          id: 'user_123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'administrator', // Change this to test different roles
          status: 'active',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user based on email
      let role: User['role'] = 'candidate';
      if (email.includes('admin')) role = 'administrator';
      else if (email.includes('selector')) role = 'selector';
      else if (email.includes('observer')) role = 'observer';
      
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email,
        role,
        status: 'active',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', `mock_token_${Date.now()}`);
      
      toast.success(`Welcome back, ${mockUser.name}!`);
    } catch (error: any) {
      toast.error(`Login failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('auth_token');
    toast.info('You have been logged out');
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', `mock_token_${Date.now()}`);
      
      toast.success(`Account created successfully! Welcome, ${mockUser.name}!`);
    } catch (error: any) {
      toast.error(`Registration failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser: User = {
        ...user,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      setUser(updatedUser);
      localStorage.setItem('mock_user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(`Profile update failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!user
  };
};

// Helper function to get current user role
export const useUserRole = () => {
  const { user } = useAuth();
  return user?.role || null;
};

// Helper function to check if user has specific role
export const useHasRole = (role: User['role']) => {
  const { user } = useAuth();
  return user?.role === role;
};

// Helper function to check if user has any of the specified roles
export const useHasAnyRole = (roles: User['role'][]) => {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
};

// Helper function to get user permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  if (!user) return [];
  
  const permissions: string[] = [];
  
  switch (user.role) {
    case 'administrator':
      permissions.push(
        'manage_users',
        'manage_interviews',
        'view_analytics',
        'system_settings',
        'manage_roles',
        'export_data'
      );
      break;
    case 'selector':
      permissions.push(
        'conduct_interviews',
        'evaluate_candidates',
        'manage_questions',
        'view_candidate_profiles',
        'generate_reports'
      );
      break;
    case 'candidate':
      permissions.push(
        'join_interviews',
        'view_feedback',
        'update_profile',
        'practice_interviews'
      );
      break;
    case 'observer':
      permissions.push(
        'observe_interviews',
        'view_recordings',
        'add_notes',
        'view_analytics'
      );
      break;
  }
  
  return permissions;
};

// Helper function to check if user has specific permission
export const useHasPermission = (permission: string) => {
  const permissions = usePermissions();
  return permissions.includes(permission);
};