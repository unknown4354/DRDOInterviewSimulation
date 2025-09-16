import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface QuestionEvaluation {
  id: string;
  relevance_score: number;
  difficulty_score: number;
  clarity_score: number;
  bias_score: number;
  overall_score: number;
  feedback: string;
  suggestions: string[];
}

interface AnswerEvaluation {
  id: string;
  semantic_relevance: number;
  technical_accuracy: number;
  communication_quality: number;
  depth_of_understanding: number;
  overall_score: number;
  strengths: string[];
  improvement_areas: string[];
  factual_errors: any;
}

interface EmotionAnalysis {
  id: string;
  confidence: number;
  stress_level: number;
  engagement: number;
  dominant_emotion: string;
  facial_expressions: any;
  voice_indicators: any;
  body_language: any;
}

interface BiasReport {
  id: string;
  bias_type: string;
  severity_score: number;
  description: string;
  affected_demographics: any;
  recommendations: string[];
  evidence_points: any;
}

interface TranslationResult {
  id: string;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
  confidence_score: number;
}

interface GeneratedQuestions {
  questions: string[];
  reasoning: string[];
}

interface AIInsights {
  question_evaluations: QuestionEvaluation[];
  answer_evaluations: AnswerEvaluation[];
  emotion_analysis: EmotionAnalysis[];
  bias_reports: BiasReport[];
  overall_performance: any;
  recommendations: string[];
}

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  const apiGet = useCallback(async (endpoint: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  // Evaluate interview question
  const evaluateQuestion = useCallback(async (
    interviewId: string,
    questionText: string,
    context?: {
      job_requirements?: any;
      candidate_profile?: any;
      previous_questions?: string[];
    }
  ): Promise<QuestionEvaluation> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/evaluate/question', {
        interview_id: interviewId,
        question_text: questionText,
        context
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to evaluate question');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Question evaluation failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Evaluate candidate answer
  const evaluateAnswer = useCallback(async (
    interviewId: string,
    questionId: string,
    answerText: string,
    context?: {
      expected_answer_points?: string[];
      job_requirements?: any;
      candidate_profile?: any;
    }
  ): Promise<AnswerEvaluation> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/evaluate/answer', {
        interview_id: interviewId,
        question_id: questionId,
        answer_text: answerText,
        context
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to evaluate answer');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Answer evaluation failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Analyze emotion
  const analyzeEmotion = useCallback(async (
    interviewId: string,
    userId: string,
    analysisData: {
      timestamp: Date;
      facial_expressions?: any;
      voice_indicators?: any;
      body_language?: any;
    }
  ): Promise<EmotionAnalysis> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/analyze/emotion', {
        interview_id: interviewId,
        user_id: userId,
        analysis_data: analysisData
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to analyze emotion');
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Emotion analysis failed:', error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Detect bias
  const detectBias = useCallback(async (
    interviewId: string,
    analysisType: 'question' | 'answer' | 'overall',
    content: string
  ): Promise<BiasReport[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/detect/bias', {
        interview_id: interviewId,
        analysis_type: analysisType,
        content
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to detect bias');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Bias detection failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Translate content
  const translateContent = useCallback(async (
    interviewId: string,
    sourceLanguage: string,
    targetLanguage: string,
    originalText: string,
    domainSpecific: boolean = false
  ): Promise<TranslationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/translate', {
        interview_id: interviewId,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        original_text: originalText,
        domain_specific: domainSpecific
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to translate content');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Translation failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Generate adaptive questions
  const generateQuestions = useCallback(async (
    interviewId: string,
    jobRequirements: any,
    candidateProfile?: any,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate',
    questionCount: number = 3,
    focusAreas: string[] = []
  ): Promise<GeneratedQuestions> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall('/generate/questions', {
        interview_id: interviewId,
        job_requirements: jobRequirements,
        candidate_profile: candidateProfile,
        difficulty_level: difficultyLevel,
        question_count: questionCount,
        focus_areas: focusAreas
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate questions');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Question generation failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Get comprehensive AI insights
  const getInterviewInsights = useCallback(async (interviewId: string): Promise<AIInsights> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiGet(`/insights/${interviewId}`);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get insights');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to get insights: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiGet]);

  // Get question evaluations
  const getQuestionEvaluations = useCallback(async (interviewId: string): Promise<QuestionEvaluation[]> => {
    try {
      const response = await apiGet(`/evaluations/questions/${interviewId}`);
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Failed to get question evaluations:', error.message);
      return [];
    }
  }, [apiGet]);

  // Get answer evaluations
  const getAnswerEvaluations = useCallback(async (interviewId: string): Promise<AnswerEvaluation[]> => {
    try {
      const response = await apiGet(`/evaluations/answers/${interviewId}`);
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Failed to get answer evaluations:', error.message);
      return [];
    }
  }, [apiGet]);

  // Get emotion analysis
  const getEmotionAnalysis = useCallback(async (interviewId: string, userId?: string): Promise<EmotionAnalysis[]> => {
    try {
      const endpoint = userId 
        ? `/analysis/emotion/${interviewId}?user_id=${userId}`
        : `/analysis/emotion/${interviewId}`;
      const response = await apiGet(endpoint);
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Failed to get emotion analysis:', error.message);
      return [];
    }
  }, [apiGet]);

  // Get bias reports
  const getBiasReports = useCallback(async (interviewId: string): Promise<BiasReport[]> => {
    try {
      const response = await apiGet(`/reports/bias/${interviewId}`);
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Failed to get bias reports:', error.message);
      return [];
    }
  }, [apiGet]);

  // Get translation logs
  const getTranslationLogs = useCallback(async (interviewId: string): Promise<TranslationResult[]> => {
    try {
      const response = await apiGet(`/translations/${interviewId}`);
      return response.success ? response.data : [];
    } catch (error: any) {
      console.error('Failed to get translation logs:', error.message);
      return [];
    }
  }, [apiGet]);

  // Resolve bias report
  const resolveBiasReport = useCallback(async (reportId: string, resolution: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiCall(`/reports/bias/${reportId}/resolve`, {
        resolution
      });

      if (response.success) {
        toast.success('Bias report resolved successfully');
      } else {
        throw new Error(response.message || 'Failed to resolve bias report');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(`Failed to resolve bias report: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiCall]);

  // Get AI model status
  const getModelStatus = useCallback(async () => {
    try {
      const response = await apiGet('/models/status');
      return response.success ? response.data : null;
    } catch (error: any) {
      console.error('Failed to get model status:', error.message);
      return null;
    }
  }, [apiGet]);

  // Real-time AI feedback for ongoing interviews
  const startRealTimeAnalysis = useCallback(async (interviewId: string) => {
    // This would typically set up a WebSocket connection for real-time AI feedback
    console.log('Starting real-time AI analysis for interview:', interviewId);
    toast.info('Real-time AI analysis started');
  }, []);

  const stopRealTimeAnalysis = useCallback(async (interviewId: string) => {
    // This would stop the real-time analysis
    console.log('Stopping real-time AI analysis for interview:', interviewId);
    toast.info('Real-time AI analysis stopped');
  }, []);

  return {
    isProcessing,
    error,
    evaluateQuestion,
    evaluateAnswer,
    analyzeEmotion,
    detectBias,
    translateContent,
    generateQuestions,
    getInterviewInsights,
    getQuestionEvaluations,
    getAnswerEvaluations,
    getEmotionAnalysis,
    getBiasReports,
    getTranslationLogs,
    resolveBiasReport,
    getModelStatus,
    startRealTimeAnalysis,
    stopRealTimeAnalysis
  };
};