import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../database/connection';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  SecurityLevel,
  UserStats,
  UserActivity,
  UserGroup,
  UserInvitation,
  BulkUserOperation,
  UserNotificationSettings,
  UserSession,
  UserPreferences,
  UserSecuritySettings,
  APIResponse,
  PaginationParams,
  PaginatedResponse
} from '../../shared/types';

export class UserService {
  private db: DatabaseConnection;
  private pool: Pool;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.pool = this.db.getPool();
  }

  /**
   * Create a new user with security validations
   */
  async createUser(userData: CreateUserRequest, createdBy: string): Promise<APIResponse<User>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if username or email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [userData.username, userData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Username or email already exists');
      }

      // Validate security clearance assignment
      await this.validateSecurityClearanceAssignment(
        userData.security_clearance,
        userData.role,
        createdBy,
        client
      );

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Generate user ID
      const userId = uuidv4();

      // Insert user
      const userResult = await client.query(`
        INSERT INTO users (
          id, username, email, password_hash, full_name, role, 
          department, expertise, security_clearance, phone_number,
          mfa_enabled, mfa_methods, preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        userId,
        userData.username,
        userData.email,
        passwordHash,
        userData.full_name,
        userData.role,
        userData.department || null,
        userData.expertise || [],
        userData.security_clearance,
        userData.phone_number || null,
        userData.mfa_enabled || false,
        userData.mfa_methods || [],
        userData.preferences || {}
      ]);

      // Assign default permissions based on role
      await this.assignDefaultPermissions(userId, userData.role, client);

      // Log audit trail
      await this.logAuditEvent(
        createdBy,
        'user_created',
        'users',
        userId,
        null,
        this.sanitizeUserData(userResult.rows[0]),
        client
      );

      await client.query('COMMIT');

      const user = this.sanitizeUserData(userResult.rows[0]);
      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user by ID with security checks
   */
  async getUserById(userId: string, requesterId: string): Promise<APIResponse<User>> {
    try {
      // Check if requester has permission to view this user
      await this.checkUserViewPermission(requesterId, userId);

      const result = await this.pool.query(`
        SELECT u.*, 
               COALESCE(array_agg(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL), ARRAY[]::VARCHAR[]) as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = true
        WHERE u.id = $1 AND u.is_active = true
        GROUP BY u.id
      `, [userId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
          message: 'User not found or inactive'
        };
      }

      const user = this.sanitizeUserData(result.rows[0]);
      return {
        success: true,
        data: user,
        message: 'User retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user with security validations
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest,
    updatedBy: string
  ): Promise<APIResponse<User>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current user data
      const currentUser = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (currentUser.rows.length === 0) {
        throw new Error('User not found');
      }

      const oldData = currentUser.rows[0];

      // Check permissions for update
      await this.checkUserUpdatePermission(updatedBy, userId, updateData);

      // Validate security clearance changes
      if (updateData.security_clearance && updateData.security_clearance !== oldData.security_clearance) {
        await this.validateSecurityClearanceAssignment(
          updateData.security_clearance,
          updateData.role || oldData.role,
          updatedBy,
          client
        );
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      const allowedFields = [
        'full_name', 'email', 'role', 'department', 'expertise',
        'security_clearance', 'phone_number', 'mfa_enabled',
        'mfa_methods', 'preferences', 'is_active'
      ];

      for (const field of allowedFields) {
        if (updateData[field as keyof UpdateUserRequest] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(updateData[field as keyof UpdateUserRequest]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(updateQuery, updateValues);

      // Log audit trail
      await this.logAuditEvent(
        updatedBy,
        'user_updated',
        'users',
        userId,
        this.sanitizeUserData(oldData),
        this.sanitizeUserData(result.rows[0]),
        client
      );

      await client.query('COMMIT');

      const user = this.sanitizeUserData(result.rows[0]);
      return {
        success: true,
        data: user,
        message: 'User updated successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get users with filtering and pagination
   */
  async getUsers(
    filters: {
      role?: UserRole;
      department?: string;
      security_clearance?: SecurityLevel;
      is_active?: boolean;
      search?: string;
    },
    pagination: PaginationParams,
    requesterId: string
  ): Promise<APIResponse<PaginatedResponse<User>>> {
    try {
      // Check if requester has permission to list users
      await this.checkPermission(requesterId, 'users:list', 'users');

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (filters.role) {
        whereConditions.push(`u.role = $${paramCount}`);
        queryParams.push(filters.role);
        paramCount++;
      }

      if (filters.department) {
        whereConditions.push(`u.department = $${paramCount}`);
        queryParams.push(filters.department);
        paramCount++;
      }

      if (filters.security_clearance) {
        whereConditions.push(`u.security_clearance = $${paramCount}`);
        queryParams.push(filters.security_clearance);
        paramCount++;
      }

      if (filters.is_active !== undefined) {
        whereConditions.push(`u.is_active = $${paramCount}`);
        queryParams.push(filters.is_active);
        paramCount++;
      }

      if (filters.search) {
        whereConditions.push(`(
          u.full_name ILIKE $${paramCount} OR 
          u.username ILIKE $${paramCount} OR 
          u.email ILIKE $${paramCount}
        )`);
        queryParams.push(`%${filters.search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;
      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Calculate pagination
      const limit = pagination.limit || 20;
      const offset = ((pagination.page || 1) - 1) * limit;

      // Get paginated results
      const dataQuery = `
        SELECT u.*, 
               COALESCE(array_agg(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL), ARRAY[]::VARCHAR[]) as permissions
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = true
        ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await this.pool.query(dataQuery, queryParams);

      const users = dataResult.rows.map(row => this.sanitizeUserData(row));

      const response: PaginatedResponse<User> = {
        data: users,
        pagination: {
          page: pagination.page || 1,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      return {
        success: true,
        data: response,
        message: 'Users retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string, deletedBy: string): Promise<APIResponse<void>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check permissions
      await this.checkPermission(deletedBy, 'users:delete', 'users');

      // Get current user data
      const currentUser = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (currentUser.rows.length === 0) {
        throw new Error('User not found');
      }

      // Soft delete user
      await client.query(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
        [userId]
      );

      // Deactivate user sessions
      await client.query(
        'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Deactivate user permissions
      await client.query(
        'UPDATE user_permissions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Log audit trail
      await this.logAuditEvent(
        deletedBy,
        'user_deleted',
        'users',
        userId,
        this.sanitizeUserData(currentUser.rows[0]),
        null,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'User deleted successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<APIResponse<UserStats>> {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(CASE WHEN ip.role = 'interviewer' THEN 1 END) as interviews_conducted,
          COUNT(CASE WHEN ip.role = 'candidate' THEN 1 END) as interviews_attended,
          AVG(CASE WHEN ae.overall_score IS NOT NULL THEN ae.overall_score END) as average_score,
          COUNT(DISTINCT i.id) as total_interviews,
          MAX(ip.joined_at) as last_interview_date
        FROM users u
        LEFT JOIN interview_participants ip ON u.id = ip.user_id
        LEFT JOIN interviews i ON ip.interview_id = i.id
        LEFT JOIN answer_evaluations ae ON i.id = ae.interview_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const stats: UserStats = {
        interviews_conducted: parseInt(result.rows[0].interviews_conducted) || 0,
        interviews_attended: parseInt(result.rows[0].interviews_attended) || 0,
        average_score: parseFloat(result.rows[0].average_score) || 0,
        total_interviews: parseInt(result.rows[0].total_interviews) || 0,
        last_interview_date: result.rows[0].last_interview_date
      };

      return {
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<APIResponse<void>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current user
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password_hash
      );

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      // Log security event
      await this.logSecurityEvent(
        userId,
        'password_change',
        'low',
        'User changed password',
        {},
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Private helper methods

  private sanitizeUserData(user: any): User {
    const { password_hash, mfa_secret, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async validateSecurityClearanceAssignment(
    clearance: SecurityLevel,
    role: UserRole,
    assignedBy: string,
    client: PoolClient
  ): Promise<void> {
    // Get assigner's security clearance
    const assignerResult = await client.query(
      'SELECT security_clearance, role FROM users WHERE id = $1',
      [assignedBy]
    );

    if (assignerResult.rows.length === 0) {
      throw new Error('Assigner not found');
    }

    const assignerClearance = assignerResult.rows[0].security_clearance;
    const assignerRole = assignerResult.rows[0].role;

    // Security clearance hierarchy
    const clearanceHierarchy = {
      'public': 1,
      'restricted': 2,
      'confidential': 3,
      'secret': 4
    };

    // Only administrators and users with higher clearance can assign clearances
    if (assignerRole !== 'administrator' && 
        clearanceHierarchy[assignerClearance] <= clearanceHierarchy[clearance]) {
      throw new Error('Insufficient privileges to assign this security clearance');
    }
  }

  private async assignDefaultPermissions(
    userId: string,
    role: UserRole,
    client: PoolClient
  ): Promise<void> {
    const rolePermissions: Record<UserRole, string[]> = {
      administrator: ['*'],
      selector: [
        'interviews:create',
        'interviews:manage',
        'candidates:evaluate',
        'reports:view',
        'users:view'
      ],
      candidate: [
        'interviews:join',
        'profile:view',
        'profile:update'
      ],
      observer: [
        'interviews:observe',
        'reports:view'
      ]
    };

    const permissions = rolePermissions[role] || [];

    for (const permission of permissions) {
      await client.query(`
        INSERT INTO user_permissions (user_id, permission, resource, granted_by)
        VALUES ($1, $2, $3, $1)
      `, [userId, permission, permission === '*' ? '*' : permission.split(':')[0]]);
    }
  }

  private async checkUserViewPermission(
    requesterId: string,
    targetUserId: string
  ): Promise<void> {
    // Users can always view their own profile
    if (requesterId === targetUserId) {
      return;
    }

    // Check if requester has permission to view other users
    await this.checkPermission(requesterId, 'users:view', 'users');
  }

  private async checkUserUpdatePermission(
    requesterId: string,
    targetUserId: string,
    updateData: UpdateUserRequest
  ): Promise<void> {
    // Users can update their own basic profile
    if (requesterId === targetUserId) {
      const restrictedFields = ['role', 'security_clearance', 'is_active'];
      const hasRestrictedFields = restrictedFields.some(
        field => updateData[field as keyof UpdateUserRequest] !== undefined
      );
      
      if (hasRestrictedFields) {
        await this.checkPermission(requesterId, 'users:manage', 'users');
      }
      return;
    }

    // Check if requester has permission to update other users
    await this.checkPermission(requesterId, 'users:manage', 'users');
  }

  private async checkPermission(
    userId: string,
    permission: string,
    resource: string
  ): Promise<void> {
    const result = await this.pool.query(`
      SELECT 1 FROM user_permissions 
      WHERE user_id = $1 
        AND (permission = $2 OR permission = '*')
        AND (resource = $3 OR resource = '*')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId, permission, resource]);

    if (result.rows.length === 0) {
      throw new Error(`Insufficient permissions: ${permission} on ${resource}`);
    }
  }

  private async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
    client: PoolClient
  ): Promise<void> {
    await client.query(`
      INSERT INTO audit_trail (
        user_id, action, resource, resource_id, resource_type,
        old_value, new_value, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      userId,
      action,
      resource,
      resourceId,
      'user',
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    ]);
  }

  private async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: string,
    description: string,
    details: any,
    client: PoolClient
  ): Promise<void> {
    await client.query(`
      INSERT INTO security_events (
        user_id, event_type, severity, description, details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [userId, eventType, severity, description, JSON.stringify(details)]);
  }
}

export default UserService;