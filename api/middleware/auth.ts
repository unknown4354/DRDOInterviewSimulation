// Authentication middleware for DRDO system

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../database/connection';
import { JWTPayload, UserRole, SecurityLevel } from '../../shared/types';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      sessionId?: string;
      deviceId?: string;
    }
  }
}

interface AuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  mfaRequired: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
}

class AuthenticationService {
  private config: AuthConfig;
  private failedAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();
  private activeSessions: Map<string, { userId: string; deviceId: string; expiresAt: Date }> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
  }

  // Generate JWT tokens
  generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>) {
    const now = Math.floor(Date.now() / 1000);
    
    const accessTokenPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + this.parseExpiry(this.config.accessTokenExpiry),
      iss: 'drdo-interview-system',
      aud: 'drdo-users'
    };

    const refreshTokenPayload = {
      sub: payload.sub,
      deviceId: payload.deviceId,
      iat: now,
      exp: now + this.parseExpiry(this.config.refreshTokenExpiry),
      iss: 'drdo-interview-system',
      aud: 'drdo-users',
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessTokenPayload, this.config.jwtSecret);
    const refreshToken = jwt.sign(refreshTokenPayload, this.config.jwtRefreshSecret);

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyToken(token: string, isRefreshToken = false): JWTPayload | null {
    try {
      const secret = isRefreshToken ? this.config.jwtRefreshSecret : this.config.jwtSecret;
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Check if session is still active
      if (!isRefreshToken && !this.isSessionActive(decoded.sub, decoded.deviceId)) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Hash password with salt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate MFA token
  generateMFAToken(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Generate secure random token
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Check if account is locked
  isAccountLocked(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return false;

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true;
    }

    // Reset if lockout period has passed
    if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
      this.failedAttempts.delete(identifier);
      return false;
    }

    return false;
  }

  // Record failed login attempt
  recordFailedAttempt(identifier: string): void {
    const attempts = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();

    if (attempts.count >= this.config.maxFailedAttempts) {
      attempts.lockedUntil = new Date(Date.now() + this.config.lockoutDuration * 60 * 1000);
    }

    this.failedAttempts.set(identifier, attempts);
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // Create session
  createSession(userId: string, deviceId: string, expiresAt: Date): string {
    const sessionId = this.generateSecureToken();
    this.activeSessions.set(sessionId, { userId, deviceId, expiresAt });
    return sessionId;
  }

  // Check if session is active
  isSessionActive(userId: string, deviceId: string): boolean {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.deviceId === deviceId) {
        if (session.expiresAt > new Date()) {
          return true;
        } else {
          this.activeSessions.delete(sessionId);
        }
      }
    }
    return false;
  }

  // Invalidate session
  invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  // Invalidate all user sessions
  invalidateUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // Parse expiry string to seconds
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt <= now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

// Initialize authentication service
const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  mfaRequired: false,
  maxFailedAttempts: 5,
  lockoutDuration: 30 // 30 minutes
};

export const authService = new AuthenticationService(authConfig);

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'No access token provided'
      });
      return;
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Access token is invalid or expired'
      });
      return;
    }

    // Check if session exists in database
    const sessionResult = await db.query(`
      SELECT us.*, u.is_active, u.email_verified
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = $1 AND us.expires_at > NOW()
    `, [token]);

    if (sessionResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Session expired',
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

    // Check if email is verified
    if (!session.email_verified) {
      res.status(403).json({
        success: false,
        error: 'Email not verified',
        message: 'Please verify your email address'
      });
      return;
    }

    // Update last accessed time
    await db.query(
      'UPDATE user_sessions SET last_accessed = NOW() WHERE id = $1',
      [session.id]
    );

    // Attach user info to request
    req.user = decoded;
    req.sessionId = session.id;
    req.deviceId = decoded.deviceId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require minimum security clearance
 */
export const requireSecurityClearance = (minClearance: SecurityLevel) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const userClearance = req.user.security_clearance;
    const clearanceLevels: SecurityLevel[] = ['public', 'restricted', 'confidential', 'secret'];
    
    const userLevel = clearanceLevels.indexOf(userClearance);
    const requiredLevel = clearanceLevels.indexOf(minClearance);

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: 'Insufficient security clearance',
        message: `Access denied. Required clearance: ${minClearance}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Check user permissions in database
      const permissionResult = await db.query(`
        SELECT 1 FROM user_permissions 
        WHERE user_id = $1 AND permission = $2 AND is_active = true
      `, [req.user.sub, permission]);

      if (permissionResult.rows.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Access denied. Required permission: ${permission}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
      
      // Check if session exists
      const sessionResult = await db.query(`
        SELECT us.*, u.is_active, u.email_verified
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.session_token = $1 AND us.expires_at > NOW()
      `, [token]);

      if (sessionResult.rows.length > 0 && sessionResult.rows[0].is_active) {
        req.user = decoded;
        req.sessionId = sessionResult.rows[0].id;
        req.deviceId = decoded.deviceId;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to validate API key for external integrations
 */
export const validateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'No API key provided'
      });
      return;
    }

    // Check API key in database
    const keyResult = await db.query(`
      SELECT ak.*, u.id as user_id, u.role, u.is_active
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = $1 AND ak.is_active = true AND ak.expires_at > NOW()
    `, [crypto.createHash('sha256').update(apiKey).digest('hex')]);

    if (keyResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'API key is invalid or expired'
      });
      return;
    }

    const keyData = keyResult.rows[0];

    if (!keyData.is_active) {
      res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'Associated user account is disabled'
      });
      return;
    }

    // Update last used time
    await db.query(
      'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = $1',
      [keyData.id]
    );

    // Attach user info to request
    req.user = {
      sub: keyData.user_id,
      role: keyData.role,
      security_clearance: 'public', // API keys have limited access
      deviceId: 'api-key',
      email: '',
      username: '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: 'drdo-interview-system',
      aud: 'drdo-users'
    };

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      error: 'API key validation failed',
      message: 'An error occurred during API key validation'
    });
  }
};

// Clean up expired sessions periodically
setInterval(() => {
  authService.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Every hour

// Initialize authentication service
const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'drdo-jwt-secret-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'drdo-refresh-secret-key-change-in-production',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  mfaRequired: process.env.MFA_REQUIRED === 'true',
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30')
};

export const authService = new AuthenticationService(authConfig);

// Middleware to verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      message: 'Please login again'
    });
  }

  req.user = decoded;
  req.deviceId = decoded.deviceId;
  next();
};

// Middleware to check user roles
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check security clearance
export const requireSecurityClearance = (...clearances: SecurityLevel[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!clearances.includes(req.user.securityClearance)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient security clearance',
        message: `This resource requires security clearance: ${clearances.join(' or ')}`
      });
    }

    next();
  };
};

// Middleware to check specific permissions
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires one of the following permissions: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Middleware for rate limiting
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.sub || req.ip;
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    userRequests.count++;
    next();
  };
};

// Cleanup expired sessions every hour
setInterval(() => {
  authService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

export default authService;