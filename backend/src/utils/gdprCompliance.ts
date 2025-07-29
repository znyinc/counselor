/**
 * GDPR Compliance Utilities
 * Provides data protection and privacy compliance features
 */

import { SecureStorage } from './secureStorage';

export interface DataSubject {
  id: string;
  email?: string;
  sessionId?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalDataRecord {
  id: string;
  subjectId: string;
  dataType: string;
  data: any;
  purpose: string;
  legalBasis: string;
  retentionPeriod: number; // in days
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ConsentRecord {
  id: string;
  subjectId: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  withdrawnDate?: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
}

export interface DataProcessingLog {
  id: string;
  subjectId: string;
  action: string;
  purpose: string;
  legalBasis: string;
  dataTypes: string[];
  timestamp: Date;
  userId?: string;
  ipAddress: string;
}

export class GDPRCompliance {
  private static readonly RETENTION_PERIODS = {
    STUDENT_PROFILE: 365, // 1 year
    ANALYTICS_DATA: 1095, // 3 years
    AUDIT_LOGS: 2555, // 7 years
    CONSENT_RECORDS: 2555, // 7 years
  };

  private static readonly LEGAL_BASIS = {
    CONSENT: 'consent',
    CONTRACT: 'contract',
    LEGAL_OBLIGATION: 'legal_obligation',
    VITAL_INTERESTS: 'vital_interests',
    PUBLIC_TASK: 'public_task',
    LEGITIMATE_INTERESTS: 'legitimate_interests',
  };

  private static readonly DATA_CATEGORIES = {
    PERSONAL_IDENTIFIERS: 'personal_identifiers',
    DEMOGRAPHIC_DATA: 'demographic_data',
    ACADEMIC_DATA: 'academic_data',
    SOCIOECONOMIC_DATA: 'socioeconomic_data',
    BEHAVIORAL_DATA: 'behavioral_data',
    TECHNICAL_DATA: 'technical_data',
  };

  /**
   * Create consent record
   */
  static createConsentRecord(
    subjectId: string,
    purpose: string,
    consentGiven: boolean,
    ipAddress: string,
    userAgent: string,
    version = '1.0'
  ): ConsentRecord {
    return {
      id: SecureStorage.generateUUID(),
      subjectId,
      purpose,
      consentGiven,
      consentDate: new Date(),
      version,
      ipAddress: this.anonymizeIP(ipAddress),
      userAgent: this.anonymizeUserAgent(userAgent),
    };
  }

  /**
   * Withdraw consent
   */
  static withdrawConsent(consentRecord: ConsentRecord): ConsentRecord {
    return {
      ...consentRecord,
      consentGiven: false,
      withdrawnDate: new Date(),
    };
  }

  /**
   * Check if consent is valid
   */
  static isConsentValid(consentRecord: ConsentRecord): boolean {
    if (!consentRecord.consentGiven) {
      return false;
    }

    if (consentRecord.withdrawnDate) {
      return false;
    }

    // Check if consent is not too old (GDPR recommends refreshing consent periodically)
    const consentAge = Date.now() - consentRecord.consentDate.getTime();
    const maxAge = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds

    return consentAge < maxAge;
  }

  /**
   * Create personal data record
   */
  static createPersonalDataRecord(
    subjectId: string,
    dataType: string,
    data: any,
    purpose: string,
    legalBasis: string,
    retentionPeriod?: number
  ): PersonalDataRecord {
    return {
      id: SecureStorage.generateUUID(),
      subjectId,
      dataType,
      data: SecureStorage.encrypt(JSON.stringify(data)),
      purpose,
      legalBasis,
      retentionPeriod: retentionPeriod || this.RETENTION_PERIODS.STUDENT_PROFILE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create data processing log
   */
  static createDataProcessingLog(
    subjectId: string,
    action: string,
    purpose: string,
    legalBasis: string,
    dataTypes: string[],
    userId?: string,
    ipAddress?: string
  ): DataProcessingLog {
    return {
      id: SecureStorage.generateUUID(),
      subjectId,
      action,
      purpose,
      legalBasis,
      dataTypes,
      timestamp: new Date(),
      userId,
      ipAddress: ipAddress ? this.anonymizeIP(ipAddress) : 'unknown',
    };
  }

  /**
   * Anonymize IP address (remove last octet for IPv4, last 80 bits for IPv6)
   */
  static anonymizeIP(ipAddress: string): string {
    if (!ipAddress) return 'unknown';

    // IPv4
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    // IPv6
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::`;
      }
    }

    return 'anonymized';
  }

  /**
   * Anonymize user agent string
   */
  static anonymizeUserAgent(userAgent: string): string {
    if (!userAgent) return 'unknown';

    // Extract only browser family and major version
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    if (browserMatch) {
      return `${browserMatch[1]}/${browserMatch[2]}`;
    }

    return 'unknown-browser';
  }

  /**
   * Generate data export for subject access request
   */
  static generateDataExport(
    subjectId: string,
    personalDataRecords: PersonalDataRecord[],
    consentRecords: ConsentRecord[],
    processingLogs: DataProcessingLog[]
  ): any {
    const export_data = {
      subject_id: subjectId,
      export_date: new Date().toISOString(),
      personal_data: personalDataRecords.map(record => ({
        id: record.id,
        data_type: record.dataType,
        data: JSON.parse(SecureStorage.decrypt(record.data)),
        purpose: record.purpose,
        legal_basis: record.legalBasis,
        created_at: record.createdAt.toISOString(),
        updated_at: record.updatedAt.toISOString(),
      })),
      consent_records: consentRecords.map(record => ({
        purpose: record.purpose,
        consent_given: record.consentGiven,
        consent_date: record.consentDate.toISOString(),
        withdrawn_date: record.withdrawnDate?.toISOString(),
        version: record.version,
      })),
      processing_activities: processingLogs.map(log => ({
        action: log.action,
        purpose: log.purpose,
        legal_basis: log.legalBasis,
        data_types: log.dataTypes,
        timestamp: log.timestamp.toISOString(),
      })),
      retention_information: {
        student_profile: `${this.RETENTION_PERIODS.STUDENT_PROFILE} days`,
        analytics_data: `${this.RETENTION_PERIODS.ANALYTICS_DATA} days`,
        audit_logs: `${this.RETENTION_PERIODS.AUDIT_LOGS} days`,
      },
      rights_information: {
        right_to_access: 'You can request access to your personal data',
        right_to_rectification: 'You can request correction of inaccurate data',
        right_to_erasure: 'You can request deletion of your data',
        right_to_restrict_processing: 'You can request restriction of processing',
        right_to_data_portability: 'You can request data in a portable format',
        right_to_object: 'You can object to processing based on legitimate interests',
        right_to_withdraw_consent: 'You can withdraw consent at any time',
      },
    };

    return export_data;
  }

  /**
   * Check if data should be deleted based on retention policy
   */
  static shouldDeleteData(record: PersonalDataRecord): boolean {
    const now = new Date();
    const retentionEnd = new Date(
      record.createdAt.getTime() + (record.retentionPeriod * 24 * 60 * 60 * 1000)
    );
    return now > retentionEnd;
  }

  /**
   * Pseudonymize personal data
   */
  static pseudonymizeData(data: any, subjectId: string): any {
    const pseudonym = this.generatePseudonym(subjectId);
    
    const pseudonymized = JSON.parse(JSON.stringify(data));
    
    // Replace identifiable information with pseudonyms
    if (pseudonymized.personalInfo) {
      if (pseudonymized.personalInfo.name) {
        pseudonymized.personalInfo.name = `Student_${pseudonym}`;
      }
    }
    
    if (pseudonymized.socioeconomicData) {
      if (pseudonymized.socioeconomicData.location) {
        // Keep only state-level information
        pseudonymized.socioeconomicData.location = SecureStorage.extractState(
          pseudonymized.socioeconomicData.location
        );
      }
      
      if (pseudonymized.socioeconomicData.familyBackground) {
        pseudonymized.socioeconomicData.familyBackground = '[PSEUDONYMIZED]';
      }
    }

    return pseudonymized;
  }

  /**
   * Generate pseudonym from subject ID
   */
  private static generatePseudonym(subjectId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(subjectId).digest('hex').substring(0, 8);
  }

  /**
   * Validate data minimization compliance
   */
  static validateDataMinimization(data: any, purpose: string): boolean {
    const allowedFields = this.getAllowedFieldsForPurpose(purpose);
    const dataFields = this.extractFieldNames(data);
    
    // Check if all data fields are allowed for the purpose
    return dataFields.every(field => allowedFields.includes(field));
  }

  /**
   * Get allowed fields for specific purpose
   */
  private static getAllowedFieldsForPurpose(purpose: string): string[] {
    const fieldMappings = {
      'career_recommendation': [
        'personalInfo.grade',
        'personalInfo.board',
        'personalInfo.age',
        'academicData.interests',
        'academicData.subjects',
        'academicData.performance',
        'socioeconomicData.ruralUrban',
        'socioeconomicData.internetAccess',
        'familyIncome',
        'aspirations',
      ],
      'analytics': [
        'personalInfo.grade',
        'personalInfo.board',
        'personalInfo.age',
        'personalInfo.gender',
        'personalInfo.category',
        'academicData.interests',
        'academicData.performance',
        'socioeconomicData.ruralUrban',
        'familyIncome',
      ],
      'research': [
        'personalInfo.grade',
        'personalInfo.board',
        'personalInfo.age',
        'personalInfo.gender',
        'academicData.interests',
        'academicData.performance',
        'socioeconomicData.ruralUrban',
      ],
    };

    return fieldMappings[purpose] || [];
  }

  /**
   * Extract field names from nested object
   */
  private static extractFieldNames(obj: any, prefix = ''): string[] {
    const fields: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          fields.push(...this.extractFieldNames(obj[key], fullKey));
        } else {
          fields.push(fullKey);
        }
      }
    }
    
    return fields;
  }

  /**
   * Generate privacy notice
   */
  static generatePrivacyNotice(): any {
    return {
      controller: {
        name: 'AI Career Counseling Tool',
        contact: 'privacy@ai-career-counseling.com',
        dpo_contact: 'dpo@ai-career-counseling.com',
      },
      purposes: [
        {
          purpose: 'Career Recommendation',
          legal_basis: this.LEGAL_BASIS.CONSENT,
          data_categories: [
            this.DATA_CATEGORIES.PERSONAL_IDENTIFIERS,
            this.DATA_CATEGORIES.DEMOGRAPHIC_DATA,
            this.DATA_CATEGORIES.ACADEMIC_DATA,
            this.DATA_CATEGORIES.SOCIOECONOMIC_DATA,
          ],
          retention_period: `${this.RETENTION_PERIODS.STUDENT_PROFILE} days`,
          recipients: ['AI Processing Service', 'Career Database'],
        },
        {
          purpose: 'Analytics and Research',
          legal_basis: this.LEGAL_BASIS.LEGITIMATE_INTERESTS,
          data_categories: [
            this.DATA_CATEGORIES.DEMOGRAPHIC_DATA,
            this.DATA_CATEGORIES.ACADEMIC_DATA,
            this.DATA_CATEGORIES.BEHAVIORAL_DATA,
          ],
          retention_period: `${this.RETENTION_PERIODS.ANALYTICS_DATA} days`,
          recipients: ['Analytics Service'],
        },
      ],
      rights: [
        'Right to access your personal data',
        'Right to rectify inaccurate data',
        'Right to erase your data',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object to processing',
        'Right to withdraw consent',
        'Right to lodge a complaint with supervisory authority',
      ],
      automated_decision_making: {
        exists: true,
        description: 'AI-powered career recommendation system',
        logic: 'Machine learning algorithms analyze profile data to suggest careers',
        significance: 'Recommendations influence career choices',
        right_to_human_intervention: true,
      },
      international_transfers: {
        exists: false,
        safeguards: 'Not applicable - data processed within EU/EEA',
      },
      contact_information: {
        privacy_officer: 'privacy@ai-career-counseling.com',
        data_protection_officer: 'dpo@ai-career-counseling.com',
        supervisory_authority: 'Local Data Protection Authority',
      },
    };
  }

  /**
   * Generate data breach notification
   */
  static generateBreachNotification(
    breachType: string,
    affectedSubjects: number,
    dataCategories: string[],
    riskLevel: 'low' | 'medium' | 'high'
  ): any {
    return {
      breach_id: SecureStorage.generateUUID(),
      notification_date: new Date().toISOString(),
      breach_type: breachType,
      affected_subjects: affectedSubjects,
      data_categories: dataCategories,
      risk_level: riskLevel,
      measures_taken: [
        'Immediate containment of the breach',
        'Investigation of the root cause',
        'Implementation of additional security measures',
        'Notification of supervisory authority',
        'Individual notifications where required',
      ],
      timeline: {
        breach_discovered: new Date().toISOString(),
        authority_notified: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
        individuals_notified: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}

export default GDPRCompliance;