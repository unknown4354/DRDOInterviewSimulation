/**
 * Authentication API routes for DRDO Interview System
 * Handles user registration, login, logout, token management, and MFA
 */
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { UserService } from '../services/userService';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  MFAVerificationRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  APIResponse,
  JWTPayload,
  UserRole
} from '../../shared/types';

const router = Router();
const userService = new UserService();

// Rate limiting configurations
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration requests per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('deviceId')
    .isUUID()
    .withMessage('Valid device ID is required'),
  body('mfaToken')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('MFA token must be 6 digits')
];

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number, and special character'),
  body('full_name')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be 2-255 characters'),
  body('role')
    .isIn(['administrator', 'selector', 'candidate', 'observer'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  body('deviceId')
    .isUUID()
    .withMessage('Valid device ID is required')
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least 8 characters with uppercase, lowercase, number, and special character')
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
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', 
  registerLimiter,
  validateRegister,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequest = req.body;
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [registerData.email, registerData.username]
      );
      
      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this email or username already exists'
        });
        return;
      }
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerData.password, saltRounds);
      
      // Generate user ID and verification token
      const userId = uuidv4();
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create user
      const result = await db.query(`
        INSERT INTO users (
          id, email, username, password_hash, full_name, role,
          department, phone, security_clearance, is_active, email_verified,
          verification_token, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id, email, username, full_name, role, department, phone, 
                 security_clearance, is_active, email_verified, created_at
      `, [
        userId,
        registerData.email,
        registerData.username,
        passwordHash,
        registerData.full_name,
        registerData.role,
        registerData.department || null,
        registerData.phone || null,
        'public', // Default security clearance
        true,
        false, // Email not verified initially
        verificationToken
      ]);
      
      const user = result.rows[0];
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, 
                               new_values, ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
        uuidv4(),
        userId,
        'user_registered',
        'users',
        userId,
        JSON.stringify({ email: user.email, username: user.username, role: user.role }),
        req.ip,
        req.get('User-Agent')
      ]);
      
      // TODO: Send verification email
      
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            security_clearance: user.security_clearance,
            email_verified: user.email_verified
          },
          verificationRequired: true
        },
        message: 'User registered successfully. Please check your email to verify your account.'
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.'
      });
    }
  }
);

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login',
  loginLimiter,
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, deviceId, mfaToken }: LoginRequest = req.body;
      
      // Get user by email
      const userResult = await db.query(`
        SELECT id, email, username, password_hash, full_name, role, department,
               security_clearance, is_active, email_verified, mfa_enabled, mfa_secret,
               failed_login_attempts, locked_until, last_login
        FROM users 
        WHERE email = $1
      `, [email]);
      
      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email or password'
        });
        return;
      }
      
      const user = userResult.rows[0];
      
      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        res.status(423).json({
          success: false,
          error: 'Account locked',
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
        return;
      }
      
      // Check if account is active
      if (!user.is_active) {
        res.status(403).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact administrator.'
        });
        return;
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        // Increment failed attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes
        
        await db.query(`
          UPDATE users 
          SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW()
          WHERE id = $3
        `, [failedAttempts, lockUntil, user.id]);
        
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email or password'
        });
        return;
      }
      
      // Check email verification
      if (!user.email_verified) {
        res.status(403).json({
          success: false,
          error: 'Email not verified',
          message: 'Please verify your email address before logging in'
        });
        return;
      }
      
      // Check MFA if enabled
      if (user.mfa_enabled && !mfaToken) {
        res.status(200).json({
          success: true,
          data: {
            mfaRequired: true,
            userId: user.id
          },
          message: 'MFA token required'
        });
        return;
      }
      
      // Verify MFA token if provided
      if (user.mfa_enabled && mfaToken) {
        // TODO: Implement TOTP verification
        // For now, we'll skip MFA verification
      }
      
      // Generate tokens
      const jwtPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role as UserRole,
        security_clearance: user.security_clearance,
        deviceId
      };
      
      const accessToken = jwt.sign(
        { ...jwtPayload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 }, // 15 minutes
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      const refreshToken = jwt.sign(
        { sub: user.id, deviceId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        { expiresIn: '7d' }
      );
      
      // Create session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await db.query(`
        INSERT INTO user_sessions (id, user_id, session_token, refresh_token, device_id,
                                  device_info, ip_address, user_agent, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        sessionId,
        user.id,
        accessToken,
        refreshToken,
        deviceId,
        JSON.stringify({ userAgent: req.get('User-Agent') }),
        req.ip,
        req.get('User-Agent'),
        expiresAt
      ]);
      
      // Reset failed attempts and update last login
      await db.query(`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW(), 
            login_count = COALESCE(login_count, 0) + 1, updated_at = NOW()
        WHERE id = $1
      `, [user.id]);
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                               ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        user.id,
        'user_login',
        'users',
        user.id,
        req.ip,
        req.get('User-Agent')
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            security_clearance: user.security_clearance
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 900 // 15 minutes
          },
          sessionId
        },
        message: 'Login successful'
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login. Please try again.'
      });
    }
  }
);

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh',
  validateRefreshToken,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken, deviceId }: RefreshTokenRequest = req.body;
      
      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret') as any;
      } catch (error) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
        return;
      }
      
      // Check if session exists and is valid
      const sessionResult = await db.query(`
        SELECT us.*, u.email, u.username, u.role, u.security_clearance, u.is_active
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.refresh_token = $1 AND us.device_id = $2 AND us.expires_at > NOW()
      `, [refreshToken, deviceId]);
      
      if (sessionResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid session',
          message: 'Session not found or expired'
        });
        return;
      }
      
      const session = sessionResult.rows[0];
      
      // Check if user is still active
      if (!session.is_active) {
        res.status(403).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled'
        });
        return;
      }
      
      // Generate new access token
      const jwtPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
        sub: session.user_id,
        email: session.email,
        username: session.username,
        role: session.role as UserRole,
        security_clearance: session.security_clearance,
        deviceId
      };
      
      const newAccessToken = jwt.sign(
        { ...jwtPayload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 900 },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      
      // Update session with new access token
      await db.query(`
        UPDATE user_sessions 
        SET session_token = $1, last_accessed = NOW()
        WHERE id = $2
      `, [newAccessToken, session.id]);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: 900
        },
        message: 'Token refreshed successfully'
      });
      
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token'
      });
    }
  }
);

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const deviceId = req.user?.deviceId;
      
      if (!userId || !deviceId) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'User ID or device ID not found'
        });
        return;
      }
      
      // Invalidate session
      await db.query(`
        DELETE FROM user_sessions 
        WHERE user_id = $1 AND device_id = $2
      `, [userId, deviceId]);
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                               ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        userId,
        'user_logout',
        'users',
        userId,
        req.ip,
        req.get('User-Agent')
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }
);

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
router.post('/logout-all',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'User ID not found'
        });
        return;
      }
      
      // Invalidate all user sessions
      await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                               ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        userId,
        'user_logout_all',
        'users',
        userId,
        req.ip,
        req.get('User-Agent')
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
      
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }
);

/**
 * Password Reset Request
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password',
  passwordResetLimiter,
  validatePasswordReset,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const userResult = await db.query(
        'SELECT id, email, full_name FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      
      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
        return;
      }
      
      const user = userResult.rows[0];
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      await db.query(`
        UPDATE users 
        SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
        WHERE id = $3
      `, [resetToken, resetTokenExpiry, user.id]);
      
      // TODO: Send password reset email
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                               ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        user.id,
        'password_reset_requested',
        'users',
        user.id,
        req.ip,
        req.get('User-Agent')
      ]);
      
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        message: 'An error occurred while processing your request'
      });
    }
  }
);

/**
 * Change Password (authenticated)
 * POST /api/auth/change-password
 */
router.post('/change-password',
  authenticateToken,
  validatePasswordChange,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }
      
      // Get current password hash
      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }
      
      const user = userResult.rows[0];
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid current password',
          message: 'Current password is incorrect'
        });
        return;
      }
      
      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await db.query(`
        UPDATE users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [newPasswordHash, userId]);
      
      // Invalidate all sessions except current
      await db.query(`
        DELETE FROM user_sessions 
        WHERE user_id = $1 AND device_id != $2
      `, [userId, req.user?.deviceId]);
      
      // Log audit event
      await db.query(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                               ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        userId,
        'password_changed',
        'users',
        userId,
        req.ip,
        req.get('User-Agent')
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Password change failed',
        message: 'An error occurred while changing password'
      });
    }
  }
);

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.sub;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }
      
      // Get user profile
      const userResult = await db.query(`
        SELECT id, email, username, full_name, role, department, phone,
               security_clearance, is_active, email_verified, mfa_enabled,
               last_login, login_count, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `, [userId]);
      
      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User profile not found'
        });
        return;
      }
      
      const user = userResult.rows[0];
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            phone: user.phone,
            security_clearance: user.security_clearance,
            email_verified: user.email_verified,
            mfa_enabled: user.mfa_enabled,
            last_login: user.last_login,
            login_count: user.login_count,
            created_at: user.created_at
          }
        },
        message: 'User profile retrieved successfully'
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Profile retrieval failed',
        message: 'An error occurred while retrieving profile'
      });
    }
  }
);

export default router;
