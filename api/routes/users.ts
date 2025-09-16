import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import UserService from '../services/userService';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  SecurityLevel,
  PaginationParams
} from '../../shared/types';

const router = express.Router();
const userService = new UserService();

// Rate limiting for user operations
const userCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 user creation requests per windowMs
  message: 'Too many user creation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const userUpdateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 user update requests per windowMs
  message: 'Too many user update attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateCreateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, dots, underscores, and hyphens'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('full_name')
    .isLength({ min: 2, max: 255 })
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Full name must be 2-255 characters and contain only letters, spaces, dots, apostrophes, and hyphens'),
  body('role')
    .isIn(['administrator', 'selector', 'candidate', 'observer'])
    .withMessage('Invalid role'),
  body('security_clearance')
    .isIn(['public', 'restricted', 'confidential', 'secret'])
    .withMessage('Invalid security clearance'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('expertise')
    .optional()
    .isArray()
    .withMessage('Expertise must be an array'),
  body('phone_number')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('mfa_enabled')
    .optional()
    .isBoolean()
    .withMessage('MFA enabled must be a boolean'),
  body('mfa_methods')
    .optional()
    .isArray()
    .withMessage('MFA methods must be an array')
];

const validateUpdateUser = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, dots, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Full name must be 2-255 characters and contain only letters, spaces, dots, apostrophes, and hyphens'),
  body('role')
    .optional()
    .isIn(['administrator', 'selector', 'candidate', 'observer'])
    .withMessage('Invalid role'),
  body('security_clearance')
    .optional()
    .isIn(['public', 'restricted', 'confidential', 'secret'])
    .withMessage('Invalid security clearance'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('expertise')
    .optional()
    .isArray()
    .withMessage('Expertise must be an array'),
  body('phone_number')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean')
];

const validateGetUsers = [
  query('role')
    .optional()
    .isIn(['administrator', 'selector', 'candidate', 'observer'])
    .withMessage('Invalid role filter'),
  query('security_clearance')
    .optional()
    .isIn(['public', 'restricted', 'confidential', 'secret'])
    .withMessage('Invalid security clearance filter'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('Active filter must be a boolean'),
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

const validatePasswordChange = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character')
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
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Administrator or Selector with permissions)
 */
router.post('/',
  userCreateLimit,
  authenticateToken,
  requirePermission('users:create'),
  validateCreateUser,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userData: CreateUserRequest = req.body;
      const createdBy = req.user?.id;

      if (!createdBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await userService.createUser(userData, createdBy);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to create user'
      });
    }
  }
);

/**
 * @route   GET /api/users
 * @desc    Get users with filtering and pagination
 * @access  Private (Users with view permissions)
 */
router.get('/',
  authenticateToken,
  requirePermission('users:list'),
  validateGetUsers,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        role: req.query.role as UserRole,
        department: req.query.department as string,
        security_clearance: req.query.security_clearance as SecurityLevel,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
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

      const result = await userService.getUsers(filters, pagination, requesterId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve users'
      });
    }
  }
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (User themselves or users with view permissions)
 */
router.get('/:id',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const requesterId = req.user?.id;

      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await userService.getUserById(userId, requesterId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve user'
      });
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (User themselves for basic info, or users with manage permissions)
 */
router.put('/:id',
  userUpdateLimit,
  authenticateToken,
  validateUpdateUser,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updateData: UpdateUserRequest = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      const result = await userService.updateUser(userId, updateData, updatedBy);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to update user'
      });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Administrator or users with delete permissions)
 */
router.delete('/:id',
  authenticateToken,
  requirePermission('users:delete'),
  param('id').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      // Prevent self-deletion
      if (userId === deletedBy) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete own account',
          message: 'Users cannot delete their own account'
        });
      }

      const result = await userService.deleteUser(userId, deletedBy);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to delete user'
      });
    }
  }
);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (User themselves or users with view permissions)
 */
router.get('/:id/stats',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const requesterId = req.user?.id;

      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      // Check if user can view these stats
      if (userId !== requesterId) {
        // Check if requester has permission to view other users' stats
        try {
          await userService.getUserById(userId, requesterId);
        } catch (error) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            message: 'You do not have permission to view this user\'s statistics'
          });
        }
      }

      const result = await userService.getUserStats(userId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve user statistics'
      });
    }
  }
);

/**
 * @route   POST /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (User themselves)
 */
router.post('/:id/change-password',
  authenticateToken,
  param('id').isUUID().withMessage('Invalid user ID format'),
  validatePasswordChange,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const requesterId = req.user?.id;
      const { current_password, new_password } = req.body;

      if (!requesterId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in token'
        });
      }

      // Users can only change their own password
      if (userId !== requesterId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only change your own password'
        });
      }

      const result = await userService.changePassword(
        userId,
        current_password,
        new_password
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to change password'
      });
    }
  }
);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
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

      const result = await userService.getUserById(userId, userId);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve user profile'
      });
    }
  }
);

/**
 * @route   GET /api/users/departments
 * @desc    Get all departments
 * @access  Private
 */
router.get('/departments',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // This would typically be in a separate service, but for simplicity:
      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT id, name, code, description, parent_department
        FROM departments 
        WHERE is_active = true 
        ORDER BY name
      `);

      res.json({
        success: true,
        data: result.rows,
        message: 'Departments retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting departments:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve departments'
      });
    }
  }
);

/**
 * @route   GET /api/users/expertise-areas
 * @desc    Get all expertise areas
 * @access  Private
 */
router.get('/expertise-areas',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // This would typically be in a separate service, but for simplicity:
      const { Pool } = require('pg');
      const { DatabaseConnection } = require('../database/connection');
      
      const db = DatabaseConnection.getInstance();
      const pool = db.getPool();
      
      const result = await pool.query(`
        SELECT id, name, category, description, level, prerequisites
        FROM expertise_areas 
        WHERE is_active = true 
        ORDER BY category, name
      `);

      res.json({
        success: true,
        data: result.rows,
        message: 'Expertise areas retrieved successfully'
      });
    } catch (error: any) {
      console.error('Error getting expertise areas:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to retrieve expertise areas'
      });
    }
  }
);

export default router;