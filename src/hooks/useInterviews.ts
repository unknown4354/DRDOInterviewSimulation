import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Interview {
  id: string;
  title: string;
  position: string;
  company?: string;
  candidateId?: string;
  candidateName?: string;
  selectors?: string[];
  observers?: string[];
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  roomId?: string;
  overallScore?: number;
  feedback?: string;
  evaluationStatus?: 'pending' | 'in_progress' | 'completed';
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CreateInterviewData {
  title: string;
  position: string;
  company?: string;
  candidateId?: string;
  selectors?: string[];
  observers?: string[];
  scheduledAt: string;
  duration: number;
}

interface UpdateInterviewData {
  title?: string;
  position?: string;
  status?: Interview['status'];
  overallScore?: number;
  feedback?: string;
  evaluationStatus?: Interview['evaluationStatus'];
}

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockInterviews: Interview[] = [
    {
      id: 'int_001',
      title: 'Senior Software Engineer Interview',
      position: 'Senior Software Engineer',
      company: 'DRDO Labs',
      candidateId: 'user_candidate_1',
      candidateName: 'John Doe',
      selectors: ['user_selector_1', 'user_selector_2'],
      observers: ['user_observer_1'],
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      duration: 60,
      status: 'scheduled',
      roomId: 'room_001',
      evaluationStatus: 'pending',
      createdBy: 'user_admin_1',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'int_002',
      title: 'Data Scientist Position',
      position: 'Data Scientist',
      company: 'DRDO Research',
      candidateId: 'user_candidate_2',
      candidateName: 'Jane Smith',
      selectors: ['user_selector_1'],
      observers: ['user_observer_1', 'user_observer_2'],
      scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      duration: 45,
      status: 'active',
      roomId: 'room_002',
      evaluationStatus: 'in_progress',
      createdBy: 'user_selector_1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'int_003',
      title: 'Cybersecurity Specialist Interview',
      position: 'Cybersecurity Specialist',
      company: 'DRDO Security',
      candidateId: 'user_candidate_3',
      candidateName: 'Mike Johnson',
      selectors: ['user_selector_2', 'user_selector_3'],
      observers: ['user_observer_1'],
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      duration: 90,
      status: 'completed',
      roomId: 'room_003',
      overallScore: 8.5,
      feedback: 'Excellent technical knowledge and communication skills. Strong candidate.',
      evaluationStatus: 'completed',
      createdBy: 'user_admin_1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 'int_004',
      title: 'AI Research Engineer',
      position: 'AI Research Engineer',
      company: 'DRDO AI Lab',
      candidateId: 'user_candidate_4',
      candidateName: 'Sarah Wilson',
      selectors: ['user_selector_1', 'user_selector_3'],
      observers: ['user_observer_2'],
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 75,
      status: 'scheduled',
      roomId: 'room_004',
      evaluationStatus: 'pending',
      createdBy: 'user_selector_3',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'int_005',
      title: 'Systems Administrator Role',
      position: 'Systems Administrator',
      company: 'DRDO IT',
      candidateId: 'user_candidate_5',
      candidateName: 'David Brown',
      selectors: ['user_selector_2'],
      observers: [],
      scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      duration: 60,
      status: 'completed',
      roomId: 'room_005',
      overallScore: 7.2,
      feedback: 'Good technical skills, needs improvement in communication.',
      evaluationStatus: 'completed',
      createdBy: 'user_selector_2',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    }
  ];

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load from localStorage or use mock data
      const saved = localStorage.getItem('mock_interviews');
      if (saved) {
        try {
          setInterviews(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse saved interviews:', error);
          setInterviews(mockInterviews);
          localStorage.setItem('mock_interviews', JSON.stringify(mockInterviews));
        }
      } else {
        setInterviews(mockInterviews);
        localStorage.setItem('mock_interviews', JSON.stringify(mockInterviews));
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to fetch interviews: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInterview = useCallback(async (data: CreateInterviewData): Promise<Interview> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newInterview: Interview = {
        id: `int_${Date.now()}`,
        ...data,
        status: 'scheduled',
        evaluationStatus: 'pending',
        createdBy: 'current_user', // Would come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const currentInterviews = interviews || [];
      const updatedInterviews = [...currentInterviews, newInterview];
      
      setInterviews(updatedInterviews);
      localStorage.setItem('mock_interviews', JSON.stringify(updatedInterviews));
      
      toast.success('Interview created successfully!');
      return newInterview;
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to create interview: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviews]);

  const updateInterview = useCallback(async (id: string, data: UpdateInterviewData): Promise<Interview> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentInterviews = interviews || [];
      const interviewIndex = currentInterviews.findIndex(i => i.id === id);
      
      if (interviewIndex === -1) {
        throw new Error('Interview not found');
      }
      
      const updatedInterview: Interview = {
        ...currentInterviews[interviewIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      const updatedInterviews = [...currentInterviews];
      updatedInterviews[interviewIndex] = updatedInterview;
      
      setInterviews(updatedInterviews);
      localStorage.setItem('mock_interviews', JSON.stringify(updatedInterviews));
      
      toast.success('Interview updated successfully!');
      return updatedInterview;
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to update interview: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviews]);

  const deleteInterview = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const currentInterviews = interviews || [];
      const updatedInterviews = currentInterviews.filter(i => i.id !== id);
      
      setInterviews(updatedInterviews);
      localStorage.setItem('mock_interviews', JSON.stringify(updatedInterviews));
      
      toast.success('Interview deleted successfully!');
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to delete interview: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [interviews]);

  const getInterview = useCallback((id: string): Interview | null => {
    return interviews?.find(i => i.id === id) || null;
  }, [interviews]);

  const getInterviewsByStatus = useCallback((status: Interview['status']): Interview[] => {
    return interviews?.filter(i => i.status === status) || [];
  }, [interviews]);

  const getInterviewsByUser = useCallback((userId: string, role: 'candidate' | 'selector' | 'observer'): Interview[] => {
    if (!interviews) return [];
    
    switch (role) {
      case 'candidate':
        return interviews.filter(i => i.candidateId === userId);
      case 'selector':
        return interviews.filter(i => i.selectors?.includes(userId) || i.createdBy === userId);
      case 'observer':
        return interviews.filter(i => i.observers?.includes(userId));
      default:
        return [];
    }
  }, [interviews]);

  const joinInterview = useCallback(async (id: string): Promise<string> => {
    const interview = getInterview(id);
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    if (interview.status !== 'scheduled' && interview.status !== 'active') {
      throw new Error('Interview is not available to join');
    }
    
    // Update status to active if it was scheduled
    if (interview.status === 'scheduled') {
      await updateInterview(id, { status: 'active' });
    }
    
    return interview.roomId || `room_${id}`;
  }, [getInterview, updateInterview]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return {
    interviews,
    loading,
    error,
    fetchInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
    getInterview,
    getInterviewsByStatus,
    getInterviewsByUser,
    joinInterview
  };
};

// Helper hooks
export const useInterview = (id: string) => {
  const { getInterview } = useInterviews();
  return getInterview(id);
};

export const useUserInterviews = (userId: string, role: 'candidate' | 'selector' | 'observer') => {
  const { getInterviewsByUser } = useInterviews();
  return getInterviewsByUser(userId, role);
};