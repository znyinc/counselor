/**
 * MongoDB Connection Service
 */

import mongoose from 'mongoose';

export class MongoService {
  private static instance: MongoService;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoService {
    if (!MongoService.instance) {
      MongoService.instance = new MongoService();
    }
    return MongoService.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('MongoDB already connected');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-career-counseling';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
  // bufferMaxEntries removed: not a valid ConnectOptions in current mongoose types
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check connection status
   */
  public isMongoConnected(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status details
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  } {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  /**
   * Create default admin user if none exists
   */
  public async createDefaultAdmin(): Promise<void> {
    try {
      const { User } = await import('../models/User');
      
      const adminExists = await User.findOne({ role: 'admin' });
      
      if (!adminExists) {
        const defaultAdmin = new User({
          email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@career-counseling.com',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin',
          isEmailVerified: true,
          profile: {
            preferences: {
              language: 'english',
              notifications: true
            }
          }
        });

        await defaultAdmin.save();
        console.log('✅ Default admin user created');
        console.log(`📧 Admin Email: ${defaultAdmin.email}`);
        console.log(`🔑 Admin Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123'}`);
      }
    } catch (error) {
      console.error('❌ Error creating default admin:', error);
    }
  }

  /**
   * Initialize database with indexes and default data
   */
  public async initialize(): Promise<void> {
    try {
      await this.connect();
      await this.createDefaultAdmin();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Health check for MongoDB
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      readyState: number;
      responseTime?: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      if (!this.isMongoConnected()) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            readyState: mongoose.connection.readyState
          }
        };
      }

      // Test database operation
      if (mongoose.connection && mongoose.connection.db && typeof mongoose.connection.db.admin === 'function') {
        await mongoose.connection.db.admin().ping();
      } else {
        console.warn('mongoose.connection.db is not available to ping');
      }
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        details: {
          connected: true,
          readyState: mongoose.connection.readyState,
          responseTime
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          readyState: mongoose.connection.readyState
        }
      };
    }
  }
}

export default MongoService;