/**
 * Secure Data Storage Utilities
 * Provides encryption and secure storage for sensitive data
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

export class SecureStorage {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 32,
  };

  private static encryptionKey: Buffer | null = null;

  /**
   * Initialize encryption key from environment variable
   */
  static initialize(): void {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (keyString.length < 64) {
      throw new Error('ENCRYPTION_KEY must be at least 64 characters long');
    }

    this.encryptionKey = Buffer.from(keyString, 'hex');
  }

  /**
   * Generate a secure encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Derive key from password using PBKDF2
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.DEFAULT_CONFIG.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(data: string, usePasswordDerivation = false): EncryptedData {
    if (!this.encryptionKey && !usePasswordDerivation) {
      throw new Error('Encryption key not initialized. Call initialize() first.');
    }

    const config = this.DEFAULT_CONFIG;
    const iv = crypto.randomBytes(config.ivLength);
    const salt = crypto.randomBytes(config.saltLength);

    let key: Buffer;
    if (usePasswordDerivation) {
      const password = process.env.ENCRYPTION_PASSWORD || 'default-password';
      key = this.deriveKey(password, salt);
    } else {
      key = this.encryptionKey!;
    }

  const cipher = crypto.createCipheriv(config.algorithm, key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // AES-GCM tag
  const tag = (cipher as any).getAuthTag ? (cipher as any).getAuthTag() : Buffer.alloc(0);

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex'),
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: EncryptedData, usePasswordDerivation = false): string {
    if (!this.encryptionKey && !usePasswordDerivation) {
      throw new Error('Encryption key not initialized. Call initialize() first.');
    }

    const config = this.DEFAULT_CONFIG;
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const salt = Buffer.from(encryptedData.salt, 'hex');

    let key: Buffer;
    if (usePasswordDerivation) {
      const password = process.env.ENCRYPTION_PASSWORD || 'default-password';
      key = this.deriveKey(password, salt);
    } else {
      key = this.encryptionKey!;
    }

    const decipher = crypto.createDecipheriv(config.algorithm, key, iv);
    if ((decipher as any).setAuthTag && tag.length) {
      (decipher as any).setAuthTag(tag);
    }

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Encrypt student profile data
   */
  static encryptStudentProfile(profile: any): any {
    const sensitiveFields = [
      'personalInfo.name',
      'socioeconomicData.location',
      'socioeconomicData.familyBackground',
      'socioeconomicData.parentOccupation',
      'constraints.familyExpectations',
    ];

    const encrypted = JSON.parse(JSON.stringify(profile));

    sensitiveFields.forEach(fieldPath => {
      const keys = fieldPath.split('.');
      let current = encrypted;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (current && typeof current === 'object' && keys[i] in current) {
          current = current[keys[i]] as any;
        } else {
          return; // Field doesn't exist
        }
        }
        if (current && typeof current === 'object') {
          const key = keys[i] as string | undefined;
          if (key && key in current) {
            current = (current as any)[key] as any;
          } else {
            current = undefined as any;
            break;
          }
      }

      const finalKey = keys[keys.length - 1];
      if (current && typeof current === 'object' && typeof current[finalKey] === 'string') {
        current[finalKey] = this.encrypt(current[finalKey]);
      }
      if (current && typeof current === 'object' && finalKey && typeof (current as any)[finalKey] === 'string') {
        (current as any)[finalKey] = this.encrypt((current as any)[finalKey]);
      }
    });

    return encrypted;
  }

  /**
   * Decrypt student profile data
   */
  static decryptStudentProfile(encryptedProfile: any): any {
    const sensitiveFields = [
      'personalInfo.name',
      'socioeconomicData.location',
      'socioeconomicData.familyBackground',
      'socioeconomicData.parentOccupation',
      'constraints.familyExpectations',
    ];

    const decrypted = JSON.parse(JSON.stringify(encryptedProfile));

    sensitiveFields.forEach(fieldPath => {
      const keys = fieldPath.split('.');
      let current = decrypted;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (current && typeof current === 'object' && keys[i] in current) {
          current = current[keys[i]] as any;
        } else {
          return; // Field doesn't exist
        }
        }
        if (current && typeof current === 'object') {
          const key = keys[i] as string | undefined;
          if (key && key in current) {
            current = (current as any)[key] as any;
          } else {
            current = undefined as any;
            break;
          }
      }

      const finalKey = keys[keys.length - 1];
      if (current && typeof current === 'object' && current[finalKey] && typeof current[finalKey] === 'object' && (current[finalKey] as any).encrypted) {
        current[finalKey] = this.decrypt(current[finalKey]);
      }
      if (current && typeof current === 'object' && finalKey && (current as any)[finalKey] && typeof (current as any)[finalKey] === 'object' && ((current as any)[finalKey] as any).encrypted) {
        (current as any)[finalKey] = this.decrypt((current as any)[finalKey]);
      }
    });

    return decrypted;
  }

  /**
   * Anonymize data for analytics
   */
  static anonymizeForAnalytics(profile: any): any {
    const anonymized = {
      demographics: {
        grade: profile.personalInfo?.grade,
        board: profile.personalInfo?.board,
        age: profile.personalInfo?.age,
        gender: profile.personalInfo?.gender,
        category: profile.personalInfo?.category,
        physicallyDisabled: profile.personalInfo?.physicallyDisabled,
        // Location anonymized to state level only
        state: this.extractState(profile.socioeconomicData?.location),
      },
      academic: {
        interests: profile.academicData?.interests,
        subjects: profile.academicData?.subjects,
        performance: profile.academicData?.performance,
        extracurricularCount: profile.academicData?.extracurricularActivities?.length || 0,
      },
      socioeconomic: {
        incomeRange: profile.familyIncome,
        areaType: profile.socioeconomicData?.ruralUrban,
        internetAccess: profile.socioeconomicData?.internetAccess,
        deviceCount: profile.socioeconomicData?.deviceAccess?.length || 0,
        householdSize: profile.socioeconomicData?.householdSize,
      },
      aspirations: {
        careerFields: profile.aspirations?.preferredCareers,
        salaryExpectations: profile.aspirations?.salaryExpectations,
        workLifeBalance: profile.aspirations?.workLifeBalance,
      },
      constraints: {
        hasFinancialConstraints: profile.constraints?.financialConstraints,
        hasLocationConstraints: profile.constraints?.locationConstraints?.length > 0,
        hasTimeConstraints: Boolean(profile.constraints?.timeConstraints),
      },
      metadata: {
        sessionId: this.generateUUID(),
        timestamp: new Date().toISOString(),
        language: profile.personalInfo?.languagePreference,
      },
    };

    return anonymized;
  }

  /**
   * Extract state from location string
   */
  public static extractState(location?: string): string {
    if (!location) return 'Unknown';

    // Common Indian state patterns
    const statePatterns = [
      /Maharashtra/i,
      /Karnataka/i,
      /Tamil Nadu/i,
      /Gujarat/i,
      /Rajasthan/i,
      /Uttar Pradesh/i,
      /Madhya Pradesh/i,
      /West Bengal/i,
      /Bihar/i,
      /Odisha/i,
      /Telangana/i,
      /Andhra Pradesh/i,
      /Kerala/i,
      /Punjab/i,
      /Haryana/i,
      /Delhi/i,
      /Goa/i,
      /Himachal Pradesh/i,
      /Uttarakhand/i,
      /Jharkhand/i,
      /Chhattisgarh/i,
      /Assam/i,
    ];

    for (const pattern of statePatterns) {
      const match = location.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Other';
  }

  /**
   * Secure data deletion (overwrite with random data)
   */
  static secureDelete(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string with random data
      const randomData = crypto.randomBytes(data.length).toString('hex');
      data = randomData;
    } else if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        this.secureDelete(data[key]);
        delete data[key];
      });
    }
  }

  /**
   * Generate data retention policy compliant timestamp
   */
  static generateRetentionTimestamp(retentionPeriodDays = 365): Date {
    const now = new Date();
    return new Date(now.getTime() + (retentionPeriodDays * 24 * 60 * 60 * 1000));
  }

  /**
   * Check if data should be deleted based on retention policy
   */
  static shouldDeleteData(createdAt: Date, retentionPeriodDays = 365): boolean {
    const now = new Date();
    const retentionEnd = new Date(createdAt.getTime() + (retentionPeriodDays * 24 * 60 * 60 * 1000));
    return now > retentionEnd;
  }

  /**
   * Create audit log entry
   */
  static createAuditLog(action: string, userId: string, data: any): any {
    return {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      action,
      userId,
      dataHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
      ipAddress: 'masked', // IP should be masked for privacy
      userAgent: 'masked', // User agent should be masked
    };
  }
}

export default SecureStorage;