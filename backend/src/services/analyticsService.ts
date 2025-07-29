/**
 * Analytics Service for collecting and processing anonymized student data
 * Handles data aggregation, privacy compliance, and trend analysis
 */

import { StudentProfile } from '../types/studentProfile';
import { CareerRecommendation } from '../types/careerRecommendation';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface AnalyticsEntry {
  id: string;
  timestamp: string;
  anonymizedData: {
    profileHash: string; // Anonymized profile identifier
    demographics: {
      grade: string;
      board: string;
      location: string;
      ruralUrban: 'rural' | 'urban';
      languagePreference: 'hindi' | 'english';
      category?: string;
      gender?: string;
    };
    socioeconomic: {
      incomeRange: string;
      familyBackground: string;
      economicFactors: string[];
      internetAccess: boolean;
      deviceAccess: string[];
    };
    academic: {
      interests: string[];
      subjects: string[];
      performance: string;
      favoriteSubjects: string[];
      difficultSubjects: string[];
      extracurricularActivities: string[];
    };
    recommendations: {
      totalCount: number;
      averageMatchScore: number;
      topCareerTitles: string[];
      demandLevels: string[];
      averageSalaryRanges: number[];
    };
    processing: {
      aiModel: string;
      processingTime: number;
      generatedAt: string;
    };
  };
}

export interface AnalyticsAggregation {
  totalProfiles: number;
  dateRange: {
    from: string;
    to: string;
  };
  demographics: {
    byGrade: Record<string, number>;
    byBoard: Record<string, number>;
    byLocation: Record<string, number>;
    byRuralUrban: Record<string, number>;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
    byGender: Record<string, number>;
  };
  socioeconomic: {
    byIncomeRange: Record<string, number>;
    byInternetAccess: Record<string, number>;
    byDeviceAccess: Record<string, number>;
    economicFactorsTrends: Record<string, number>;
  };
  academic: {
    popularInterests: Record<string, number>;
    popularSubjects: Record<string, number>;
    performanceDistribution: Record<string, number>;
    extracurricularTrends: Record<string, number>;
  };
  recommendations: {
    topCareers: Record<string, number>;
    averageMatchScores: {
      overall: number;
      byGrade: Record<string, number>;
      byBoard: Record<string, number>;
      byLocation: Record<string, number>;
    };
    demandLevelDistribution: Record<string, number>;
    salaryTrends: {
      averageEntry: number;
      averageMid: number;
      averageSenior: number;
      byCareer: Record<string, { entry: number; mid: number; senior: number }>;
    };
  };
  processing: {
    averageProcessingTime: number;
    aiModelUsage: Record<string, number>;
    successRate: number;
  };
}

export interface AnalyticsFilter {
  dateFrom?: string;
  dateTo?: string;
  grade?: string;
  board?: string;
  location?: string;
  ruralUrban?: 'rural' | 'urban';
  languagePreference?: 'hindi' | 'english';
  incomeRange?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardData {
  summary: {
    totalUsers: number;
    totalRecommendations: number;
    averageMatchScore: number;
    topCareer: string;
    growthRate: number;
  };
  trends: {
    dailyUsers: Array<{ date: string; count: number }>;
    popularCareers: Array<{ career: string; count: number; percentage: number }>;
    locationDistribution: Array<{ location: string; count: number; percentage: number }>;
    gradeDistribution: Array<{ grade: string; count: number; percentage: number }>;
  };
  insights: {
    ruralVsUrban: {
      rural: { count: number; topCareers: string[] };
      urban: { count: number; topCareers: string[] };
    };
    languagePreference: {
      hindi: { count: number; percentage: number };
      english: { count: number; percentage: number };
    };
    incomeImpact: Array<{
      range: string;
      count: number;
      averageMatchScore: number;
      topCareers: string[];
    }>;
  };
}

export class AnalyticsService {
  private dataPath: string;
  private initialized: boolean = false;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'analytics');
    this.initializeStorage();
  }

  /**
   * Initialize analytics storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
      this.initialized = true;
      console.log('Analytics storage initialized at:', this.dataPath);
    } catch (error) {
      console.error('Failed to initialize analytics storage:', error);
      throw error;
    }
  }

  /**
   * Collect anonymized analytics data from student profile and recommendations
   */
  async collectAnalytics(
    profile: StudentProfile,
    recommendations: CareerRecommendation[],
    processingMetadata: {
      aiModel: string;
      processingTime: number;
      generatedAt: string;
    }
  ): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initializeStorage();
      }

      // Create anonymized analytics entry
      const analyticsEntry: AnalyticsEntry = {
        id: this.generateAnalyticsId(),
        timestamp: new Date().toISOString(),
        anonymizedData: {
          profileHash: this.anonymizeProfileId(profile.id),
          demographics: {
            grade: profile.personalInfo.grade,
            board: profile.personalInfo.board,
            location: this.anonymizeLocation(profile.socioeconomicData.location),
            ruralUrban: profile.socioeconomicData.ruralUrban,
            languagePreference: profile.personalInfo.languagePreference,
            category: profile.personalInfo.category,
            gender: profile.personalInfo.gender
          },
          socioeconomic: {
            incomeRange: profile.familyIncome,
            familyBackground: this.anonymizeFamilyBackground(profile.socioeconomicData.familyBackground),
            economicFactors: profile.socioeconomicData.economicFactors,
            internetAccess: profile.socioeconomicData.internetAccess,
            deviceAccess: profile.socioeconomicData.deviceAccess
          },
          academic: {
            interests: profile.academicData.interests,
            subjects: profile.academicData.subjects,
            performance: profile.academicData.performance,
            favoriteSubjects: profile.academicData.favoriteSubjects,
            difficultSubjects: profile.academicData.difficultSubjects,
            extracurricularActivities: profile.academicData.extracurricularActivities
          },
          recommendations: {
            totalCount: recommendations.length,
            averageMatchScore: this.calculateAverageMatchScore(recommendations),
            topCareerTitles: recommendations.slice(0, 3).map(r => r.title),
            demandLevels: recommendations.map(r => r.prospects.demandLevel),
            averageSalaryRanges: recommendations.map(r => r.prospects.averageSalary.entry)
          },
          processing: {
            aiModel: processingMetadata.aiModel,
            processingTime: processingMetadata.processingTime,
            generatedAt: processingMetadata.generatedAt
          }
        }
      };

      // Store analytics entry
      await this.storeAnalyticsEntry(analyticsEntry);

      console.log(`Analytics data collected for profile: ${analyticsEntry.anonymizedData.profileHash}`);

    } catch (error) {
      console.error('Failed to collect analytics data:', error);
      // Don't throw error to avoid affecting main application flow
    }
  }

  /**
   * Get aggregated analytics data with optional filtering
   */
  async getAggregatedData(filter: AnalyticsFilter = {}): Promise<AnalyticsAggregation> {
    try {
      const entries = await this.loadAnalyticsEntries(filter);
      return this.aggregateData(entries, filter);
    } catch (error) {
      console.error('Failed to get aggregated analytics data:', error);
      throw error;
    }
  }

  /**
   * Generate dashboard data for visualization
   */
  async getDashboardData(filter: AnalyticsFilter = {}): Promise<DashboardData> {
    try {
      const aggregatedData = await this.getAggregatedData(filter);
      return this.generateDashboardData(aggregatedData);
    } catch (error) {
      console.error('Failed to generate dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get analytics statistics
   */
  async getAnalyticsStats(): Promise<{
    totalEntries: number;
    dateRange: { from: string; to: string };
    storageSize: number;
    lastUpdated: string;
  }> {
    try {
      const entries = await this.loadAnalyticsEntries();
      const stats = await fs.stat(this.dataPath);
      
      const dates = entries.map(e => e.timestamp).sort();
      
      return {
        totalEntries: entries.length,
        dateRange: {
          from: dates[0] || new Date().toISOString(),
          to: dates[dates.length - 1] || new Date().toISOString()
        },
        storageSize: stats.size,
        lastUpdated: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error('Failed to get analytics stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old analytics data (privacy compliance)
   */
  async cleanupOldData(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const entries = await this.loadAnalyticsEntries();
      const filteredEntries = entries.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
      
      const removedCount = entries.length - filteredEntries.length;
      
      if (removedCount > 0) {
        await this.saveAnalyticsEntries(filteredEntries);
        console.log(`Cleaned up ${removedCount} old analytics entries`);
      }
      
      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup old analytics data:', error);
      throw error;
    }
  }

  /**
   * Export analytics data (for compliance or backup)
   */
  async exportData(filter: AnalyticsFilter = {}): Promise<AnalyticsEntry[]> {
    try {
      return await this.loadAnalyticsEntries(filter);
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateAnalyticsId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private anonymizeProfileId(profileId: string): string {
    return crypto.createHash('sha256').update(profileId).digest('hex').substring(0, 16);
  }

  private anonymizeLocation(location: string): string {
    // Keep state/region but remove specific city details
    const locationParts = location.split(',');
    if (locationParts.length > 1) {
      return locationParts[locationParts.length - 1].trim(); // Return state/region
    }
    return location;
  }

  private anonymizeFamilyBackground(background: string): string {
    // Categorize family background into general categories
    const categories = {
      'business': ['business', 'entrepreneur', 'shop', 'trade'],
      'service': ['government', 'private', 'service', 'job'],
      'agriculture': ['farmer', 'agriculture', 'farming'],
      'professional': ['doctor', 'engineer', 'teacher', 'lawyer'],
      'other': []
    };

    const lowerBackground = background.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerBackground.includes(keyword))) {
        return category;
      }
    }
    return 'other';
  }

  private calculateAverageMatchScore(recommendations: CareerRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    const total = recommendations.reduce((sum, rec) => sum + rec.matchScore, 0);
    return Math.round(total / recommendations.length);
  }

  private async storeAnalyticsEntry(entry: AnalyticsEntry): Promise<void> {
    const filename = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.dataPath, filename);
    
    try {
      // Load existing entries for the day
      let entries: AnalyticsEntry[] = [];
      try {
        const data = await fs.readFile(filepath, 'utf-8');
        entries = JSON.parse(data);
      } catch {
        // File doesn't exist, start with empty array
      }
      
      // Add new entry
      entries.push(entry);
      
      // Save updated entries
      await fs.writeFile(filepath, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error('Failed to store analytics entry:', error);
      throw error;
    }
  }

  private async loadAnalyticsEntries(filter: AnalyticsFilter = {}): Promise<AnalyticsEntry[]> {
    try {
      const files = await fs.readdir(this.dataPath);
      const analyticsFiles = files.filter(file => file.startsWith('analytics_') && file.endsWith('.json'));
      
      let allEntries: AnalyticsEntry[] = [];
      
      for (const file of analyticsFiles) {
        try {
          const filepath = path.join(this.dataPath, file);
          const data = await fs.readFile(filepath, 'utf-8');
          const entries: AnalyticsEntry[] = JSON.parse(data);
          allEntries.push(...entries);
        } catch (error) {
          console.error(`Failed to load analytics file ${file}:`, error);
        }
      }
      
      // Apply filters
      return this.applyFilters(allEntries, filter);
    } catch (error) {
      console.error('Failed to load analytics entries:', error);
      return [];
    }
  }

  private async saveAnalyticsEntries(entries: AnalyticsEntry[]): Promise<void> {
    // Group entries by date
    const entriesByDate = new Map<string, AnalyticsEntry[]>();
    
    entries.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!entriesByDate.has(date)) {
        entriesByDate.set(date, []);
      }
      entriesByDate.get(date)!.push(entry);
    });
    
    // Save each date's entries to separate files
    for (const [date, dateEntries] of entriesByDate) {
      const filename = `analytics_${date}.json`;
      const filepath = path.join(this.dataPath, filename);
      await fs.writeFile(filepath, JSON.stringify(dateEntries, null, 2));
    }
  }

  private applyFilters(entries: AnalyticsEntry[], filter: AnalyticsFilter): AnalyticsEntry[] {
    let filtered = entries;
    
    if (filter.dateFrom) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.dateFrom!);
    }
    
    if (filter.dateTo) {
      filtered = filtered.filter(entry => entry.timestamp <= filter.dateTo!);
    }
    
    if (filter.grade) {
      filtered = filtered.filter(entry => entry.anonymizedData.demographics.grade === filter.grade);
    }
    
    if (filter.board) {
      filtered = filtered.filter(entry => entry.anonymizedData.demographics.board === filter.board);
    }
    
    if (filter.location) {
      filtered = filtered.filter(entry => entry.anonymizedData.demographics.location === filter.location);
    }
    
    if (filter.ruralUrban) {
      filtered = filtered.filter(entry => entry.anonymizedData.demographics.ruralUrban === filter.ruralUrban);
    }
    
    if (filter.languagePreference) {
      filtered = filtered.filter(entry => entry.anonymizedData.demographics.languagePreference === filter.languagePreference);
    }
    
    if (filter.incomeRange) {
      filtered = filtered.filter(entry => entry.anonymizedData.socioeconomic.incomeRange === filter.incomeRange);
    }
    
    // Apply pagination
    if (filter.offset) {
      filtered = filtered.slice(filter.offset);
    }
    
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }
    
    return filtered;
  }

  private aggregateData(entries: AnalyticsEntry[], filter: AnalyticsFilter): AnalyticsAggregation {
    const aggregation: AnalyticsAggregation = {
      totalProfiles: entries.length,
      dateRange: {
        from: filter.dateFrom || (entries[0]?.timestamp || new Date().toISOString()),
        to: filter.dateTo || (entries[entries.length - 1]?.timestamp || new Date().toISOString())
      },
      demographics: {
        byGrade: {},
        byBoard: {},
        byLocation: {},
        byRuralUrban: {},
        byLanguage: {},
        byCategory: {},
        byGender: {}
      },
      socioeconomic: {
        byIncomeRange: {},
        byInternetAccess: {},
        byDeviceAccess: {},
        economicFactorsTrends: {}
      },
      academic: {
        popularInterests: {},
        popularSubjects: {},
        performanceDistribution: {},
        extracurricularTrends: {}
      },
      recommendations: {
        topCareers: {},
        averageMatchScores: {
          overall: 0,
          byGrade: {},
          byBoard: {},
          byLocation: {}
        },
        demandLevelDistribution: {},
        salaryTrends: {
          averageEntry: 0,
          averageMid: 0,
          averageSenior: 0,
          byCareer: {}
        }
      },
      processing: {
        averageProcessingTime: 0,
        aiModelUsage: {},
        successRate: 100
      }
    };

    // Process each entry
    let totalMatchScore = 0;
    let totalProcessingTime = 0;
    let totalEntrySalary = 0;
    let salaryCount = 0;

    entries.forEach(entry => {
      const { demographics, socioeconomic, academic, recommendations, processing } = entry.anonymizedData;

      // Demographics aggregation
      this.incrementCount(aggregation.demographics.byGrade, demographics.grade);
      this.incrementCount(aggregation.demographics.byBoard, demographics.board);
      this.incrementCount(aggregation.demographics.byLocation, demographics.location);
      this.incrementCount(aggregation.demographics.byRuralUrban, demographics.ruralUrban);
      this.incrementCount(aggregation.demographics.byLanguage, demographics.languagePreference);
      if (demographics.category) this.incrementCount(aggregation.demographics.byCategory, demographics.category);
      if (demographics.gender) this.incrementCount(aggregation.demographics.byGender, demographics.gender);

      // Socioeconomic aggregation
      this.incrementCount(aggregation.socioeconomic.byIncomeRange, socioeconomic.incomeRange);
      this.incrementCount(aggregation.socioeconomic.byInternetAccess, socioeconomic.internetAccess.toString());
      
      socioeconomic.deviceAccess.forEach(device => {
        this.incrementCount(aggregation.socioeconomic.byDeviceAccess, device);
      });
      
      socioeconomic.economicFactors.forEach(factor => {
        this.incrementCount(aggregation.socioeconomic.economicFactorsTrends, factor);
      });

      // Academic aggregation
      academic.interests.forEach(interest => {
        this.incrementCount(aggregation.academic.popularInterests, interest);
      });
      
      academic.subjects.forEach(subject => {
        this.incrementCount(aggregation.academic.popularSubjects, subject);
      });
      
      this.incrementCount(aggregation.academic.performanceDistribution, academic.performance);
      
      academic.extracurricularActivities.forEach(activity => {
        this.incrementCount(aggregation.academic.extracurricularTrends, activity);
      });

      // Recommendations aggregation
      recommendations.topCareerTitles.forEach(career => {
        this.incrementCount(aggregation.recommendations.topCareers, career);
      });
      
      recommendations.demandLevels.forEach(level => {
        this.incrementCount(aggregation.recommendations.demandLevelDistribution, level);
      });
      
      totalMatchScore += recommendations.averageMatchScore;
      
      // Match scores by demographics
      this.addToAverage(aggregation.recommendations.averageMatchScores.byGrade, demographics.grade, recommendations.averageMatchScore);
      this.addToAverage(aggregation.recommendations.averageMatchScores.byBoard, demographics.board, recommendations.averageMatchScore);
      this.addToAverage(aggregation.recommendations.averageMatchScores.byLocation, demographics.location, recommendations.averageMatchScore);
      
      // Salary trends
      recommendations.averageSalaryRanges.forEach(salary => {
        totalEntrySalary += salary;
        salaryCount++;
      });

      // Processing aggregation
      totalProcessingTime += processing.processingTime;
      this.incrementCount(aggregation.processing.aiModelUsage, processing.aiModel);
    });

    // Calculate averages
    aggregation.recommendations.averageMatchScores.overall = entries.length > 0 ? Math.round(totalMatchScore / entries.length) : 0;
    aggregation.processing.averageProcessingTime = entries.length > 0 ? Math.round(totalProcessingTime / entries.length) : 0;
    aggregation.recommendations.salaryTrends.averageEntry = salaryCount > 0 ? Math.round(totalEntrySalary / salaryCount) : 0;

    return aggregation;
  }

  private generateDashboardData(aggregatedData: AnalyticsAggregation): DashboardData {
    const topCareers = Object.entries(aggregatedData.recommendations.topCareers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    const locationDistribution = Object.entries(aggregatedData.demographics.byLocation)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    const gradeDistribution = Object.entries(aggregatedData.demographics.byGrade)
      .sort(([, a], [, b]) => b - a);

    return {
      summary: {
        totalUsers: aggregatedData.totalProfiles,
        totalRecommendations: Object.values(aggregatedData.recommendations.topCareers).reduce((sum, count) => sum + count, 0),
        averageMatchScore: aggregatedData.recommendations.averageMatchScores.overall,
        topCareer: topCareers[0]?.[0] || 'N/A',
        growthRate: 0 // TODO: Calculate based on historical data
      },
      trends: {
        dailyUsers: [], // TODO: Implement daily user trends
        popularCareers: topCareers.map(([career, count]) => ({
          career,
          count,
          percentage: Math.round((count / aggregatedData.totalProfiles) * 100)
        })),
        locationDistribution: locationDistribution.map(([location, count]) => ({
          location,
          count,
          percentage: Math.round((count / aggregatedData.totalProfiles) * 100)
        })),
        gradeDistribution: gradeDistribution.map(([grade, count]) => ({
          grade,
          count,
          percentage: Math.round((count / aggregatedData.totalProfiles) * 100)
        }))
      },
      insights: {
        ruralVsUrban: {
          rural: {
            count: aggregatedData.demographics.byRuralUrban.rural || 0,
            topCareers: topCareers.slice(0, 3).map(([career]) => career)
          },
          urban: {
            count: aggregatedData.demographics.byRuralUrban.urban || 0,
            topCareers: topCareers.slice(0, 3).map(([career]) => career)
          }
        },
        languagePreference: {
          hindi: {
            count: aggregatedData.demographics.byLanguage.hindi || 0,
            percentage: Math.round(((aggregatedData.demographics.byLanguage.hindi || 0) / aggregatedData.totalProfiles) * 100)
          },
          english: {
            count: aggregatedData.demographics.byLanguage.english || 0,
            percentage: Math.round(((aggregatedData.demographics.byLanguage.english || 0) / aggregatedData.totalProfiles) * 100)
          }
        },
        incomeImpact: Object.entries(aggregatedData.socioeconomic.byIncomeRange).map(([range, count]) => ({
          range,
          count,
          averageMatchScore: aggregatedData.recommendations.averageMatchScores.overall, // TODO: Calculate by income range
          topCareers: topCareers.slice(0, 3).map(([career]) => career)
        }))
      }
    };
  }

  private incrementCount(obj: Record<string, number>, key: string): void {
    obj[key] = (obj[key] || 0) + 1;
  }

  private addToAverage(obj: Record<string, number>, key: string, value: number): void {
    if (!obj[key]) {
      obj[key] = value;
    } else {
      obj[key] = Math.round((obj[key] + value) / 2);
    }
  }
}