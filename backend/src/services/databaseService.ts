/**
 * Database service for loading and querying JSON databases
 */

import * as fs from 'fs';
import * as path from 'path';
import { College, Career, Scholarship, DataValidator } from '../utils/dataValidation';

export class DatabaseService {
  private static instance: DatabaseService;
  private colleges: College[] = [];
  private careers: Career[] = [];
  private scholarships: Scholarship[] = [];
  private dataPath: string;
  
  // Cache for query results
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STATIC_DATA_TTL = 30 * 60 * 1000; // 30 minutes for static data

  private constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.loadAllData();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Load all JSON database files
   */
  private loadAllData(): void {
    try {
      this.loadColleges();
      this.loadCareers();
      this.loadScholarships();
      console.log('Database loaded successfully');
    } catch (error) {
      console.error('Error loading database:', error);
      throw new Error('Failed to load database files');
    }
  }

  /**
   * Load colleges data
   */
  private loadColleges(): void {
    const filePath = path.join(this.dataPath, 'colleges.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.colleges || !Array.isArray(data.colleges)) {
      throw new Error('Invalid colleges data structure');
    }

    for (const college of data.colleges) {
      if (!DataValidator.validateCollege(college)) {
        throw new Error(`Invalid college data: ${college.id}`);
      }
    }

    this.colleges = data.colleges;
  }

  /**
   * Load careers data
   */
  private loadCareers(): void {
    const filePath = path.join(this.dataPath, 'careers.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.careers || !Array.isArray(data.careers)) {
      throw new Error('Invalid careers data structure');
    }

    for (const career of data.careers) {
      if (!DataValidator.validateCareer(career)) {
        throw new Error(`Invalid career data: ${career.id}`);
      }
    }

    this.careers = data.careers;
  }

  /**
   * Load scholarships data
   */
  private loadScholarships(): void {
    const filePath = path.join(this.dataPath, 'scholarships.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.scholarships || !Array.isArray(data.scholarships)) {
      throw new Error('Invalid scholarships data structure');
    }

    for (const scholarship of data.scholarships) {
      if (!DataValidator.validateScholarship(scholarship)) {
        throw new Error(`Invalid scholarship data: ${scholarship.id}`);
      }
    }

    this.scholarships = data.scholarships;
  }

  /**
   * Cache management methods
   */
  private getCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all colleges (cached)
   */
  public getAllColleges(): College[] {
    const cacheKey = this.getCacheKey('getAllColleges', []);
    const cached = this.getFromCache<College[]>(cacheKey);
    
    if (cached) return cached;
    
    const result = [...this.colleges];
    this.setCache(cacheKey, result, this.STATIC_DATA_TTL);
    return result;
  }

  /**
   * Get all careers (cached)
   */
  public getAllCareers(): Career[] {
    const cacheKey = this.getCacheKey('getAllCareers', []);
    const cached = this.getFromCache<Career[]>(cacheKey);
    
    if (cached) return cached;
    
    const result = [...this.careers];
    this.setCache(cacheKey, result, this.STATIC_DATA_TTL);
    return result;
  }

  /**
   * Get all scholarships (cached)
   */
  public getAllScholarships(): Scholarship[] {
    const cacheKey = this.getCacheKey('getAllScholarships', []);
    const cached = this.getFromCache<Scholarship[]>(cacheKey);
    
    if (cached) return cached;
    
    const result = [...this.scholarships];
    this.setCache(cacheKey, result, this.STATIC_DATA_TTL);
    return result;
  }

  /**
   * Find college by ID
   */
  public getCollegeById(id: string): College | undefined {
    return this.colleges.find(college => college.id === id);
  }

  /**
   * Find career by ID
   */
  public getCareerById(id: string): Career | undefined {
    return this.careers.find(career => career.id === id);
  }

  /**
   * Find scholarship by ID
   */
  public getScholarshipById(id: string): Scholarship | undefined {
    return this.scholarships.find(scholarship => scholarship.id === id);
  }

  /**
   * Search colleges by various criteria (cached)
   */
  public searchColleges(criteria: {
    type?: string;
    location?: string;
    course?: string;
    entranceExam?: string;
    maxFees?: number;
  }): College[] {
    const cacheKey = this.getCacheKey('searchColleges', [criteria]);
    const cached = this.getFromCache<College[]>(cacheKey);
    
    if (cached) return cached;
    
    const result = this.colleges.filter(college => {
      if (criteria.type && college.type !== criteria.type) return false;
      if (criteria.location && !college.location.toLowerCase().includes(criteria.location.toLowerCase())) return false;
      if (criteria.course && !college.courses.some(course => 
        course.toLowerCase().includes(criteria.course!.toLowerCase()))) return false;
      if (criteria.entranceExam && !college.entranceExams.some(exam => 
        exam.toLowerCase().includes(criteria.entranceExam!.toLowerCase()))) return false;
      if (criteria.maxFees && college.fees.annual > criteria.maxFees) return false;
      return true;
    });
    
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Search careers by various criteria
   */
  public searchCareers(criteria: {
    nepCategory?: string;
    minSalary?: number;
    maxSalary?: number;
    education?: string;
    skill?: string;
  }): Career[] {
    return this.careers.filter(career => {
      if (criteria.nepCategory && !career.nepCategory.toLowerCase().includes(criteria.nepCategory.toLowerCase())) return false;
      if (criteria.minSalary && career.averageSalary.entry < criteria.minSalary) return false;
      if (criteria.maxSalary && career.averageSalary.entry > criteria.maxSalary) return false;
      if (criteria.education && !career.requiredEducation.some(edu => 
        edu.toLowerCase().includes(criteria.education!.toLowerCase()))) return false;
      if (criteria.skill && !career.skills.some(skill => 
        skill.toLowerCase().includes(criteria.skill!.toLowerCase()))) return false;
      return true;
    });
  }

  /**
   * Search scholarships by various criteria
   */
  public searchScholarships(criteria: {
    category?: string;
    incomeLimit?: number;
    type?: string;
    course?: string;
    provider?: string;
  }): Scholarship[] {
    return this.scholarships.filter(scholarship => {
      if (criteria.category && scholarship.eligibility.categories && 
          !scholarship.eligibility.categories.includes(criteria.category)) return false;
      if (criteria.incomeLimit && scholarship.eligibility.incomeLimit && 
          scholarship.eligibility.incomeLimit < criteria.incomeLimit) return false;
      if (criteria.type && scholarship.type !== criteria.type) return false;
      if (criteria.course && scholarship.eligibility.courses && 
          !scholarship.eligibility.courses.some(course => 
            course.toLowerCase().includes(criteria.course!.toLowerCase()))) return false;
      if (criteria.provider && !scholarship.provider.toLowerCase().includes(criteria.provider.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Get colleges for a specific career
   */
  public getCollegesForCareer(careerId: string): College[] {
    const career = this.getCareerById(careerId);
    if (!career) return [];

    return this.colleges.filter(college => 
      career.requiredEducation.some(education => 
        college.courses.some(course => 
          course.toLowerCase().includes(education.toLowerCase()) ||
          education.toLowerCase().includes(course.toLowerCase())
        )
      )
    );
  }

  /**
   * Get scholarships applicable for a student profile
   */
  public getApplicableScholarships(profile: {
    category?: string;
    familyIncome?: number;
    course?: string;
    gender?: string;
    class?: string;
  }): Scholarship[] {
    return this.scholarships.filter(scholarship => {
      // Check category eligibility
      if (profile.category && scholarship.eligibility.categories && 
          !scholarship.eligibility.categories.includes(profile.category)) return false;

      // Check income limit
      if (profile.familyIncome && scholarship.eligibility.incomeLimit && 
          profile.familyIncome > scholarship.eligibility.incomeLimit) return false;

      // Check course eligibility
      if (profile.course && scholarship.eligibility.courses && 
          !scholarship.eligibility.courses.some(course => 
            course.toLowerCase().includes(profile.course!.toLowerCase()))) return false;

      // Check gender eligibility
      if (scholarship.eligibility.gender && profile.gender && 
          scholarship.eligibility.gender !== profile.gender) return false;

      // Check class eligibility
      if (profile.class && scholarship.eligibility.classes && 
          !scholarship.eligibility.classes.includes(profile.class)) return false;

      return true;
    });
  }

  /**
   * Get statistics about the database
   */
  public getStatistics(): {
    totalColleges: number;
    totalCareers: number;
    totalScholarships: number;
    collegesByType: Record<string, number>;
    careersByCategory: Record<string, number>;
    scholarshipsByType: Record<string, number>;
  } {
    const collegesByType: Record<string, number> = {};
    const careersByCategory: Record<string, number> = {};
    const scholarshipsByType: Record<string, number> = {};

    // Count colleges by type
    this.colleges.forEach(college => {
      collegesByType[college.type] = (collegesByType[college.type] || 0) + 1;
    });

    // Count careers by NEP category
    this.careers.forEach(career => {
      careersByCategory[career.nepCategory] = (careersByCategory[career.nepCategory] || 0) + 1;
    });

    // Count scholarships by type
    this.scholarships.forEach(scholarship => {
      scholarshipsByType[scholarship.type] = (scholarshipsByType[scholarship.type] || 0) + 1;
    });

    return {
      totalColleges: this.colleges.length,
      totalCareers: this.careers.length,
      totalScholarships: this.scholarships.length,
      collegesByType,
      careersByCategory,
      scholarshipsByType,
    };
  }

  /**
   * Reload data from files (useful for updates)
   */
  public reloadData(): void {
    this.clearCache();
    this.loadAllData();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}