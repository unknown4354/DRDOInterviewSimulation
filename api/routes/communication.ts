import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import CommunicationService from '../services/communicationService';

const router = express.Router();

// Rate limiting for communication operations
const communicationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 communication requests per windowMs
  message: 'Too many communication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateRoomAccess = [
  param('roomId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid room ID is required')
];

const validateSendMessage = [
  body('room_id')
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid room ID is required'),
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be 1-2000 characters'),
  body('message_type')
    .optional()
    .isIn(['text', 'file', 'system', 'ai_feedback'])
    .withMessage('Invalid message type'),
  body('reply_to')
    .optional()
    .isUUID()
    .withMessage('Reply to must be a valid UUID')
];

const validateFileShare = [
  body('room_id')
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid room ID is required'),
  body('file_info')
    .isObject()
    .withMessage('File info is required'),
  body('file_info.name')
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be 1-255 characters'),
  body('file_info.size')
    .isInt({ min: 1, max: 10485760 }) // 10MB max
    .withMessage('File size must be between 1 byte and 10MB'),
  body('file_info.type')
    .isLength({ min: 1, max: 100 })
    .withMessage('File type is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

const validateRecordingControl = [
  body('room_id')
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid room ID is required'),
  body('recording_settings')
    .optional()
    .isObject()
    .withMessage('Recording settings must be an object')
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
 * @route   GET /api/communication/rooms
 * @desc    Get active communication rooms
 * @access  Private (Administrator)
 */
router.get('/rooms',
  communicationLimit,
  authenticateToken,
  requireRole('administrator'),
  async (req: Request, res: Response) => {
    try {
      const communicationService = req.app.get('communicationService') as CommunicationService;
      const activeRooms = communicationService.getActiveRooms();

      const roomsInfo = activeRooms.map(room => ({
        id: room.id,
        interview_id: room.interview_id,
        participant_count: room.participants.size,
        created_at: room.created_at,
        recording_active: !!room.recording,
        participants: Array.from(room.participants.values()).map(p => ({
          user_id: p.user_id,
          user_name: p.user_info?.name,
          joined_at: p.joined_at,
          connection_status: p.connection_status,
          media_state: p.media_state
        }))
      }));

      res.json({
        success: true,
        data: {
          rooms: roomsInfo,
          total_rooms: activeRooms.length,
          total_participants: communicationService.getParticipantCount()
        },
        message: 'Active rooms retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting active rooms:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve active rooms'
      });
    }
  }
);

/**
 * @route   GET /api/communication/rooms/:roomId
 * @desc    Get specific room details
 * @access  Private (Participants or Administrator)
 */
router.get('/rooms/:roomId',
  communicationLimit,
  authenticateToken,
  validateRoomAccess,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const roomId = req.params.roomId;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const communicationService = req.app.get('communicationService') as CommunicationService;
      const room = communicationService.getRoomById(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found',
          message: 'The specified room does not exist or is not active'
        });
      }

      // Check if user is participant or administrator
      const isParticipant = room.participants.has(userId);
      const isAdmin = req.user?.role === 'administrator';

      if (!isParticipant && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this room'
        });
      }

      const roomInfo = {
        id: room.id,
        interview_id: room.interview_id,
        participant_count: room.participants.size,
        created_at: room.created_at,
        recording_active: !!room.recording,
        participants: Array.from(room.participants.values()).map(p => ({
          user_id: p.user_id,
          user_name: p.user_info?.name,
          joined_at: p.joined_at,
          connection_status: p.connection_status,
          media_state: p.media_state,
          connection_quality: p.connection_quality
        })),
        recent_messages: room.chat_history.slice(-20), // Last 20 messages
        shared_files: room.shared_files.slice(-10) // Last 10 files
      };

      res.json({
        success: true,
        data: roomInfo,
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
 * @route   POST /api/communication/broadcast
 * @desc    Broadcast message to room (Admin only)
 * @access  Private (Administrator)
 */
router.post('/broadcast',
  communicationLimit,
  authenticateToken,
  requireRole('administrator'),
  body('room_id').isLength({ min: 1, max: 100 }).withMessage('Valid room ID is required'),
  body('event').isLength({ min: 1, max: 50 }).withMessage('Event name is required'),
  body('data').isObject().withMessage('Data must be an object'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { room_id, event, data } = req.body;

      const communicationService = req.app.get('communicationService') as CommunicationService;
      await communicationService.broadcastToRoom(room_id, event, data);

      res.json({
        success: true,
        message: 'Message broadcasted successfully'
      });
    } catch (error: any) {
      console.error('Error broadcasting message:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to broadcast message'
      });
    }
  }
);

/**
 * @route   POST /api/communication/send-to-user
 * @desc    Send message to specific user (Admin only)
 * @access  Private (Administrator)
 */
router.post('/send-to-user',
  communicationLimit,
  authenticateToken,
  requireRole('administrator'),
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('event').isLength({ min: 1, max: 50 }).withMessage('Event name is required'),
  body('data').isObject().withMessage('Data must be an object'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { user_id, event, data } = req.body;

      const communicationService = req.app.get('communicationService') as CommunicationService;
      await communicationService.sendToUser(user_id, event, data);

      res.json({
        success: true,
        message: 'Message sent to user successfully'
      });
    } catch (error: any) {
      console.error('Error sending message to user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to send message to user'
      });
    }
  }
);

/**
 * @route   GET /api/communication/chat/:interviewId
 * @desc    Get chat history for an interview
 * @access  Private (Participants or Administrator)
 */
router.get('/chat/:interviewId',
  communicationLimit,
  authenticateToken,
  param('interviewId').isUUID().withMessage('Valid interview ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      // Get total count
      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM chat_messages WHERE interview_id = $1',
        [interviewId]
      );
      const total = parseInt(countResult.rows[0].total);

      // Get paginated messages
      const messagesResult = await pool.query(`
        SELECT * FROM chat_messages 
        WHERE interview_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [interviewId, limit, offset]);

      const messages = messagesResult.rows.map((row: any) => ({
        ...row,
        reactions: typeof row.reactions === 'string' 
          ? JSON.parse(row.reactions) 
          : row.reactions,
        read_by: typeof row.read_by === 'string' 
          ? JSON.parse(row.read_by) 
          : row.read_by
      })).reverse(); // Reverse to show oldest first

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        message: 'Chat history retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve chat history'
      });
    }
  }
);

/**
 * @route   GET /api/communication/files/:interviewId
 * @desc    Get shared files for an interview
 * @access  Private (Participants or Administrator)
 */
router.get('/files/:interviewId',
  communicationLimit,
  authenticateToken,
  param('interviewId').isUUID().withMessage('Valid interview ID is required'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT fu.*, u.full_name as uploaded_by_name
        FROM file_uploads fu
        LEFT JOIN users u ON fu.uploaded_by = u.id
        WHERE fu.interview_id = $1 
        ORDER BY fu.created_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows,
        message: 'Shared files retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting shared files:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve shared files'
      });
    }
  }
);

/**
 * @route   GET /api/communication/recordings/:interviewId
 * @desc    Get recording sessions for an interview
 * @access  Private (Participants or Administrator)
 */
router.get('/recordings/:interviewId',
  communicationLimit,
  authenticateToken,
  param('interviewId').isUUID().withMessage('Valid interview ID is required'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const interviewId = req.params.interviewId;

      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT rs.*, u.full_name as started_by_name
        FROM recording_sessions rs
        LEFT JOIN users u ON rs.started_by = u.id
        WHERE rs.interview_id = $1 
        ORDER BY rs.started_at DESC
      `, [interviewId]);

      res.json({
        success: true,
        data: result.rows,
        message: 'Recording sessions retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting recording sessions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve recording sessions'
      });
    }
  }
);

/**
 * @route   GET /api/communication/network/metrics
 * @desc    Get network and communication metrics
 * @access  Private (Administrator)
 */
router.get('/network/metrics',
  communicationLimit,
  authenticateToken,
  requireRole('administrator'),
  async (req: Request, res: Response) => {
    try {
      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      // Get recent network metrics
      const metricsResult = await pool.query(`
        SELECT metric_name, metric_value, timestamp
        FROM system_metrics 
        WHERE category = 'network' 
          AND timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT 100
      `);

      // Get current real-time metrics
      const communicationService = req.app.get('communicationService') as CommunicationService;
      const currentMetrics = {
        active_rooms: communicationService.getActiveRooms().length,
        total_participants: communicationService.getParticipantCount(),
        timestamp: new Date()
      };

      res.json({
        success: true,
        data: {
          historical_metrics: metricsResult.rows,
          current_metrics: currentMetrics
        },
        message: 'Network metrics retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting network metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve network metrics'
      });
    }
  }
);

/**
 * @route   POST /api/communication/emergency/disconnect
 * @desc    Emergency disconnect user from all rooms
 * @access  Private (Administrator)
 */
router.post('/emergency/disconnect',
  authenticateToken,
  requireRole('administrator'),
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason is required'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { user_id, reason } = req.body;

      const communicationService = req.app.get('communicationService') as CommunicationService;
      
      // Send emergency disconnect to user
      await communicationService.sendToUser(user_id, 'emergency-disconnect', {
        reason,
        timestamp: new Date(),
        admin_id: req.user?.id
      });

      res.json({
        success: true,
        message: 'Emergency disconnect sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending emergency disconnect:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to send emergency disconnect'
      });
    }
  }
);

export default router;