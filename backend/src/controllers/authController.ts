/**
 * Authentication Controller
 * Handles user registration, login, logout, and profile management
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { User, IUser } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authentication';
import { CustomError } from '../middleware/errorHandler';
import { SecureStorage } from '../utils/secureStorage';
import crypto from 'crypto';

export class AuthController {
  /**
   * Register a new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { email, password, firstName, lastName, role = 'student', profile, studentProfile } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        profile,
        studentProfile,
        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await user.save();

      // Generate auth token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token,
          message: 'User registered successfully'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Login user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { email, password } = req.body;

      // Find user by credentials (includes password comparison and account locking)
      const user = await (User as any).findByCredentials(email, password);

      // Generate auth token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token,
          message: 'Login successful'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Login error:', error);
      
      let statusCode = 401;
      let errorCode = 'LOGIN_FAILED';
      let message = 'Invalid credentials';

      if (error instanceof Error) {
        if (error.message.includes('locked')) {
          statusCode = 423;
          errorCode = 'ACCOUNT_LOCKED';
          message = 'Account temporarily locked due to too many failed login attempts';
        }
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Logout user (client-side token invalidation)
   */
  public async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // In a more sophisticated implementation, you might maintain a blacklist of tokens
      // For now, we'll just return success and let the client handle token removal
      
      res.json({
        success: true,
        data: {
          message: 'Logout successful'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to fetch user profile',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { firstName, lastName, profile, studentProfile } = req.body;
      
      const user = await User.findById(req.user?.id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Update allowed fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (profile) user.profile = { ...user.profile, ...profile };
      if (studentProfile) user.studentProfile = { ...user.studentProfile, ...studentProfile };

      await user.save();

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          message: 'Profile updated successfully'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update profile',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Change password
   */
  public async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.user?.id).select('+password');
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password is incorrect',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: 'Failed to change password',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { email } = req.body;
      
      const user = await User.findOne({ email, isActive: true });
      
      if (!user) {
        // Don't reveal whether user exists or not
        res.json({
          success: true,
          data: {
            message: 'If an account with that email exists, a password reset link has been sent'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await user.save();

      // In a real implementation, you would send an email here
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        data: {
          message: 'If an account with that email exists, a password reset link has been sent'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_REQUEST_FAILED',
          message: 'Failed to process password reset request',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const { token, newPassword } = req.body;
      
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
        isActive: true
      });
      
      if (!user) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: 'Invalid or expired reset token',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Update password and clear reset token
      user.password = newPassword;
  (user as any).passwordResetToken = undefined;
  (user as any).passwordResetExpires = undefined;
      
      // Reset login attempts if any
      await user.resetLoginAttempts();
      
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'Password reset successfully'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: 'Failed to reset password',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Verify email
   */
  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
        isActive: true
      });
      
      if (!user) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VERIFICATION_TOKEN',
            message: 'Invalid or expired verification token',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Mark email as verified
      user.isEmailVerified = true;
  (user as any).emailVerificationToken = undefined;
  (user as any).emailVerificationExpires = undefined;
      
      await user.save();

      res.json({
        success: true,
        data: {
          message: 'Email verified successfully'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: 'Failed to verify email',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get user statistics (admin only)
   */
  public async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const totalUsers = await User.countDocuments({ isActive: true });
      const usersByRole = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      const recentUsers = await User.countDocuments({
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      const verifiedUsers = await User.countDocuments({
        isActive: true,
        isEmailVerified: true
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentUsers,
          verifiedUsers,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'USER_STATS_FAILED',
          message: 'Failed to fetch user statistics',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}