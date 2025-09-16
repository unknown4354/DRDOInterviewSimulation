import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import InterviewService from '../services/interviewService';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import {
  CreateInterviewRequest,
  UpdateInterviewRequest,
  AddParticipantRequest,
  InterviewStatus,
  InterviewType,
  ParticipantRole,
  PaginationParams
} from '../../shared/types';

const router = express.Router();
const interviewService = new InterviewService();

// Rate limiting for interview operations
const interviewCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 interview creation requests per windowMs
  message: 'Too many interview creation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const interviewUpdateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 interview update requests per windowMs
  message: 'Too many interview update attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const interviewJoinLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 join attempts per windowMs
  message: 'Too many interview join attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateCreateInterview = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('type')
    .isIn(['technical', 'behavioral', 'panel', 'one_on_one', 'group', 'assessment'])
    .withMessage('Invalid interview type'),
  body('scheduled_time')
    .isISO8601()
    .toDate()
    .withMessage('Valid scheduled time is required'),
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('evaluation_criteria')
    .isObject()
    .withMessage('Evaluation criteria must be an object'),
  body('question_categories')
    .optional()
    .isArray()
    .withMessage('Question categories must be an array'),
  body('settings')
    .isObject()
    .withMessage('Settings must be an object'),
  body('recording_enabled')
    .optional()
    .isBoolean()
    .withMessage('Recording enabled must be a boolean'),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array')
];

const validateUpdateInterview = [
  param('id')
    .isUUID()
    .withMessage('Invalid interview ID format'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('scheduled_time')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid scheduled time is required'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'technical_issues', 'postponed'])
    .withMessage('Invalid status'),
  body('evaluation_criteria')
    .optional()
    .isObject()
    .withMessage('Evaluation criteria must be an object'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  body('results')
    .optional()
    .isObject()
    .withMessage('Results must be an object')
];

const validateGetInterviews = [
  query('status')
    .optional()
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'technical_issues', 'postponed'])
    .withMessage('Invalid status filter'),
  query('type')
    .optional()
    .isIn(['technical', 'behavioral', 'panel', 'one_on_one', 'group', 'assessment'])
    .withMessage('Invalid type filter'),
  query('created_by')
    .optional()
    .isUUID()
    .withMessage('Invalid created_by filter'),
  query('participant_id')
    .optional()
    .isUUID()
    .withMessage('Invalid participant_id filter'),
  query('date_from')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date_from format'),
  query('date_to')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid date_to format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be 1-100 characters')
];

const validateAddParticipant = [
  param('id')
    .isUUID()
    .withMessage('Invalid interview ID format'),
  body('user_id')
    .isUUID()
    .withMessage('Valid user ID is required'),
  body('role')
    .isIn(['interviewer', 'candidate', 'observer', 'technical_support'])
    .withMessage('Invalid participant role'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object')
];

const validateInterviewAction = [
  param('id')
    .isUUID()
    .withMessage('Invalid interview ID format')
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
 * @route   POST /api/interviews
 * @desc    Create a new interview
 * @access  Private (Selector, Administrator)
 */
router.post('/',
  interviewCreateLimit,
  authenticateToken,
  requirePermission('interviews:create'),
  validateCreateInterview,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewData: CreateInterviewRequest = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.createInterview(interviewData, createdBy);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to create interview'
      });
    }
  }
);

/**
 * @route   GET /api/interviews
 * @desc    Get interviews with filtering and pagination
 * @access  Private
 */
router.get('/',
  authenticateToken,
  validateGetInterviews,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        status: req.query.status as InterviewStatus,
        type: req.query.type as InterviewType,
        created_by: req.query.created_by as string,
        participant_id: req.query.participant_id as string,
        date_from: req.query.date_from as Date,
        date_to: req.query.date_to as Date,
        search: req.query.search as string
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const requesterId = req.user?.id;
      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.getInterviews(filters, pagination, requesterId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting interviews:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve interviews'
      });
    }
  }
);

/**
 * @route   GET /api/interviews/:id
 * @desc    Get interview by ID
 * @access  Private (Participants or users with view permissions)
 */
router.get('/:id',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid interview ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const requesterId = req.user?.id;

      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.getInterviewById(interviewId, requesterId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error getting interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve interview'
      });
    }
  }
);

/**
 * @route   PUT /api/interviews/:id
 * @desc    Update interview
 * @access  Private (Creator or users with manage permissions)
 */
router.put('/:id',
  interviewUpdateLimit,
  authenticateToken,
  validateUpdateInterview,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const updateData: UpdateInterviewRequest = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.updateInterview(interviewId, updateData, updatedBy);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error updating interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to update interview'
      });
    }
  }
);

/**
 * @route   POST /api/interviews/:id/participants
 * @desc    Add participant to interview
 * @access  Private (Creator or users with manage permissions)
 */
router.post('/:id/participants',
  authenticateToken,
  validateAddParticipant,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const participantData: AddParticipantRequest = req.body;
      const addedBy = req.user?.id;

      if (!addedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.addParticipant(interviewId, participantData, addedBy);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error adding participant:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to add participant'
      });
    }
  }
);

/**
 * @route   DELETE /api/interviews/:id/participants/:participantId
 * @desc    Remove participant from interview
 * @access  Private (Creator or users with manage permissions)
 */
router.delete('/:id/participants/:participantId',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid interview ID format'),
  param('participantId').isUUID().withMessage('Invalid participant ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const participantId = req.params.participantId;
      const removedBy = req.user?.id;

      if (!removedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.removeParticipant(interviewId, participantId, removedBy);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error removing participant:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to remove participant'
      });
    }
  }
);

/**
 * @route   POST /api/interviews/:id/start
 * @desc    Start interview session
 * @access  Private (Interviewer)
 */
router.post('/:id/start',
  authenticateToken,
  validateInterviewAction,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const startedBy = req.user?.id;

      if (!startedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.startInterview(interviewId, startedBy);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to start interview'
      });
    }
  }
);

/**
 * @route   POST /api/interviews/:id/end
 * @desc    End interview session
 * @access  Private (Interviewer with end permissions)
 */
router.post('/:id/end',
  authenticateToken,
  validateInterviewAction,
  body('results')
    .optional()
    .isObject()
    .withMessage('Results must be an object'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const endedBy = req.user?.id;
      const results = req.body.results;

      if (!endedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.endInterview(interviewId, endedBy, results);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error ending interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to end interview'
      });
    }
  }
);

/**
 * @route   POST /api/interviews/:id/join
 * @desc    Join interview as participant
 * @access  Private (Valid participants)
 */
router.post('/:id/join',
  interviewJoinLimit,
  authenticateToken,
  validateInterviewAction,
  body('device_info')
    .optional()
    .isObject()
    .withMessage('Device info must be an object'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const userId = req.user?.id;
      const deviceInfo = req.body.device_info;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await interviewService.joinInterview(interviewId, userId, deviceInfo);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error joining interview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to join interview'
      });
    }
  }
);

/**
 * @route   GET /api/interviews/:id/room
 * @desc    Get interview room details for WebRTC connection
 * @access  Private (Valid participants)
 */
router.get('/:id/room',
  authenticateToken,
  validateInterviewAction,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      // Get interview and validate participant access
      const interviewResult = await interviewService.getInterviewById(interviewId, userId);
      
      if (!interviewResult.success) {
        return res.status(404).json(interviewResult);
      }

      const interview = interviewResult.data;
      const participant = interview.participants?.find(p => p.user_id === userId);
      
      if (!participant) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You are not a participant in this interview'
        });
      }

      // Return room connection details
      res.json({
        success: true,
        data: {
          room_id: interview.room_id,
          interview_id: interview.id,
          participant_role: participant.role,
          permissions: participant.permissions,
          interview_status: interview.status,
          recording_enabled: interview.recording_enabled,
          settings: interview.settings
        },
        message: 'Room details retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting room details:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve room details'
      });
    }
  }
);

/**
 * @route   GET /api/interviews/my/upcoming
 * @desc    Get user's upcoming interviews
 * @access  Private
 */
router.get('/my/upcoming',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const filters = {
        participant_id: userId,
        status: 'scheduled' as InterviewStatus,
        date_from: new Date()
      };

      const pagination: PaginationParams = {
        page: 1,
        limit: 10
      };

      const result = await interviewService.getInterviews(filters, pagination, userId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting upcoming interviews:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve upcoming interviews'
      });
    }
  }
);

/**
 * @route   GET /api/interviews/my/history
 * @desc    Get user's interview history
 * @access  Private
 */
router.get('/my/history',
  authenticateToken,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const filters = {
        participant_id: userId,
        status: 'completed' as InterviewStatus
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await interviewService.getInterviews(filters, pagination, userId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting interview history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve interview history'
      });
    }
  }
);

/**
 * @route   GET /api/interviews/templates
 * @desc    Get interview templates
 * @access  Private
 */
router.get('/templates',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // This would typically be in a separate service, but for simplicity:
      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT id, name, description, type, duration, evaluation_criteria,
               question_categories, settings, tags, rating, usage_count
        FROM interview_templates 
        WHERE is_public = true OR created_by = $1
        ORDER BY usage_count DESC, rating DESC
      `, [req.user?.id]);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          ...row,
          evaluation_criteria: typeof row.evaluation_criteria === 'string' 
            ? JSON.parse(row.evaluation_criteria) 
            : row.evaluation_criteria,
          settings: typeof row.settings === 'string' 
            ? JSON.parse(row.settings) 
            : row.settings
        })),
        message: 'Interview templates retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting interview templates:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve interview templates'
      });
    }
  }
);

export default router;