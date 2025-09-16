import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../database/connection';
import {
  Interview,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  InterviewStatus,
  InterviewType,
  ParticipantRole,
  InterviewParticipant,
  AddParticipantRequest,
  InterviewEvaluationCriteria,
  InterviewSettings,
  InterviewResults,
  InterviewTemplate,
  InterviewSchedule,
  InterviewInvitation,
  InterviewRoom,
  APIResponse,
  PaginationParams,
  PaginatedResponse
} from '../../shared/types';

export class InterviewService {
  private db: DatabaseConnection;
  private pool: Pool;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.pool = this.db.getPool();
  }

  /**
   * Create a new interview with comprehensive validation
   */
  async createInterview(
    interviewData: CreateInterviewRequest,
    createdBy: string
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate creator permissions
      await this.validateInterviewCreationPermissions(createdBy, interviewData, client);

      // Generate unique room ID
      const roomId = this.generateRoomId();
      const interviewId = uuidv4();

      // Validate scheduled time
      this.validateScheduledTime(interviewData.scheduled_time);

      // Create interview record
      const interviewResult = await client.query(`
        INSERT INTO interviews (
          id, title, description, type, status, scheduled_time, duration,
          evaluation_criteria, question_categories, settings, room_id,
          recording_enabled, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        interviewId,
        interviewData.title,
        interviewData.description || null,
        interviewData.type,
        'scheduled',
        interviewData.scheduled_time,
        interviewData.duration,
        JSON.stringify(interviewData.evaluation_criteria),
        interviewData.question_categories || [],
        JSON.stringify(interviewData.settings),
        roomId,
        interviewData.recording_enabled || false,
        createdBy
      ]);

      // Add creator as interviewer participant
      await this.addParticipantInternal(
        interviewId,
        {
          user_id: createdBy,
          role: 'interviewer',
          permissions: {
            can_evaluate: true,
            can_control_recording: true,
            can_manage_participants: true,
            can_end_interview: true
          }
        },
        client
      );

      // Add initial participants if provided
      if (interviewData.participants && interviewData.participants.length > 0) {
        for (const participant of interviewData.participants) {
          await this.addParticipantInternal(interviewId, participant, client);
        }
      }

      // Log audit trail
      await this.logAuditEvent(
        createdBy,
        'interview_created',
        'interviews',
        interviewId,
        null,
        interviewResult.rows[0],
        client
      );

      await client.query('COMMIT');

      // Get complete interview data with participants
      const completeInterview = await this.getInterviewByIdInternal(interviewId, client);
      
      return {
        success: true,
        data: completeInterview,
        message: 'Interview created successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get interview by ID with participant details
   */
  async getInterviewById(
    interviewId: string,
    requesterId: string
  ): Promise<APIResponse<Interview>> {
    try {
      // Check if requester has access to this interview
      await this.validateInterviewAccess(requesterId, interviewId);

      const interview = await this.getInterviewByIdInternal(interviewId);
      
      if (!interview) {
        return {
          success: false,
          error: 'Interview not found',
          message: 'Interview not found or you do not have access'
        };
      }

      return {
        success: true,
        data: interview,
        message: 'Interview retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update interview details
   */
  async updateInterview(
    interviewId: string,
    updateData: UpdateInterviewRequest,
    updatedBy: string
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current interview data
      const currentInterview = await client.query(
        'SELECT * FROM interviews WHERE id = $1',
        [interviewId]
      );

      if (currentInterview.rows.length === 0) {
        throw new Error('Interview not found');
      }

      const oldData = currentInterview.rows[0];

      // Check permissions for update
      await this.validateInterviewUpdatePermissions(updatedBy, interviewId, updateData, client);

      // Validate status transitions
      if (updateData.status) {
        this.validateStatusTransition(oldData.status, updateData.status);
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateData.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        updateValues.push(updateData.title);
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updateData.description);
      }

      if (updateData.scheduled_time !== undefined) {
        this.validateScheduledTime(updateData.scheduled_time);
        updateFields.push(`scheduled_time = $${paramIndex++}`);
        updateValues.push(updateData.scheduled_time);
      }

      if (updateData.duration !== undefined) {
        updateFields.push(`duration = $${paramIndex++}`);
        updateValues.push(updateData.duration);
      }

      if (updateData.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        updateValues.push(updateData.status);
      }

      if (updateData.evaluation_criteria !== undefined) {
        updateFields.push(`evaluation_criteria = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updateData.evaluation_criteria));
      }

      if (updateData.settings !== undefined) {
        updateFields.push(`settings = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updateData.settings));
      }

      if (updateData.results !== undefined) {
        updateFields.push(`results = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updateData.results));
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(interviewId);

      const updateQuery = `
        UPDATE interviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, updateValues);

      // Log audit trail
      await this.logAuditEvent(
        updatedBy,
        'interview_updated',
        'interviews',
        interviewId,
        oldData,
        updateResult.rows[0],
        client
      );

      await client.query('COMMIT');

      // Get complete updated interview data
      const updatedInterview = await this.getInterviewByIdInternal(interviewId, client);
      
      return {
        success: true,
        data: updatedInterview,
        message: 'Interview updated successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get interviews with filtering and pagination
   */
  async getInterviews(
    filters: any,
    pagination: PaginationParams,
    requesterId: string
  ): Promise<PaginatedResponse<Interview[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      // Build WHERE clause based on filters
      const whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Base access control - users can see interviews they participate in or created
      whereConditions.push(`(
        i.created_by = $${paramIndex++} OR 
        EXISTS (
          SELECT 1 FROM interview_participants ip 
          WHERE ip.interview_id = i.id AND ip.user_id = $${paramIndex++}
        )
      )`);
      queryParams.push(requesterId, requesterId);

      if (filters.status) {
        whereConditions.push(`i.status = $${paramIndex++}`);
        queryParams.push(filters.status);
      }

      if (filters.type) {
        whereConditions.push(`i.type = $${paramIndex++}`);
        queryParams.push(filters.type);
      }

      if (filters.created_by) {
        whereConditions.push(`i.created_by = $${paramIndex++}`);
        queryParams.push(filters.created_by);
      }

      if (filters.date_from) {
        whereConditions.push(`i.scheduled_time >= $${paramIndex++}`);
        queryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        whereConditions.push(`i.scheduled_time <= $${paramIndex++}`);
        queryParams.push(filters.date_to);
      }

      if (filters.search) {
        whereConditions.push(`(
          i.title ILIKE $${paramIndex++} OR 
          i.description ILIKE $${paramIndex++}
        )`);
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM interviews i
        ${whereClause}
      `;
      
      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get interviews with pagination
      const dataQuery = `
        SELECT 
          i.*,
          u.full_name as created_by_name,
          COUNT(ip.id) as participant_count
        FROM interviews i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN interview_participants ip ON i.id = ip.interview_id
        ${whereClause}
        GROUP BY i.id, u.full_name
        ORDER BY i.scheduled_time DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      queryParams.push(pagination.limit, offset);
      const dataResult = await this.pool.query(dataQuery, queryParams);

      const interviews = dataResult.rows.map(row => ({
        ...row,
        evaluation_criteria: typeof row.evaluation_criteria === 'string' 
          ? JSON.parse(row.evaluation_criteria) 
          : row.evaluation_criteria,
        settings: typeof row.settings === 'string' 
          ? JSON.parse(row.settings) 
          : row.settings,
        results: typeof row.results === 'string' 
          ? JSON.parse(row.results) 
          : row.results
      }));

      return {
        success: true,
        data: interviews,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        },
        message: 'Interviews retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Add participant to interview
   */
  async addParticipant(
    interviewId: string,
    participantData: AddParticipantRequest,
    addedBy: string
  ): Promise<APIResponse<InterviewParticipant>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions
      await this.validateParticipantManagementPermissions(addedBy, interviewId, client);

      // Check if user is already a participant
      const existingParticipant = await client.query(
        'SELECT id FROM interview_participants WHERE interview_id = $1 AND user_id = $2',
        [interviewId, participantData.user_id]
      );

      if (existingParticipant.rows.length > 0) {
        throw new Error('User is already a participant in this interview');
      }

      // Add participant
      const participant = await this.addParticipantInternal(interviewId, participantData, client);

      // Log audit event
      await this.logAuditEvent(
        addedBy,
        'participant_added',
        'interview_participants',
        participant.id,
        null,
        participant,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: participant,
        message: 'Participant added successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove participant from interview
   */
  async removeParticipant(
    interviewId: string,
    participantId: string,
    removedBy: string
  ): Promise<APIResponse<void>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions
      await this.validateParticipantManagementPermissions(removedBy, interviewId, client);

      // Get participant data for audit
      const participantResult = await client.query(
        'SELECT * FROM interview_participants WHERE id = $1 AND interview_id = $2',
        [participantId, interviewId]
      );

      if (participantResult.rows.length === 0) {
        throw new Error('Participant not found');
      }

      const participant = participantResult.rows[0];

      // Remove participant
      await client.query(
        'DELETE FROM interview_participants WHERE id = $1',
        [participantId]
      );

      // Log audit event
      await this.logAuditEvent(
        removedBy,
        'participant_removed',
        'interview_participants',
        participantId,
        participant,
        null,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Participant removed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Start interview session
   */
  async startInterview(
    interviewId: string,
    startedBy: string
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions
      await this.validateInterviewControlPermissions(startedBy, interviewId, 'start', client);

      // Get current interview
      const interviewResult = await client.query(
        'SELECT * FROM interviews WHERE id = $1',
        [interviewId]
      );

      if (interviewResult.rows.length === 0) {
        throw new Error('Interview not found');
      }

      const interview = interviewResult.rows[0];

      // Validate status transition
      if (interview.status !== 'scheduled') {
        throw new Error(`Cannot start interview with status: ${interview.status}`);
      }

      // Update interview status
      const updateResult = await client.query(`
        UPDATE interviews 
        SET status = 'in_progress', actual_start_time = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [interviewId]);

      // Log audit event
      await this.logAuditEvent(
        startedBy,
        'interview_started',
        'interviews',
        interviewId,
        interview,
        updateResult.rows[0],
        client
      );

      await client.query('COMMIT');

      // Get complete updated interview data
      const updatedInterview = await this.getInterviewByIdInternal(interviewId);
      
      return {
        success: true,
        data: updatedInterview,
        message: 'Interview started successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * End interview session
   */
  async endInterview(
    interviewId: string,
    endedBy: string,
    results?: any
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions
      await this.validateInterviewControlPermissions(endedBy, interviewId, 'end', client);

      // Get current interview
      const interviewResult = await client.query(
        'SELECT * FROM interviews WHERE id = $1',
        [interviewId]
      );

      if (interviewResult.rows.length === 0) {
        throw new Error('Interview not found');
      }

      const interview = interviewResult.rows[0];

      // Validate status transition
      if (interview.status !== 'in_progress') {
        throw new Error(`Cannot end interview with status: ${interview.status}`);
      }

      // Update interview status
      const updateResult = await client.query(`
        UPDATE interviews 
        SET status = 'completed', actual_end_time = NOW(), results = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [results ? JSON.stringify(results) : null, interviewId]);

      // Update all participants' left_at time
      await client.query(`
        UPDATE interview_participants 
        SET left_at = NOW()
        WHERE interview_id = $1 AND left_at IS NULL
      `, [interviewId]);

      // Log audit event
      await this.logAuditEvent(
        endedBy,
        'interview_ended',
        'interviews',
        interviewId,
        interview,
        updateResult.rows[0],
        client
      );

      await client.query('COMMIT');

      // Get complete updated interview data
      const updatedInterview = await this.getInterviewByIdInternal(interviewId);
      
      return {
        success: true,
        data: updatedInterview,
        message: 'Interview ended successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Join interview as participant
   */
  async joinInterview(
    interviewId: string,
    userId: string,
    deviceInfo?: any
  ): Promise<APIResponse<InterviewParticipant>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user is a valid participant
      const participantResult = await client.query(
        'SELECT * FROM interview_participants WHERE interview_id = $1 AND user_id = $2',
        [interviewId, userId]
      );

      if (participantResult.rows.length === 0) {
        throw new Error('You are not a participant in this interview');
      }

      const participant = participantResult.rows[0];

      // Check interview status
      const interviewResult = await client.query(
        'SELECT status FROM interviews WHERE id = $1',
        [interviewId]
      );

      if (interviewResult.rows.length === 0) {
        throw new Error('Interview not found');
      }

      const interview = interviewResult.rows[0];

      if (!['scheduled', 'in_progress'].includes(interview.status)) {
        throw new Error(`Cannot join interview with status: ${interview.status}`);
      }

      // Update participant join time and device info
      const updateResult = await client.query(`
        UPDATE interview_participants 
        SET joined_at = NOW(), device_info = $1
        WHERE id = $2
        RETURNING *
      `, [deviceInfo ? JSON.stringify(deviceInfo) : null, participant.id]);

      // Log audit event
      await this.logAuditEvent(
        userId,
        'participant_joined',
        'interview_participants',
        participant.id,
        participant,
        updateResult.rows[0],
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: updateResult.rows[0],
        message: 'Joined interview successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
     }
   }

  // Private helper methods

  /**
   * Get interview by ID with all related data (internal method)
   */
  private async getInterviewByIdInternal(
    interviewId: string,
    client?: PoolClient
  ): Promise<Interview> {
    const queryClient = client || this.pool;
    
    const result = await queryClient.query(`
      SELECT 
        i.*,
        u.full_name as created_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ip.id,
              'user_id', ip.user_id,
              'role', ip.role,
              'permissions', ip.permissions,
              'joined_at', ip.joined_at,
              'left_at', ip.left_at,
              'connection_quality', ip.connection_quality,
              'device_info', ip.device_info,
              'status', ip.status,
              'user_name', pu.full_name,
              'user_email', pu.email
            )
          ) FILTER (WHERE ip.id IS NOT NULL),
          '[]'
        ) as participants
      FROM interviews i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id
      LEFT JOIN users pu ON ip.user_id = pu.id
      WHERE i.id = $1
      GROUP BY i.id, u.full_name
    `, [interviewId]);

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    const interview = result.rows[0];
    
    return {
      ...interview,
      evaluation_criteria: typeof interview.evaluation_criteria === 'string' 
        ? JSON.parse(interview.evaluation_criteria) 
        : interview.evaluation_criteria,
      settings: typeof interview.settings === 'string' 
        ? JSON.parse(interview.settings) 
        : interview.settings,
      results: typeof interview.results === 'string' 
        ? JSON.parse(interview.results) 
        : interview.results,
      participants: interview.participants.map((p: any) => ({
        ...p,
        permissions: typeof p.permissions === 'string' 
          ? JSON.parse(p.permissions) 
          : p.permissions,
        device_info: typeof p.device_info === 'string' 
          ? JSON.parse(p.device_info) 
          : p.device_info
      }))
    };
  }

  /**
   * Add participant internal method
   */
  private async addParticipantInternal(
    interviewId: string,
    participantData: AddParticipantRequest,
    client: PoolClient
  ): Promise<InterviewParticipant> {
    const participantId = uuidv4();
    
    const result = await client.query(`
      INSERT INTO interview_participants (
        id, interview_id, user_id, role, permissions, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      participantId,
      interviewId,
      participantData.user_id,
      participantData.role,
      JSON.stringify(participantData.permissions || {}),
      'invited'
    ]);

    return result.rows[0];
  }

  /**
   * Generate unique room ID
   */
  private generateRoomId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `room_${timestamp}_${randomStr}`;
  }

  /**
   * Validate scheduled time
   */
  private validateScheduledTime(scheduledTime: Date): void {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    
    if (scheduled <= now) {
      throw new Error('Scheduled time must be in the future');
    }

    // Don't allow scheduling more than 1 year in advance
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (scheduled > oneYearFromNow) {
      throw new Error('Cannot schedule interview more than 1 year in advance');
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: InterviewStatus, newStatus: InterviewStatus): void {
    const validTransitions: Record<InterviewStatus, InterviewStatus[]> = {
      'scheduled': ['in_progress', 'cancelled', 'postponed'],
      'in_progress': ['completed', 'cancelled', 'technical_issues'],
      'completed': [], // No transitions from completed
      'cancelled': ['scheduled'], // Can reschedule cancelled interviews
      'technical_issues': ['scheduled', 'cancelled'],
      'postponed': ['scheduled', 'cancelled']
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Validate interview creation permissions
   */
  private async validateInterviewCreationPermissions(
    userId: string,
    interviewData: CreateInterviewRequest,
    client: PoolClient
  ): Promise<void> {
    // Check user role and permissions
    const userResult = await client.query(
      'SELECT role, security_clearance FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found or inactive');
    }

    const user = userResult.rows[0];

    // Only selectors and administrators can create interviews
    if (!['selector', 'administrator'].includes(user.role)) {
      throw new Error('Insufficient permissions to create interviews');
    }

    // Additional validation based on interview type or security requirements
    if (interviewData.type === 'panel' && user.role !== 'administrator') {
      throw new Error('Only administrators can create panel interviews');
    }
  }

  /**
   * Validate interview access permissions
   */
  private async validateInterviewAccess(
    userId: string,
    interviewId: string
  ): Promise<void> {
    const result = await this.pool.query(`
      SELECT 1 FROM interviews i
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id
      WHERE i.id = $1 AND (
        i.created_by = $2 OR 
        ip.user_id = $2 OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = $2 AND u.role IN ('administrator', 'observer')
        )
      )
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Access denied to this interview');
    }
  }

  /**
   * Validate interview update permissions
   */
  private async validateInterviewUpdatePermissions(
    userId: string,
    interviewId: string,
    updateData: UpdateInterviewRequest,
    client: PoolClient
  ): Promise<void> {
    // Check if user is creator or has management permissions
    const result = await client.query(`
      SELECT i.created_by, i.status, ip.permissions, u.role
      FROM interviews i
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id AND ip.user_id = $2
      LEFT JOIN users u ON u.id = $2
      WHERE i.id = $1
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    const interview = result.rows[0];
    const isCreator = interview.created_by === userId;
    const isAdmin = interview.role === 'administrator';
    const hasManagePermission = interview.permissions?.can_manage_interview;

    if (!isCreator && !isAdmin && !hasManagePermission) {
      throw new Error('Insufficient permissions to update this interview');
    }

    // Additional validation for status changes
    if (updateData.status && interview.status === 'completed') {
      throw new Error('Cannot modify completed interviews');
    }
  }

  /**
   * Validate participant management permissions
   */
  private async validateParticipantManagementPermissions(
    userId: string,
    interviewId: string,
    client: PoolClient
  ): Promise<void> {
    const result = await client.query(`
      SELECT i.created_by, ip.permissions, u.role
      FROM interviews i
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id AND ip.user_id = $2
      LEFT JOIN users u ON u.id = $2
      WHERE i.id = $1
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    const interview = result.rows[0];
    const isCreator = interview.created_by === userId;
    const isAdmin = interview.role === 'administrator';
    const hasManagePermission = interview.permissions?.can_manage_participants;

    if (!isCreator && !isAdmin && !hasManagePermission) {
      throw new Error('Insufficient permissions to manage participants');
    }
  }

  /**
   * Validate interview control permissions (start/end)
   */
  private async validateInterviewControlPermissions(
    userId: string,
    interviewId: string,
    action: 'start' | 'end',
    client: PoolClient
  ): Promise<void> {
    const result = await client.query(`
      SELECT i.created_by, ip.permissions, ip.role, u.role as user_role
      FROM interviews i
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id AND ip.user_id = $2
      LEFT JOIN users u ON u.id = $2
      WHERE i.id = $1
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    const interview = result.rows[0];
    const isCreator = interview.created_by === userId;
    const isAdmin = interview.user_role === 'administrator';
    const isInterviewer = interview.role === 'interviewer';
    const canControl = interview.permissions?.[`can_${action}_interview`];

    if (!isCreator && !isAdmin && !isInterviewer && !canControl) {
      throw new Error(`Insufficient permissions to ${action} this interview`);
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues: any,
    newValues: any,
    client: PoolClient
  ): Promise<void> {
    await client.query(`
      INSERT INTO audit_logs (
        id, user_id, action, resource_type, resource_id,
        old_values, new_values, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      uuidv4(),
      userId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    ]);
  }
}

export default InterviewService;

      const allowedFields = [
        'title', 'description', 'scheduled_time', 'duration',
        'evaluation_criteria', 'question_categories', 'settings',
        'status', 'recording_enabled', 'actual_start_time', 'actual_end_time',
        'results', 'metadata'
      ];

      for (const field of allowedFields) {
        if (updateData[field as keyof UpdateInterviewRequest] !== undefined) {
          let value = updateData[field as keyof UpdateInterviewRequest];
          
          // Handle JSON fields
          if (['evaluation_criteria', 'settings', 'results', 'metadata'].includes(field)) {
            value = JSON.stringify(value);
          }
          
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(interviewId);

      const updateQuery = `
        UPDATE interviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(updateQuery, updateValues);

      // Handle status-specific actions
      if (updateData.status) {
        await this.handleStatusChange(
          interviewId,
          oldData.status,
          updateData.status,
          updatedBy,
          client
        );
      }

      // Log audit trail
      await this.logAuditEvent(
        updatedBy,
        'interview_updated',
        'interviews',
        interviewId,
        oldData,
        result.rows[0],
        client
      );

      await client.query('COMMIT');

      const interview = await this.getInterviewByIdInternal(interviewId);
      
      return {
        success: true,
        data: interview,
        message: 'Interview updated successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get interviews with filtering and pagination
   */
  async getInterviews(
    filters: {
      status?: InterviewStatus;
      type?: InterviewType;
      created_by?: string;
      participant_id?: string;
      date_from?: Date;
      date_to?: Date;
      search?: string;
    },
    pagination: PaginationParams,
    requesterId: string
  ): Promise<APIResponse<PaginatedResponse<Interview>>> {
    try {
      // Check permissions
      await this.checkPermission(requesterId, 'interviews:list', 'interviews');

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (filters.status) {
        whereConditions.push(`i.status = $${paramCount}`);
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.type) {
        whereConditions.push(`i.type = $${paramCount}`);
        queryParams.push(filters.type);
        paramCount++;
      }

      if (filters.created_by) {
        whereConditions.push(`i.created_by = $${paramCount}`);
        queryParams.push(filters.created_by);
        paramCount++;
      }

      if (filters.participant_id) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM interview_participants ip 
          WHERE ip.interview_id = i.id AND ip.user_id = $${paramCount}
        )`);
        queryParams.push(filters.participant_id);
        paramCount++;
      }

      if (filters.date_from) {
        whereConditions.push(`i.scheduled_time >= $${paramCount}`);
        queryParams.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        whereConditions.push(`i.scheduled_time <= $${paramCount}`);
        queryParams.push(filters.date_to);
        paramCount++;
      }

      if (filters.search) {
        whereConditions.push(`(
          i.title ILIKE $${paramCount} OR 
          i.description ILIKE $${paramCount}
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
        FROM interviews i
        ${whereClause}
      `;
      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Calculate pagination
      const limit = pagination.limit || 20;
      const offset = ((pagination.page || 1) - 1) * limit;

      // Get paginated results with participant counts
      const dataQuery = `
        SELECT i.*, 
               u.full_name as created_by_name,
               COUNT(ip.id) as participant_count
        FROM interviews i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN interview_participants ip ON i.id = ip.interview_id
        ${whereClause}
        GROUP BY i.id, u.full_name
        ORDER BY i.scheduled_time DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await this.pool.query(dataQuery, queryParams);

      const interviews = dataResult.rows.map(row => this.formatInterviewData(row));

      const response: PaginatedResponse<Interview> = {
        data: interviews,
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
        message: 'Interviews retrieved successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Add participant to interview
   */
  async addParticipant(
    interviewId: string,
    participantData: AddParticipantRequest,
    addedBy: string
  ): Promise<APIResponse<InterviewParticipant>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check permissions
      await this.validateParticipantManagementPermissions(addedBy, interviewId, client);

      // Check if user is already a participant
      const existingParticipant = await client.query(
        'SELECT id FROM interview_participants WHERE interview_id = $1 AND user_id = $2',
        [interviewId, participantData.user_id]
      );

      if (existingParticipant.rows.length > 0) {
        throw new Error('User is already a participant in this interview');
      }

      const participant = await this.addParticipantInternal(
        interviewId,
        participantData,
        client
      );

      // Log audit trail
      await this.logAuditEvent(
        addedBy,
        'participant_added',
        'interview_participants',
        participant.id,
        null,
        participant,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: participant,
        message: 'Participant added successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove participant from interview
   */
  async removeParticipant(
    interviewId: string,
    participantId: string,
    removedBy: string
  ): Promise<APIResponse<void>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check permissions
      await this.validateParticipantManagementPermissions(removedBy, interviewId, client);

      // Get participant data before deletion
      const participantResult = await client.query(
        'SELECT * FROM interview_participants WHERE id = $1 AND interview_id = $2',
        [participantId, interviewId]
      );

      if (participantResult.rows.length === 0) {
        throw new Error('Participant not found');
      }

      const participantData = participantResult.rows[0];

      // Remove participant
      await client.query(
        'DELETE FROM interview_participants WHERE id = $1',
        [participantId]
      );

      // Log audit trail
      await this.logAuditEvent(
        removedBy,
        'participant_removed',
        'interview_participants',
        participantId,
        participantData,
        null,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Participant removed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Start interview session
   */
  async startInterview(
    interviewId: string,
    startedBy: string
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions and interview state
      await this.validateInterviewStartPermissions(startedBy, interviewId, client);

      // Update interview status and start time
      const result = await client.query(`
        UPDATE interviews 
        SET status = 'in_progress', 
            actual_start_time = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status = 'scheduled'
        RETURNING *
      `, [interviewId]);

      if (result.rows.length === 0) {
        throw new Error('Interview cannot be started or is not in scheduled status');
      }

      // Update participant status for those who joined
      await client.query(`
        UPDATE interview_participants 
        SET status = 'joined', joined_at = NOW()
        WHERE interview_id = $1 AND user_id = $2
      `, [interviewId, startedBy]);

      // Log security event
      await this.logSecurityEvent(
        startedBy,
        'interview_started',
        'low',
        `Interview ${interviewId} started`,
        { interview_id: interviewId },
        client
      );

      await client.query('COMMIT');

      const interview = await this.getInterviewByIdInternal(interviewId);
      
      return {
        success: true,
        data: interview,
        message: 'Interview started successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * End interview session
   */
  async endInterview(
    interviewId: string,
    endedBy: string,
    results?: InterviewResults
  ): Promise<APIResponse<Interview>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate permissions
      await this.validateInterviewEndPermissions(endedBy, interviewId, client);

      // Update interview status and end time
      const updateQuery = results 
        ? `UPDATE interviews 
           SET status = 'completed', 
               actual_end_time = NOW(),
               results = $2,
               updated_at = NOW()
           WHERE id = $1 AND status = 'in_progress'
           RETURNING *`
        : `UPDATE interviews 
           SET status = 'completed', 
               actual_end_time = NOW(),
               updated_at = NOW()
           WHERE id = $1 AND status = 'in_progress'
           RETURNING *`;

      const queryParams = results ? [interviewId, JSON.stringify(results)] : [interviewId];
      const result = await client.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        throw new Error('Interview cannot be ended or is not in progress');
      }

      // Update all participant statuses
      await client.query(`
        UPDATE interview_participants 
        SET status = 'completed', left_at = NOW()
        WHERE interview_id = $1 AND status != 'completed'
      `, [interviewId]);

      // Log security event
      await this.logSecurityEvent(
        endedBy,
        'interview_ended',
        'low',
        `Interview ${interviewId} ended`,
        { interview_id: interviewId, results: results ? 'provided' : 'none' },
        client
      );

      await client.query('COMMIT');

      const interview = await this.getInterviewByIdInternal(interviewId);
      
      return {
        success: true,
        data: interview,
        message: 'Interview ended successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Join interview as participant
   */
  async joinInterview(
    interviewId: string,
    userId: string,
    deviceInfo?: any
  ): Promise<APIResponse<{ room_id: string; permissions: any }>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user is a valid participant
      const participantResult = await client.query(`
        SELECT ip.*, i.room_id, i.status as interview_status
        FROM interview_participants ip
        JOIN interviews i ON ip.interview_id = i.id
        WHERE ip.interview_id = $1 AND ip.user_id = $2
      `, [interviewId, userId]);

      if (participantResult.rows.length === 0) {
        throw new Error('You are not a participant in this interview');
      }

      const participant = participantResult.rows[0];
      
      if (participant.interview_status !== 'in_progress' && participant.interview_status !== 'scheduled') {
        throw new Error('Interview is not available for joining');
      }

      // Update participant status
      await client.query(`
        UPDATE interview_participants 
        SET status = 'joined', 
            joined_at = COALESCE(joined_at, NOW()),
            device_info = $3
        WHERE id = $1
      `, [participant.id, interviewId, JSON.stringify(deviceInfo || {})]);

      // Log security event
      await this.logSecurityEvent(
        userId,
        'interview_joined',
        'low',
        `User joined interview ${interviewId}`,
        { interview_id: interviewId, participant_role: participant.role },
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          room_id: participant.room_id,
          permissions: participant.permissions
        },
        message: 'Successfully joined interview'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Private helper methods

  private async getInterviewByIdInternal(
    interviewId: string,
    client?: PoolClient
  ): Promise<Interview> {
    const dbClient = client || this.pool;
    
    const result = await dbClient.query(`
      SELECT i.*, 
             u.full_name as created_by_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ip.id,
                   'user_id', ip.user_id,
                   'role', ip.role,
                   'permissions', ip.permissions,
                   'status', ip.status,
                   'joined_at', ip.joined_at,
                   'left_at', ip.left_at,
                   'user_name', pu.full_name,
                   'user_email', pu.email
                 )
               ) FILTER (WHERE ip.id IS NOT NULL), 
               '[]'
             ) as participants
      FROM interviews i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id
      LEFT JOIN users pu ON ip.user_id = pu.id
      WHERE i.id = $1
      GROUP BY i.id, u.full_name
    `, [interviewId]);

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    return this.formatInterviewData(result.rows[0]);
  }

  private async addParticipantInternal(
    interviewId: string,
    participantData: AddParticipantRequest,
    client: PoolClient
  ): Promise<InterviewParticipant> {
    const participantId = uuidv4();
    
    const result = await client.query(`
      INSERT INTO interview_participants (
        id, interview_id, user_id, role, permissions, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      participantId,
      interviewId,
      participantData.user_id,
      participantData.role,
      JSON.stringify(participantData.permissions || {}),
      'invited'
    ]);

    return result.rows[0];
  }

  private formatInterviewData(row: any): Interview {
    return {
      ...row,
      evaluation_criteria: typeof row.evaluation_criteria === 'string' 
        ? JSON.parse(row.evaluation_criteria) 
        : row.evaluation_criteria,
      settings: typeof row.settings === 'string' 
        ? JSON.parse(row.settings) 
        : row.settings,
      results: typeof row.results === 'string' 
        ? JSON.parse(row.results) 
        : row.results,
      metadata: typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : row.metadata,
      participants: Array.isArray(row.participants) 
        ? row.participants 
        : []
    };
  }

  private generateRoomId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `room_${timestamp}_${randomStr}`;
  }

  private validateScheduledTime(scheduledTime: Date): void {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    
    if (scheduled <= now) {
      throw new Error('Scheduled time must be in the future');
    }

    // Check if scheduled time is too far in the future (e.g., 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (scheduled > oneYearFromNow) {
      throw new Error('Scheduled time cannot be more than 1 year in the future');
    }
  }

  private validateStatusTransition(currentStatus: InterviewStatus, newStatus: InterviewStatus): void {
    const validTransitions: Record<InterviewStatus, InterviewStatus[]> = {
      'scheduled': ['in_progress', 'cancelled', 'postponed'],
      'in_progress': ['completed', 'cancelled', 'technical_issues'],
      'completed': [], // No transitions from completed
      'cancelled': ['scheduled'], // Can reschedule cancelled interviews
      'technical_issues': ['in_progress', 'cancelled', 'postponed'],
      'postponed': ['scheduled', 'cancelled']
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async handleStatusChange(
    interviewId: string,
    oldStatus: InterviewStatus,
    newStatus: InterviewStatus,
    changedBy: string,
    client: PoolClient
  ): Promise<void> {
    // Handle specific status change logic
    switch (newStatus) {
      case 'cancelled':
        // Notify all participants about cancellation
        await this.notifyParticipants(interviewId, 'interview_cancelled', client);
        break;
      case 'postponed':
        // Notify all participants about postponement
        await this.notifyParticipants(interviewId, 'interview_postponed', client);
        break;
      case 'completed':
        // Trigger post-interview processes
        await this.handleInterviewCompletion(interviewId, client);
        break;
    }
  }

  private async notifyParticipants(
    interviewId: string,
    eventType: string,
    client: PoolClient
  ): Promise<void> {
    // This would integrate with a notification service
    // For now, we'll just log the event
    console.log(`Notifying participants of ${eventType} for interview ${interviewId}`);
  }

  private async handleInterviewCompletion(
    interviewId: string,
    client: PoolClient
  ): Promise<void> {
    // Trigger any post-interview processing
    // This could include generating reports, sending notifications, etc.
    console.log(`Processing completion for interview ${interviewId}`);
  }

  // Validation methods

  private async validateInterviewCreationPermissions(
    userId: string,
    interviewData: CreateInterviewRequest,
    client: PoolClient
  ): Promise<void> {
    await this.checkPermission(userId, 'interviews:create', 'interviews');
  }

  private async validateInterviewAccess(
    userId: string,
    interviewId: string
  ): Promise<void> {
    const result = await this.pool.query(`
      SELECT 1 FROM interviews i
      LEFT JOIN interview_participants ip ON i.id = ip.interview_id
      WHERE i.id = $1 AND (i.created_by = $2 OR ip.user_id = $2)
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      // Check if user has general interview access permission
      await this.checkPermission(userId, 'interviews:view', 'interviews');
    }
  }

  private async validateInterviewUpdatePermissions(
    userId: string,
    interviewId: string,
    updateData: UpdateInterviewRequest,
    client: PoolClient
  ): Promise<void> {
    // Check if user is creator or has manage permissions
    const result = await client.query(
      'SELECT created_by FROM interviews WHERE id = $1',
      [interviewId]
    );

    if (result.rows.length === 0) {
      throw new Error('Interview not found');
    }

    if (result.rows[0].created_by !== userId) {
      await this.checkPermission(userId, 'interviews:manage', 'interviews');
    }
  }

  private async validateParticipantManagementPermissions(
    userId: string,
    interviewId: string,
    client: PoolClient
  ): Promise<void> {
    // Check if user has participant management permissions for this interview
    const result = await client.query(`
      SELECT ip.permissions, i.created_by
      FROM interview_participants ip
      JOIN interviews i ON ip.interview_id = i.id
      WHERE ip.interview_id = $1 AND ip.user_id = $2
    `, [interviewId, userId]);

    if (result.rows.length > 0) {
      const permissions = result.rows[0].permissions;
      if (permissions.can_manage_participants || result.rows[0].created_by === userId) {
        return;
      }
    }

    await this.checkPermission(userId, 'interviews:manage', 'interviews');
  }

  private async validateInterviewStartPermissions(
    userId: string,
    interviewId: string,
    client: PoolClient
  ): Promise<void> {
    const result = await client.query(`
      SELECT ip.permissions, ip.role, i.created_by
      FROM interview_participants ip
      JOIN interviews i ON ip.interview_id = i.id
      WHERE ip.interview_id = $1 AND ip.user_id = $2
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('You are not a participant in this interview');
    }

    const participant = result.rows[0];
    if (participant.role !== 'interviewer' && participant.created_by !== userId) {
      throw new Error('Only interviewers can start the interview');
    }
  }

  private async validateInterviewEndPermissions(
    userId: string,
    interviewId: string,
    client: PoolClient
  ): Promise<void> {
    const result = await client.query(`
      SELECT ip.permissions, ip.role, i.created_by
      FROM interview_participants ip
      JOIN interviews i ON ip.interview_id = i.id
      WHERE ip.interview_id = $1 AND ip.user_id = $2
    `, [interviewId, userId]);

    if (result.rows.length === 0) {
      throw new Error('You are not a participant in this interview');
    }

    const participant = result.rows[0];
    const permissions = participant.permissions;
    
    if (!permissions.can_end_interview && participant.created_by !== userId) {
      throw new Error('You do not have permission to end this interview');
    }
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
      'interview',
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

export default InterviewService;