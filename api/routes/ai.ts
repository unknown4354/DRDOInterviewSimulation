import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import AIService from '../services/aiService';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import {
  QuestionGenerationRequest,
  AIModelType,
  BiasType,
  Emotion
} from '../../shared/types';

const router = express.Router();
const aiService = new AIService();

// Rate limiting for AI operations
const aiEvaluationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 AI evaluation requests per windowMs
  message: 'Too many AI evaluation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiGenerationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 AI generation requests per windowMs
  message: 'Too many AI generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const aiAnalysisLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 AI analysis requests per windowMs
  message: 'Too many AI analysis requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateQuestionEvaluation = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('question_text')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Question text must be 10-2000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  body('context.job_requirements')
    .optional()
    .isObject()
    .withMessage('Job requirements must be an object'),
  body('context.candidate_profile')
    .optional()
    .isObject()
    .withMessage('Candidate profile must be an object'),
  body('context.previous_questions')
    .optional()
    .isArray()
    .withMessage('Previous questions must be an array')
];

const validateAnswerEvaluation = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('question_id')
    .isUUID()
    .withMessage('Valid question ID is required'),
  body('answer_text')
    .isLength({ min: 5, max: 5000 })
    .withMessage('Answer text must be 5-5000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

const validateEmotionAnalysis = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('user_id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('analysis_data')
    .isObject()
    .withMessage('Analysis data is required'),
  body('analysis_data.timestamp')
    .isISO8601()
    .toDate()
    .withMessage('Valid timestamp is required'),
  body('analysis_data.facial_expressions')
    .optional()
    .isObject()
    .withMessage('Facial expressions must be an object'),
  body('analysis_data.voice_indicators')
    .optional()
    .isObject()
    .withMessage('Voice indicators must be an object'),
  body('analysis_data.body_language')
    .optional()
    .isObject()
    .withMessage('Body language must be an object')
];

const validateBiasDetection = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('analysis_type')
    .isIn(['question', 'answer', 'overall'])
    .withMessage('Analysis type must be question, answer, or overall'),
  body('content')
    .isLength({ min: 5, max: 5000 })
    .withMessage('Content must be 5-5000 characters')
];

const validateTranslation = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('source_language')
    .isLength({ min: 2, max: 10 })
    .withMessage('Valid source language code is required'),
  body('target_language')
    .isLength({ min: 2, max: 10 })
    .withMessage('Valid target language code is required'),
  body('original_text')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Original text must be 1-5000 characters'),
  body('domain_specific')
    .optional()
    .isBoolean()
    .withMessage('Domain specific must be a boolean')
];

const validateQuestionGeneration = [
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('job_requirements')
    .isObject()
    .withMessage('Job requirements are required'),
  body('candidate_profile')
    .optional()
    .isObject()
    .withMessage('Candidate profile must be an object'),
  body('difficulty_level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty level'),
  body('question_count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Question count must be between 1 and 10'),
  body('focus_areas')
    .optional()
    .isArray()
    .withMessage('Focus areas must be an array')
];

// Error handler for validation
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      message: 'Please check your input and try again'
    });
  }
  next();
};

/**
 * @route   POST /api/ai/evaluate/question
 * @desc    Evaluate interview question quality and bias
 * @access  Private (Interviewer, Administrator)
 */
router.post('/evaluate/question',
  aiEvaluationLimit,
  authenticateToken,
  requirePermission('ai:evaluate'),
  validateQuestionEvaluation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, question_text, context } = req.body;

      const result = await aiService.evaluateQuestion(
        interview_id,
        question_text,
        context
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error evaluating question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to evaluate question'
      });
    }
  }
);

/**
 * @route   POST /api/ai/evaluate/answer
 * @desc    Evaluate interview answer quality and accuracy
 * @access  Private (Interviewer, Administrator)
 */
router.post('/evaluate/answer',
  aiEvaluationLimit,
  authenticateToken,
  requirePermission('ai:evaluate'),
  validateAnswerEvaluation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, question_id, answer_text, context } = req.body;

      const result = await aiService.evaluateAnswer(
        interview_id,
        question_id,
        answer_text,
        context
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error evaluating answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to evaluate answer'
      });
    }
  }
);

/**
 * @route   POST /api/ai/analyze/emotion
 * @desc    Analyze participant emotions during interview
 * @access  Private (Interviewer, Administrator)
 */
router.post('/analyze/emotion',
  aiAnalysisLimit,
  authenticateToken,
  requirePermission('ai:analyze'),
  validateEmotionAnalysis,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, user_id, analysis_data } = req.body;

      const result = await aiService.analyzeEmotion(
        interview_id,
        user_id,
        analysis_data
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing emotion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to analyze emotion'
      });
    }
  }
);

/**
 * @route   POST /api/ai/detect/bias
 * @desc    Detect bias in questions or answers
 * @access  Private (Interviewer, Administrator)
 */
router.post('/detect/bias',
  aiAnalysisLimit,
  authenticateToken,
  requirePermission('ai:analyze'),
  validateBiasDetection,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, analysis_type, content } = req.body;

      const result = await aiService.detectBias(
        interview_id,
        analysis_type,
        content
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error detecting bias:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to detect bias'
      });
    }
  }
);

/**
 * @route   POST /api/ai/translate
 * @desc    Translate text with domain-specific terminology
 * @access  Private
 */
router.post('/translate',
  aiAnalysisLimit,
  authenticateToken,
  validateTranslation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        interview_id,
        source_language,
        target_language,
        original_text,
        domain_specific
      } = req.body;

      const result = await aiService.translateText(
        interview_id,
        source_language,
        target_language,
        original_text,
        domain_specific
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error translating text:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to translate text'
      });
    }
  }
);

/**
 * @route   POST /api/ai/generate/questions
 * @desc    Generate adaptive interview questions
 * @access  Private (Interviewer, Administrator)
 */
router.post('/generate/questions',
  aiGenerationLimit,
  authenticateToken,
  requirePermission('ai:generate'),
  validateQuestionGeneration,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        interview_id,
        job_requirements,
        candidate_profile,
        difficulty_level,
        question_count,
        focus_areas
      } = req.body;

      const result = await aiService.generateQuestions(
        interview_id,
        job_requirements,
        candidate_profile,
        difficulty_level,
        question_count,
        focus_areas
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to generate questions'
      });
    }
  }
);

/**
 * @route   GET /api/ai/models
 * @desc    Get available AI models and their capabilities
 * @access  Private (Administrator)
 */
router.get('/models',
  authenticateToken,
  requireRole(['administrator']),
  async (req: Request, res: Response) => {
    try {
      const result = await aiService.getAvailableModels();
      res.json(result);
    } catch (error: any) {
      console.error('Error getting AI models:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve AI models'
      });
    }
  }
);

/**
 * @route   POST /api/ai/models/configure
 * @desc    Configure AI model settings
 * @access  Private (Administrator)
 */
router.post('/models/configure',
  authenticateToken,
  requireRole(['administrator']),
  body('model_type')
    .isIn(['question_evaluation', 'answer_evaluation', 'emotion_analysis', 'bias_detection', 'translation', 'question_generation'])
    .withMessage('Invalid model type'),
  body('model_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Model name is required'),
  body('configuration')
    .isObject()
    .withMessage('Configuration must be an object'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { model_type, model_name, configuration } = req.body;
      const configuredBy = req.user?.sub;

      if (!configuredBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await aiService.configureModel(
        model_type,
        model_name,
        configuration,
        configuredBy
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error configuring AI model:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to configure AI model'
      });
    }
  }
);

/**
 * @route   GET /api/ai/analytics/:interviewId
 * @desc    Get AI analytics for an interview
 * @access  Private (Participants or users with view permissions)
 */
router.get('/analytics/:interviewId',
  authenticateToken,
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;
      const requesterId = req.user?.sub;

      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await aiService.getInterviewAnalytics(
        interviewId,
        requesterId
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error getting AI analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve AI analytics'
      });
    }
  }
);

/**
 * @route   POST /api/ai/feedback/generate
 * @desc    Generate AI-powered feedback for candidates
 * @access  Private (Interviewer, Administrator)
 */
router.post('/feedback/generate',
  aiGenerationLimit,
  authenticateToken,
  requirePermission('ai:generate'),
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('candidate_id')
    .isUUID()
    .withMessage('Valid candidate ID is required'),
  body('feedback_type')
    .isIn(['constructive', 'detailed', 'summary'])
    .withMessage('Invalid feedback type'),
  body('include_suggestions')
    .optional()
    .isBoolean()
    .withMessage('Include suggestions must be a boolean'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        interview_id,
        candidate_id,
        feedback_type,
        include_suggestions
      } = req.body;

      const result = await aiService.generateFeedback(
        interview_id,
        candidate_id,
        feedback_type,
        include_suggestions
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error generating feedback:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to generate feedback'
      });
    }
  }
);

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health and model status
 * @access  Private (Administrator)
 */
router.get('/health',
  authenticateToken,
  requireRole(['administrator']),
  async (req: Request, res: Response) => {
    try {
      const result = await aiService.healthCheck();
      res.json(result);
    } catch (error: any) {
      console.error('Error checking AI health:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to check AI service health'
      });
    }
  }
);

/**
 * @route   POST /api/ai/batch/evaluate
 * @desc    Batch evaluate multiple questions or answers
 * @access  Private (Administrator)
 */
router.post('/batch/evaluate',
  authenticateToken,
  requireRole(['administrator']),
  body('interview_id')
    .isUUID()
    .withMessage('Valid interview ID is required'),
  body('evaluation_type')
    .isIn(['questions', 'answers'])
    .withMessage('Evaluation type must be questions or answers'),
  body('items')
    .isArray({ min: 1, max: 50 })
    .withMessage('Items array must contain 1-50 items'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, evaluation_type, items } = req.body;

      const result = await aiService.batchEvaluate(
        interview_id,
        evaluation_type,
        items
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error in batch evaluation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to perform batch evaluation'
      });
    }
  }
);

/**
 * @route   POST /api/ai/evaluate/question
 * @desc    Evaluate question quality and bias
 * @access  Private (Interviewer, Administrator)
 */
router.post('/evaluate/question',
  aiEvaluationLimit,
  authenticateToken,
  requirePermission('ai:evaluate'),
  validateQuestionEvaluation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, question_text, context } = req.body;

      const result = await aiService.evaluateQuestion(
        interview_id,
        question_text,
        context
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error evaluating question:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to evaluate question'
      });
    }
  }
);

/**
 * @route   POST /api/ai/evaluate/answer
 * @desc    Evaluate candidate's answer comprehensively
 * @access  Private (Interviewer, Administrator)
 */
router.post('/evaluate/answer',
  aiEvaluationLimit,
  authenticateToken,
  requirePermission('ai:evaluate'),
  validateAnswerEvaluation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, question_id, answer_text, context } = req.body;

      const result = await aiService.evaluateAnswer(
        interview_id,
        question_id,
        answer_text,
        context
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error evaluating answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to evaluate answer'
      });
    }
  }
);

/**
 * @route   POST /api/ai/analyze/emotion
 * @desc    Analyze candidate's emotional state and stress levels
 * @access  Private (Interviewer, Administrator)
 */
router.post('/analyze/emotion',
  aiAnalysisLimit,
  authenticateToken,
  requirePermission('ai:analyze'),
  validateEmotionAnalysis,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, user_id, analysis_data } = req.body;

      const result = await aiService.analyzeEmotion(
        interview_id,
        user_id,
        analysis_data
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing emotion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to analyze emotion'
      });
    }
  }
);

/**
 * @route   POST /api/ai/detect/bias
 * @desc    Detect bias in interview process
 * @access  Private (Interviewer, Administrator)
 */
router.post('/detect/bias',
  aiAnalysisLimit,
  authenticateToken,
  requirePermission('ai:analyze'),
  validateBiasDetection,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { interview_id, analysis_type, content } = req.body;

      const result = await aiService.detectBias(
        interview_id,
        analysis_type,
        content
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error detecting bias:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to detect bias'
      });
    }
  }
);

/**
 * @route   POST /api/ai/translate
 * @desc    Translate content for multilingual support
 * @access  Private
 */
router.post('/translate',
  aiAnalysisLimit,
  authenticateToken,
  validateTranslation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { 
        interview_id, 
        source_language, 
        target_language, 
        original_text, 
        domain_specific 
      } = req.body;

      const result = await aiService.translateContent(
        interview_id,
        source_language,
        target_language,
        original_text,
        domain_specific || false
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error translating content:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to translate content'
      });
    }
  }
);

/**
 * @route   POST /api/ai/generate/questions
 * @desc    Generate adaptive questions based on candidate performance
 * @access  Private (Interviewer, Administrator)
 */
router.post('/generate/questions',
  aiGenerationLimit,
  authenticateToken,
  requirePermission('ai:generate'),
  validateQuestionGeneration,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const questionRequest: QuestionGenerationRequest = {
        interview_id: req.body.interview_id,
        job_requirements: req.body.job_requirements,
        candidate_profile: req.body.candidate_profile,
        difficulty_level: req.body.difficulty_level || 'intermediate',
        question_count: req.body.question_count || 3,
        focus_areas: req.body.focus_areas || []
      };

      const result = await aiService.generateAdaptiveQuestions(questionRequest);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to generate questions'
      });
    }
  }
);

/**
 * @route   GET /api/ai/insights/:interviewId
 * @desc    Get comprehensive AI insights for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/insights/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const result = await aiService.getInterviewInsights(interviewId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting AI insights:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve AI insights'
      });
    }
  }
);

/**
 * @route   GET /api/ai/evaluations/questions/:interviewId
 * @desc    Get question evaluations for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/evaluations/questions/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT * FROM question_evaluations 
        WHERE interview_id = $1 
        ORDER BY evaluated_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          ...row,
          suggestions: row.suggestions || []
        })),
        message: 'Question evaluations retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting question evaluations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve question evaluations'
      });
    }
  }
);

/**
 * @route   GET /api/ai/evaluations/answers/:interviewId
 * @desc    Get answer evaluations for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/evaluations/answers/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT ae.*, qe.question_text
        FROM answer_evaluations ae
        LEFT JOIN question_evaluations qe ON ae.question_id = qe.id
        WHERE ae.interview_id = $1 
        ORDER BY ae.evaluated_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          ...row,
          strengths: row.strengths || [],
          improvement_areas: row.improvement_areas || [],
          factual_errors: typeof row.factual_errors === 'string' 
            ? JSON.parse(row.factual_errors) 
            : row.factual_errors
        })),
        message: 'Answer evaluations retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting answer evaluations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve answer evaluations'
      });
    }
  }
);

/**
 * @route   GET /api/ai/analysis/emotion/:interviewId
 * @desc    Get emotion analysis for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/analysis/emotion/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  query('user_id').optional().isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;
      const userId = req.query.user_id as string;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      let query = `
        SELECT ea.*, u.full_name as user_name
        FROM emotion_analysis ea
        LEFT JOIN users u ON ea.user_id = u.id
        WHERE ea.interview_id = $1
      `;
      
      const queryParams = [interviewId];
      
      if (userId) {
        query += ' AND ea.user_id = $2';
        queryParams.push(userId);
      }
      
      query += ' ORDER BY ea.timestamp DESC';
      
      const result = await pool.query(query, queryParams);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          ...row,
          facial_expressions: typeof row.facial_expressions === 'string' 
            ? JSON.parse(row.facial_expressions) 
            : row.facial_expressions,
          voice_indicators: typeof row.voice_indicators === 'string' 
            ? JSON.parse(row.voice_indicators) 
            : row.voice_indicators,
          body_language: typeof row.body_language === 'string' 
            ? JSON.parse(row.body_language) 
            : row.body_language
        })),
        message: 'Emotion analysis retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting emotion analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve emotion analysis'
      });
    }
  }
);

/**
 * @route   GET /api/ai/reports/bias/:interviewId
 * @desc    Get bias reports for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/reports/bias/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT * FROM bias_reports 
        WHERE interview_id = $1 
        ORDER BY severity_score DESC, detected_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          ...row,
          affected_demographics: typeof row.affected_demographics === 'string' 
            ? JSON.parse(row.affected_demographics) 
            : row.affected_demographics,
          recommendations: row.recommendations || [],
          evidence_points: typeof row.evidence_points === 'string' 
            ? JSON.parse(row.evidence_points) 
            : row.evidence_points
        })),
        message: 'Bias reports retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting bias reports:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve bias reports'
      });
    }
  }
);

/**
 * @route   GET /api/ai/translations/:interviewId
 * @desc    Get translation logs for an interview
 * @access  Private (Interviewer, Administrator)
 */
router.get('/translations/:interviewId',
  authenticateToken,
  requirePermission('ai:view'),
  param('interviewId').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT * FROM translation_logs 
        WHERE interview_id = $1 
        ORDER BY translated_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows,
        message: 'Translation logs retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting translation logs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve translation logs'
      });
    }
  }
);

/**
 * @route   POST /api/ai/reports/bias/:reportId/resolve
 * @desc    Mark bias report as resolved
 * @access  Private (Administrator)
 */
router.post('/reports/bias/:reportId/resolve',
  authenticateToken,
  requireRole('administrator'),
  param('reportId').isUUID().withMessage('Invalid report ID format'),
  body('resolution').isLength({ min: 10, max: 1000 }).withMessage('Resolution must be 10-1000 characters'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const reportId = req.params.reportId;
      const { resolution } = req.body;
      const resolvedBy = req.user?.id;

      if (!resolvedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        UPDATE bias_reports 
        SET resolved = true, 
            resolved_at = NOW(), 
            resolved_by = $2, 
            resolution = $3
        WHERE id = $1
        RETURNING *
      `, [reportId, resolvedBy, resolution]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Bias report not found',
          message: 'The specified bias report was not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Bias report resolved successfully'
      });
    } catch (error: any) {
      console.error('Error resolving bias report:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to resolve bias report'
      });
    }
  }
);

/**
 * @route   GET /api/ai/models/status
 * @desc    Get AI model status and versions
 * @access  Private (Administrator)
 */
router.get('/models/status',
  authenticateToken,
  requireRole('administrator'),
  async (req: Request, res: Response) => {
    try {
      // In production, this would check actual AI model status
      const modelStatus = {
        question_evaluator: {
          version: 'qe-v2.1.0',
          status: 'active',
          last_updated: new Date('2024-01-15'),
          accuracy: 0.94,
          response_time_ms: 850
        },
        answer_evaluator: {
          version: 'ae-v2.1.0',
          status: 'active',
          last_updated: new Date('2024-01-15'),
          accuracy: 0.91,
          response_time_ms: 1200
        },
        bias_detector: {
          version: 'bd-v1.5.0',
          status: 'active',
          last_updated: new Date('2024-01-10'),
          accuracy: 0.88,
          response_time_ms: 650
        },
        emotion_analyzer: {
          version: 'ea-v1.8.0',
          status: 'active',
          last_updated: new Date('2024-01-12'),
          accuracy: 0.86,
          response_time_ms: 450
        },
        question_generator: {
          version: 'qg-v2.0.0',
          status: 'active',
          last_updated: new Date('2024-01-14'),
          accuracy: 0.89,
          response_time_ms: 2100
        },
        translator: {
          version: 'tr-v1.3.0',
          status: 'active',
          last_updated: new Date('2024-01-08'),
          accuracy: 0.95,
          response_time_ms: 300
        }
      };

      res.json({
        success: true,
        data: modelStatus,
        message: 'AI model status retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting AI model status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve AI model status'
      });
    }
  }
);

export default router;