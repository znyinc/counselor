/**
 * User Model for MongoDB
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor' | 'admin' | 'parent';
  permissions: string[];
  profile?: {
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    location?: {
      state: string;
      district: string;
      area: 'urban' | 'rural';
    };
    preferences?: {
      language: 'english' | 'hindi';
      notifications: boolean;
    };
  };
  studentProfile?: {
    grade?: string;
    board?: string;
    interests?: string[];
    subjects?: string[];
    performance?: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['student', 'counselor', 'admin', 'parent'],
    default: 'student'
  },
  permissions: [{
    type: String,
    enum: [
      'read:profile',
      'write:profile',
      'read:recommendations',
      'write:recommendations',
      'read:analytics',
      'write:analytics',
      'read:users',
      'write:users',
      'admin:all'
    ]
  }],
  profile: {
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    location: {
      state: String,
      district: String,
      area: {
        type: String,
        enum: ['urban', 'rural']
      }
    },
    preferences: {
      language: {
        type: String,
        enum: ['english', 'hindi'],
        default: 'english'
      },
      notifications: {
        type: Boolean,
        default: true
      }
    }
  },
  studentProfile: {
    grade: {
      type: String,
      enum: ['9', '10', '11', '12', 'graduate', 'postgraduate']
    },
    board: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'Other']
    },
    interests: [String],
    subjects: [String],
    performance: {
      type: String,
      enum: ['excellent', 'good', 'average', 'needs_improvement']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
  if ((ret as any)._id !== undefined) delete (ret as any)._id;
  if ((ret as any).__v !== undefined) delete (ret as any).__v;
  if ((ret as any).password !== undefined) delete (ret as any).password;
  if ((ret as any).passwordResetToken !== undefined) delete (ret as any).passwordResetToken;
  if ((ret as any).emailVerificationToken !== undefined) delete (ret as any).emailVerificationToken;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  const lockUntil = this.lockUntil instanceof Date ? this.lockUntil.getTime() : this.lockUntil;
  return !!(lockUntil && lockUntil > Date.now());
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to set default permissions based on role
UserSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
  switch (this.role) {
    case 'student':
      this.permissions = ['read:profile', 'write:profile', 'read:recommendations'];
      break;
    case 'parent':
      this.permissions = ['read:profile', 'read:recommendations'];
      break;
    case 'counselor':
      this.permissions = ['read:profile', 'write:profile', 'read:recommendations', 'write:recommendations', 'read:analytics'];
      break;
    case 'admin':
      this.permissions = ['admin:all'];
      break;
    default:
      this.permissions = ['read:profile'];
  }
  
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate auth token
UserSchema.methods.generateAuthToken = function(): string {
  const jwt = require('jsonwebtoken');
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
    permissions: this.permissions,
    sessionId: require('uuid').v4()
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'ai-career-counseling',
    audience: 'ai-career-counseling-users'
  });
};

// Method to check if account is locked
UserSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = async function(): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we've reached max attempts and it's not locked yet, lock the account
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by credentials
UserSchema.statics.findByCredentials = async function(email: string, password: string) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (user.isLocked()) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

export const User = mongoose.model<IUser>('User', UserSchema);