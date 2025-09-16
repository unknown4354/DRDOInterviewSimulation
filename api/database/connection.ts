// Database connection and configuration for DRDO system

import { Pool, PoolClient, QueryResult } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'drdo_interview_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
};

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create PostgreSQL connection pool
export const pgPool = new Pool(pgConfig);

// Create Redis client
export const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

// Database connection class
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pgPool: Pool;
  private redisClient: any;
  private isConnected: boolean = false;

  private constructor() {
    this.pgPool = pgPool;
    this.redisClient = redisClient;
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Initialize database connections
  public async connect(): Promise<void> {
    try {
      // Test PostgreSQL connection with retry logic
      let pgConnected = false;
      let pgRetries = 3;
      
      while (!pgConnected && pgRetries > 0) {
        try {
          const pgClient = await this.pgPool.connect();
          await pgClient.query('SELECT NOW()');
          pgClient.release();
          pgConnected = true;
          console.log('✅ PostgreSQL connected successfully');
        } catch (pgError) {
          pgRetries--;
          console.warn(`PostgreSQL connection attempt failed, retries left: ${pgRetries}`, pgError);
          if (pgRetries === 0) throw pgError;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }

      // Connect to Redis with retry logic
      let redisConnected = false;
      let redisRetries = 3;
      
      while (!redisConnected && redisRetries > 0) {
        try {
          await this.redisClient.connect();
          redisConnected = true;
          console.log('✅ Redis connected successfully');
        } catch (redisError) {
          redisRetries--;
          console.warn(`Redis connection attempt failed, retries left: ${redisRetries}`, redisError);
          if (redisRetries === 0) {
            console.warn('⚠️ Redis connection failed, continuing without cache');
            break; // Continue without Redis if it fails
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }

      this.isConnected = true;
    } catch (error) {
      console.error('❌ Database connection failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Execute PostgreSQL query
  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pgPool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 5000) { // Log slow queries
        console.warn('Slow query detected:', { text: text.substring(0, 100), duration, rows: result.rowCount });
      } else {
        console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Query error:', {
        text: text.substring(0, 100),
        params: params ? JSON.stringify(params).substring(0, 100) : undefined,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Execute query with transaction
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pgPool.connect();
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

  // Redis operations
  public async setCache(key: string, value: any, expireInSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await this.redisClient.setEx(key, expireInSeconds, serializedValue);
    } else {
      await this.redisClient.set(key, serializedValue);
    }
  }

  public async getCache(key: string): Promise<any> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  public async deleteCache(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  public async deleteCachePattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  // Health check
  public async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const health = { postgres: false, redis: false };

    try {
      await this.query('SELECT 1');
      health.postgres = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    try {
      await this.redisClient.ping();
      health.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return health;
  }

  // Close connections
  public async close(): Promise<void> {
    try {
      await this.pgPool.end();
      await this.redisClient.quit();
      this.isConnected = false;
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  public get connected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Initialize database connection
db.connect().catch((error) => {
  console.error('Failed to initialize database connection:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});

export default db;