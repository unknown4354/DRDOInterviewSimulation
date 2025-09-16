import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../database/connection';
import { APIResponse, PaginationParams, FilterParams } from '../../shared/types';

interface EntityConfig {
  tableName: string;
  primaryKey: string;
  requiredFields: string[];
  optionalFields: string[];
  searchableFields: string[];
  timestampFields: {
    createdAt: string;
    updatedAt: string;
  };
  softDelete?: {
    field: string;
    deletedValue: any;
  };
}

interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
  joins?: Array<{
    table: string;
    on: string;
    type?: 'INNER' | 'LEFT' | 'RIGHT';
  }>;
}

export class DatabaseService {
  private db: DatabaseConnection;
  private pool: Pool;

  // Entity configurations
  private entityConfigs: Record<string, EntityConfig> = {
    users: {
      tableName: 'users',
      primaryKey: 'id',
      requiredFields: ['username', 'email', 'full_name', 'role'],
      optionalFields: ['department', 'security_clearance', 'phone_number', 'expertise', 'is_active', 'mfa_enabled'],
      searchableFields: ['username', 'email', 'full_name', 'department'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      softDelete: {
        field: 'is_active',
        deletedValue: false
      }
    },
    interviews: {
      tableName: 'interviews',
      primaryKey: 'id',
      requiredFields: ['title', 'position', 'created_by'],
      optionalFields: ['description', 'scheduled_at', 'duration_minutes', 'status', 'interview_type', 'room_id'],
      searchableFields: ['title', 'position', 'description'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    },
    interview_participants: {
      tableName: 'interview_participants',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'user_id', 'role'],
      optionalFields: ['permissions', 'joined_at', 'left_at', 'status'],
      searchableFields: [],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    },
    questions: {
      tableName: 'questions',
      primaryKey: 'id',
      requiredFields: ['question_text', 'question_type', 'created_by'],
      optionalFields: ['category', 'difficulty_level', 'estimated_time', 'tags', 'is_active'],
      searchableFields: ['question_text', 'category', 'tags'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      softDelete: {
        field: 'is_active',
        deletedValue: false
      }
    },
    answers: {
      tableName: 'answers',
      primaryKey: 'id',
      requiredFields: ['question_id', 'interview_id', 'candidate_id', 'answer_text'],
      optionalFields: ['answer_type', 'duration_seconds', 'confidence_level', 'notes'],
      searchableFields: ['answer_text', 'notes'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    },
    question_evaluations: {
      tableName: 'question_evaluations',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'question_text', 'clarity_score', 'relevance_score'],
      optionalFields: ['difficulty_level', 'bias_indicators', 'improvement_suggestions', 'estimated_time'],
      searchableFields: ['question_text', 'improvement_suggestions'],
      timestampFields: {
        createdAt: 'evaluated_at',
        updatedAt: 'updated_at'
      }
    },
    answer_evaluations: {
      tableName: 'answer_evaluations',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'question_id', 'answer_text', 'technical_accuracy'],
      optionalFields: ['communication_clarity', 'completeness', 'confidence_level', 'key_points_covered'],
      searchableFields: ['answer_text'],
      timestampFields: {
        createdAt: 'evaluated_at',
        updatedAt: 'updated_at'
      }
    },
    chat_messages: {
      tableName: 'chat_messages',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'sender_id', 'content'],
      optionalFields: ['sender_name', 'message_type', 'reply_to', 'edited', 'reactions', 'read_by'],
      searchableFields: ['content', 'sender_name'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    },
    file_uploads: {
      tableName: 'file_uploads',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'uploaded_by', 'file_name', 'file_size'],
      optionalFields: ['original_name', 'mime_type', 'description', 'download_count', 'is_public'],
      searchableFields: ['file_name', 'original_name', 'description'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    },
    recording_sessions: {
      tableName: 'recording_sessions',
      primaryKey: 'id',
      requiredFields: ['interview_id', 'started_by', 'file_name'],
      optionalFields: ['format', 'quality', 'participants', 'status', 'processing_progress', 'ended_at'],
      searchableFields: ['file_name'],
      timestampFields: {
        createdAt: 'started_at',
        updatedAt: 'updated_at'
      }
    },
    departments: {
      tableName: 'departments',
      primaryKey: 'id',
      requiredFields: ['name', 'code'],
      optionalFields: ['description', 'parent_department', 'is_active'],
      searchableFields: ['name', 'code', 'description'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      softDelete: {
        field: 'is_active',
        deletedValue: false
      }
    },
    expertise_areas: {
      tableName: 'expertise_areas',
      primaryKey: 'id',
      requiredFields: ['name', 'category'],
      optionalFields: ['description', 'level', 'prerequisites', 'is_active'],
      searchableFields: ['name', 'category', 'description'],
      timestampFields: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      softDelete: {
        field: 'is_active',
        deletedValue: false
      }
    }
  };

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.pool = this.db.getPool();
  }

  /**
   * Generic create method for any entity
   */
  async create<T = any>(
    entityType: string,
    data: Record<string, any>,
    createdBy?: string
  ): Promise<APIResponse<T>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const config = this.getEntityConfig(entityType);
      const id = data[config.primaryKey] || uuidv4();
      
      // Prepare data with timestamps
      const insertData = {
        ...data,
        [config.primaryKey]: id,
        [config.timestampFields.createdAt]: new Date(),
        [config.timestampFields.updatedAt]: new Date()
      };

      if (createdBy) {
        insertData.created_by = createdBy;
      }

      // Build insert query
      const fields = Object.keys(insertData);
      const values = Object.values(insertData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${config.tableName} (${fields.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return {
        success: true,
        data: result.rows[0],
        message: `${entityType} created successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generic read method with filtering and pagination
   */
  async findMany<T = any>(
    entityType: string,
    options: QueryOptions = {},
    pagination?: PaginationParams
  ): Promise<APIResponse<{ items: T[]; pagination?: any }>> {
    try {
      const config = this.getEntityConfig(entityType);
      let query = this.buildSelectQuery(config, options);
      
      // Add pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query += ` LIMIT ${pagination.limit} OFFSET ${offset}`;
      }

      const result = await this.pool.query(query);
      
      // Get total count for pagination
      let totalCount = result.rows.length;
      if (pagination) {
        const countQuery = this.buildCountQuery(config, options);
        const countResult = await this.pool.query(countQuery);
        totalCount = parseInt(countResult.rows[0].count);
      }

      const responseData: any = { items: result.rows };
      
      if (pagination) {
        responseData.pagination = {
          page: pagination.page,
          limit: pagination.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / pagination.limit)
        };
      }

      return {
        success: true,
        data: responseData,
        message: `${entityType} retrieved successfully`
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic find by ID method
   */
  async findById<T = any>(
    entityType: string,
    id: string,
    options: QueryOptions = {}
  ): Promise<APIResponse<T>> {
    try {
      const config = this.getEntityConfig(entityType);
      
      const queryOptions = {
        ...options,
        where: {
          ...options.where,
          [config.primaryKey]: id
        }
      };

      const query = this.buildSelectQuery(config, queryOptions);
      const result = await this.pool.query(query);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Not found',
          message: `${entityType} not found`
        };
      }

      return {
        success: true,
        data: result.rows[0],
        message: `${entityType} retrieved successfully`
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic update method
   */
  async update<T = any>(
    entityType: string,
    id: string,
    data: Record<string, any>,
    updatedBy?: string
  ): Promise<APIResponse<T>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const config = this.getEntityConfig(entityType);
      
      // Prepare update data with timestamp
      const updateData = {
        ...data,
        [config.timestampFields.updatedAt]: new Date()
      };

      if (updatedBy) {
        updateData.updated_by = updatedBy;
      }

      // Remove primary key from update data
      delete updateData[config.primaryKey];

      // Build update query
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      const query = `
        UPDATE ${config.tableName}
        SET ${setClause}
        WHERE ${config.primaryKey} = $${fields.length + 1}
        RETURNING *
      `;

      const result = await client.query(query, [...values, id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Not found',
          message: `${entityType} not found`
        };
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: result.rows[0],
        message: `${entityType} updated successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generic delete method (soft or hard delete)
   */
  async delete(
    entityType: string,
    id: string,
    deletedBy?: string,
    hardDelete: boolean = false
  ): Promise<APIResponse<any>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const config = this.getEntityConfig(entityType);
      
      let query: string;
      let values: any[];

      if (hardDelete || !config.softDelete) {
        // Hard delete
        query = `DELETE FROM ${config.tableName} WHERE ${config.primaryKey} = $1`;
        values = [id];
      } else {
        // Soft delete
        const updateData: any = {
          [config.softDelete.field]: config.softDelete.deletedValue,
          [config.timestampFields.updatedAt]: new Date()
        };

        if (deletedBy) {
          updateData.deleted_by = deletedBy;
          updateData.deleted_at = new Date();
        }

        const fields = Object.keys(updateData);
        const fieldValues = Object.values(updateData);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        query = `
          UPDATE ${config.tableName}
          SET ${setClause}
          WHERE ${config.primaryKey} = $${fields.length + 1}
        `;
        values = [...fieldValues, id];
      }

      const result = await client.query(query, values);
      
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Not found',
          message: `${entityType} not found`
        };
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: `${entityType} deleted successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search method with full-text search capabilities
   */
  async search<T = any>(
    entityType: string,
    searchTerm: string,
    options: QueryOptions = {},
    pagination?: PaginationParams
  ): Promise<APIResponse<{ items: T[]; pagination?: any }>> {
    try {
      const config = this.getEntityConfig(entityType);
      
      if (config.searchableFields.length === 0) {
        throw new Error(`Entity ${entityType} does not support search`);
      }

      // Build search conditions
      const searchConditions = config.searchableFields
        .map(field => `${field} ILIKE '%${searchTerm}%'`)
        .join(' OR ');

      const searchOptions = {
        ...options,
        where: {
          ...options.where,
          _search: `(${searchConditions})`
        }
      };

      return this.findMany(entityType, searchOptions, pagination);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulkCreate<T = any>(
    entityType: string,
    items: Record<string, any>[],
    createdBy?: string
  ): Promise<APIResponse<T[]>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const results = [];
      for (const item of items) {
        const result = await this.create(entityType, item, createdBy);
        if (result.success) {
          results.push(result.data);
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: results,
        message: `${results.length} ${entityType} items created successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkUpdate<T = any>(
    entityType: string,
    updates: Array<{ id: string; data: Record<string, any> }>,
    updatedBy?: string
  ): Promise<APIResponse<T[]>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const results = [];
      for (const update of updates) {
        const result = await this.update(entityType, update.id, update.data, updatedBy);
        if (result.success) {
          results.push(result.data);
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: results,
        message: `${results.length} ${entityType} items updated successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkDelete(
    entityType: string,
    ids: string[],
    deletedBy?: string,
    hardDelete: boolean = false
  ): Promise<APIResponse<any>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      let successCount = 0;
      for (const id of ids) {
        const result = await this.delete(entityType, id, deletedBy, hardDelete);
        if (result.success) {
          successCount++;
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: `${successCount} ${entityType} items deleted successfully`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Custom query execution
   */
  async executeQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<APIResponse<T[]>> {
    try {
      const result = await this.pool.query(query, params);
      
      return {
        success: true,
        data: result.rows,
        message: 'Query executed successfully'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Transaction wrapper
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Private helper methods

  private getEntityConfig(entityType: string): EntityConfig {
    const config = this.entityConfigs[entityType];
    if (!config) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    return config;
  }

  private buildSelectQuery(config: EntityConfig, options: QueryOptions): string {
    const selectFields = options.select ? options.select.join(', ') : '*';
    let query = `SELECT ${selectFields} FROM ${config.tableName}`;

    // Add joins
    if (options.joins) {
      for (const join of options.joins) {
        const joinType = join.type || 'INNER';
        query += ` ${joinType} JOIN ${join.table} ON ${join.on}`;
      }
    }

    // Add where conditions
    if (options.where) {
      const conditions = this.buildWhereConditions(options.where);
      if (conditions) {
        query += ` WHERE ${conditions}`;
      }
    }

    // Add soft delete filter
    if (config.softDelete) {
      const softDeleteCondition = `${config.softDelete.field} != ${config.softDelete.deletedValue}`;
      if (options.where) {
        query += ` AND ${softDeleteCondition}`;
      } else {
        query += ` WHERE ${softDeleteCondition}`;
      }
    }

    // Add order by
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    } else {
      query += ` ORDER BY ${config.timestampFields.createdAt} DESC`;
    }

    return query;
  }

  private buildCountQuery(config: EntityConfig, options: QueryOptions): string {
    let query = `SELECT COUNT(*) as count FROM ${config.tableName}`;

    // Add joins
    if (options.joins) {
      for (const join of options.joins) {
        const joinType = join.type || 'INNER';
        query += ` ${joinType} JOIN ${join.table} ON ${join.on}`;
      }
    }

    // Add where conditions
    if (options.where) {
      const conditions = this.buildWhereConditions(options.where);
      if (conditions) {
        query += ` WHERE ${conditions}`;
      }
    }

    // Add soft delete filter
    if (config.softDelete) {
      const softDeleteCondition = `${config.softDelete.field} != ${config.softDelete.deletedValue}`;
      if (options.where) {
        query += ` AND ${softDeleteCondition}`;
      } else {
        query += ` WHERE ${softDeleteCondition}`;
      }
    }

    return query;
  }

  private buildWhereConditions(where: Record<string, any>): string {
    const conditions = [];
    
    for (const [key, value] of Object.entries(where)) {
      if (key === '_search') {
        conditions.push(value);
      } else if (Array.isArray(value)) {
        conditions.push(`${key} IN (${value.map(v => `'${v}'`).join(', ')})`);
      } else if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else {
        conditions.push(`${key} = '${value}'`);
      }
    }
    
    return conditions.join(' AND ');
  }

  /**
   * Get entity configuration for external use
   */
  public getEntityConfigurations(): Record<string, EntityConfig> {
    return { ...this.entityConfigs };
  }

  /**
   * Add or update entity configuration
   */
  public registerEntity(entityType: string, config: EntityConfig): void {
    this.entityConfigs[entityType] = config;
  }
}

export default DatabaseService;