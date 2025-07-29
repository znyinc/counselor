/**
 * Controller for data-related API endpoints
 */

import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';

export class DataController {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Get all colleges
   */
  public getColleges = (req: Request, res: Response): void => {
    try {
      const colleges = this.dbService.getAllColleges();
      res.json({
        success: true,
        data: colleges,
        count: colleges.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve colleges data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Get all careers
   */
  public getCareers = (req: Request, res: Response): void => {
    try {
      const careers = this.dbService.getAllCareers();
      res.json({
        success: true,
        data: careers,
        count: careers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve careers data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Get all scholarships
   */
  public getScholarships = (req: Request, res: Response): void => {
    try {
      const scholarships = this.dbService.getAllScholarships();
      res.json({
        success: true,
        data: scholarships,
        count: scholarships.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve scholarships data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Search colleges with filters
   */
  public searchColleges = (req: Request, res: Response): void => {
    try {
      const { type, location, course, entranceExam, maxFees } = req.query;
      
      const criteria: any = {};
      if (type) criteria.type = type as string;
      if (location) criteria.location = location as string;
      if (course) criteria.course = course as string;
      if (entranceExam) criteria.entranceExam = entranceExam as string;
      if (maxFees) criteria.maxFees = parseInt(maxFees as string);

      const colleges = this.dbService.searchColleges(criteria);
      
      res.json({
        success: true,
        data: colleges,
        count: colleges.length,
        filters: criteria
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search colleges',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Search careers with filters
   */
  public searchCareers = (req: Request, res: Response): void => {
    try {
      const { nepCategory, minSalary, maxSalary, education, skill } = req.query;
      
      const criteria: any = {};
      if (nepCategory) criteria.nepCategory = nepCategory as string;
      if (minSalary) criteria.minSalary = parseInt(minSalary as string);
      if (maxSalary) criteria.maxSalary = parseInt(maxSalary as string);
      if (education) criteria.education = education as string;
      if (skill) criteria.skill = skill as string;

      const careers = this.dbService.searchCareers(criteria);
      
      res.json({
        success: true,
        data: careers,
        count: careers.length,
        filters: criteria
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search careers',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Get colleges for a specific career
   */
  public getCollegesForCareer = (req: Request, res: Response): void => {
    try {
      const { careerId } = req.params;
      
      if (!careerId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Career ID is required'
          }
        });
        return;
      }

      const career = this.dbService.getCareerById(careerId);
      if (!career) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CAREER_NOT_FOUND',
            message: `Career with ID '${careerId}' not found`
          }
        });
        return;
      }

      const colleges = this.dbService.getCollegesForCareer(careerId);
      
      res.json({
        success: true,
        data: {
          career: career,
          colleges: colleges
        },
        count: colleges.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve colleges for career',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Get applicable scholarships for student profile
   */
  public getApplicableScholarships = (req: Request, res: Response): void => {
    try {
      const { category, familyIncome, course, gender, class: studentClass } = req.query;
      
      const profile: any = {};
      if (category) profile.category = category as string;
      if (familyIncome) profile.familyIncome = parseInt(familyIncome as string);
      if (course) profile.course = course as string;
      if (gender) profile.gender = gender as string;
      if (studentClass) profile.class = studentClass as string;

      const scholarships = this.dbService.getApplicableScholarships(profile);
      
      res.json({
        success: true,
        data: scholarships,
        count: scholarships.length,
        profile: profile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve applicable scholarships',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };

  /**
   * Get database statistics
   */
  public getStatistics = (req: Request, res: Response): void => {
    try {
      const stats = this.dbService.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  };
}