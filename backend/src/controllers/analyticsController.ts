/**
 * Analytics Controller
 * Handles analytics API endpoints for educational administrators
 */

import { Request, Response } from 'express';
import { AnalyticsService, AnalyticsFilter } from '../services/analyticsService';

export interface AnalyticsRequest extends Request {
  query: {
    dateFrom?: string;
    dateTo?: string;
    grade?: string;
    board?: string;
    location?: string;
    ruralUrban?: 'rural' | 'urban';
    languagePreference?: 'hindi' | 'english';
    incomeRange?: string;
    limit?: string;
    offset?: string;
    format?: 'json' | 'csv';
    retentionDays?: string;
  };
}

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private requestCount: number = 0;
  private startTime: number = Date.now();

  constructor() {
    this.analyticsService = new AnalyticsService();
    console.log('AnalyticsController initialized');
  }

  /**
   * Get aggregated analytics data
   * GET /api/analytics
   */
  async getAnalytics(req: AnalyticsRequest, res: Response): Promise<void> {
    try {
      this.requestCount++;
      console.log('📊 Analytics request received');

      // Parse filters from query parameters
      const filter: AnalyticsFilter = this.parseFilters(req.query);

      // Get aggregated data
      const data = await this.analyticsService.getAggregatedData(filter);

      res.status(200).json({
        success: true,
        data,
        metadata: {
          totalRecords: data.totalProfiles,
          filteredRecords: data.totalProfiles,
          generatedAt: new Date().toISOString(),
          filters: filter
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Analytics request error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_REQUEST_ERROR',
          message: 'Failed to process analytics request',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get dashboard data for visualization
   * GET /api/analytics/dashboard
   */
  async getDashboard(req: AnalyticsRequest, res: Response): Promise<void> {
    try {
      this.requestCount++;
      console.log('📈 Dashboard request received');

      // Parse filters from query parameters
      const filter: AnalyticsFilter = this.parseFilters(req.query);

      // Get dashboard data
      const data = await this.analyticsService.getDashboardData(filter);

      res.status(200).json({
        success: true,
        data,
        metadata: {
          totalRecords: data.summary.totalUsers,
          filteredRecords: data.summary.totalUsers,
          generatedAt: new Date().toISOString(),
          filters: filter
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Dashboard request error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_REQUEST_ERROR',
          message: 'Failed to generate dashboard data'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get analytics statistics
   * GET /api/analytics/stats
   */
  async getAnalyticsStats(req: Request, res: Response): Promise<void> {
    try {
      this.requestCount++;
      console.log('📊 Analytics stats request received');

      const stats = await this.analyticsService.getAnalyticsStats();

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          controller: {
            requestCount: this.requestCount,
            uptime: Date.now() - this.startTime
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Analytics stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve analytics statistics'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  async exportAnalytics(req: AnalyticsRequest, res: Response): Promise<void> {
    try {
      this.requestCount++;
      console.log('📄 Analytics export request received');

      const filter: AnalyticsFilter = this.parseFilters(req.query);
      const format = req.query.format || 'json';

      const data = await this.analyticsService.exportData(filter);

      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        const filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);
      } else {
        const filename = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).json({
          success: true,
          data,
          metadata: {
            totalRecords: data.length,
            exportedAt: new Date().toISOString(),
            format,
            filters: filter
          }
        });
      }

    } catch (error: any) {
      console.error('Analytics export error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export analytics data'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Cleanup old analytics data
   * DELETE /api/analytics/cleanup
   */
  async cleanupAnalytics(req: Request, res: Response): Promise<void> {
    try {
      this.requestCount++;
      console.log('🧹 Analytics cleanup request received');

      const retentionDays = parseInt(req.query.retentionDays as string) || 365;
      const removedEntries = await this.analyticsService.cleanupOldData(retentionDays);

      res.status(200).json({
        success: true,
        data: {
          removedEntries,
          retentionDays,
          cleanupDate: new Date().toISOString()
        },
        message: `Successfully cleaned up ${removedEntries} old analytics entries`,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Analytics cleanup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup analytics data'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check for analytics service
   * GET /api/analytics/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.analyticsService.getAnalyticsStats();

      res.status(200).json({
        status: 'healthy',
        services: {
          analyticsService: 'healthy',
          dataStorage: stats.totalEntries > 0 ? 'healthy' : 'empty',
          processing: 'healthy'
        },
        stats: {
          ...stats,
          requestCount: this.requestCount
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Analytics health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Private helper methods

  private parseFilters(query: AnalyticsRequest['query']): AnalyticsFilter {
    const filter: AnalyticsFilter = {};

    if (query.dateFrom) filter.dateFrom = query.dateFrom;
    if (query.dateTo) filter.dateTo = query.dateTo;
    if (query.grade) filter.grade = query.grade;
    if (query.board) filter.board = query.board;
    if (query.location) filter.location = query.location;
    if (query.ruralUrban) filter.ruralUrban = query.ruralUrban;
    if (query.languagePreference) filter.languagePreference = query.languagePreference;
    if (query.incomeRange) filter.incomeRange = query.incomeRange;

    // Parse numeric parameters
    if (query.limit) {
      const limit = parseInt(query.limit);
      if (!isNaN(limit) && limit > 0) {
        filter.limit = Math.min(limit, 1000); // Cap at 1000 for performance
      }
    }

    if (query.offset) {
      const offset = parseInt(query.offset);
      if (!isNaN(offset) && offset >= 0) {
        filter.offset = offset;
      }
    }

    return filter;
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    // Create CSV headers
    const headers = [
      'id',
      'timestamp',
      'profileHash',
      'grade',
      'board',
      'location',
      'ruralUrban',
      'languagePreference',
      'category',
      'gender',
      'incomeRange',
      'familyBackground',
      'internetAccess',
      'deviceAccess',
      'economicFactors',
      'interests',
      'subjects',
      'performance',
      'favoriteSubjects',
      'difficultSubjects',
      'extracurricularActivities',
      'totalRecommendations',
      'averageMatchScore',
      'topCareerTitles',
      'demandLevels',
      'aiModel',
      'processingTime',
      'generatedAt'
    ];

    // Create CSV rows
    const rows = data.map(entry => {
      const { anonymizedData } = entry;
      return [
        entry.id,
        entry.timestamp,
        anonymizedData.profileHash,
        anonymizedData.demographics.grade,
        anonymizedData.demographics.board,
        anonymizedData.demographics.location,
        anonymizedData.demographics.ruralUrban,
        anonymizedData.demographics.languagePreference,
        anonymizedData.demographics.category || '',
        anonymizedData.demographics.gender || '',
        anonymizedData.socioeconomic.incomeRange,
        anonymizedData.socioeconomic.familyBackground,
        anonymizedData.socioeconomic.internetAccess,
        anonymizedData.socioeconomic.deviceAccess.join(';'),
        anonymizedData.socioeconomic.economicFactors.join(';'),
        anonymizedData.academic.interests.join(';'),
        anonymizedData.academic.subjects.join(';'),
        anonymizedData.academic.performance,
        anonymizedData.academic.favoriteSubjects.join(';'),
        anonymizedData.academic.difficultSubjects.join(';'),
        anonymizedData.academic.extracurricularActivities.join(';'),
        anonymizedData.recommendations.totalCount,
        anonymizedData.recommendations.averageMatchScore,
        anonymizedData.recommendations.topCareerTitles.join(';'),
        anonymizedData.recommendations.demandLevels.join(';'),
        anonymizedData.processing.aiModel,
        anonymizedData.processing.processingTime,
        anonymizedData.processing.generatedAt
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

// Create and export controller instance
export const analyticsController = new AnalyticsController();