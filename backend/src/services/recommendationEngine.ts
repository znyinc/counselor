/**
 * Career Recommendation Engine
 * Processes student profiles and generates AI-powered career recommendations
 * enriched with database information
 */

import { StudentProfile } from '../types/studentProfile';
import { CareerRecommendation, RecommendationResponse, RecommendationContext } from '../types/careerRecommendation';
import { OpenAIClient, AIResponse, OpenAIConfig } from './openAIClient';
import { MockOpenAIClient } from './mockOpenAIClient';
import { DatabaseService } from './databaseService';
import { PromptTemplates } from './promptTemplates';
import { CustomError } from '../middleware/errorHandler';

export interface RecommendationEngineConfig {
  useOpenAI: boolean;
  openAIConfig?: OpenAIConfig;
  maxRecommendations: number;
  minMatchScore: number;
  enableDatabaseEnrichment: boolean;
}

export class RecommendationEngine {
  private aiClient: OpenAIClient | MockOpenAIClient;
  private databaseService: DatabaseService;
  private config: RecommendationEngineConfig;

  constructor(config: RecommendationEngineConfig) {
    this.config = config;
    this.databaseService = DatabaseService.getInstance();
    
    // Initialize AI client based on configuration
    if (config.useOpenAI && config.openAIConfig) {
      this.aiClient = new OpenAIClient(config.openAIConfig);
    } else {
      this.aiClient = new MockOpenAIClient();
      console.log('Using Mock OpenAI Client for development/testing');
    }
  }

  /**
   * Generate career recommendations for a student profile
   */
  async generateRecommendations(profile: StudentProfile): Promise<RecommendationResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Generating recommendations for profile: ${profile.id}`);
      
      // Step 1: Generate AI recommendations
      const aiResponse = await this.generateAIRecommendations(profile);
      
      // Step 2: Enrich recommendations with database data
      const enrichedRecommendations = await this.enrichRecommendations(
        aiResponse.recommendations, 
        profile
      );
      
      // Step 3: Validate and filter recommendations
      const validatedRecommendations = this.validateAndFilterRecommendations(
        enrichedRecommendations
      );
      
      // Step 4: Generate recommendation context
      const context = this.generateRecommendationContext(profile, validatedRecommendations);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`Generated ${validatedRecommendations.length} recommendations in ${processingTime}ms`);
      
      return {
        recommendations: validatedRecommendations,
        context,
        metadata: {
          generatedAt: new Date(),
          profileId: profile.id,
          aiModel: this.config.useOpenAI ? 'gpt-4' : 'mock',
          processingTime
        }
      };
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to mock recommendations on AI failure
      if (this.config.useOpenAI && error instanceof CustomError) {
        console.log('Falling back to mock recommendations due to AI service failure');
        return this.generateFallbackRecommendations(profile);
      }
      
      throw error;
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(profile: StudentProfile): Promise<AIResponse> {
    try {
      // Select appropriate prompt template based on profile characteristics
      const prompt = this.selectPromptTemplate(profile);
      
      if (this.aiClient instanceof OpenAIClient) {
        return await this.aiClient.generateCareerRecommendations(profile);
      } else {
        return await (this.aiClient as MockOpenAIClient).generateCareerRecommendations(profile);
      }
      
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      throw new CustomError(
        'Failed to generate AI recommendations',
        500,
        'AI_RECOMMENDATION_FAILED'
      );
    }
  }

  /**
   * Select appropriate prompt template based on profile characteristics
   */
  private selectPromptTemplate(profile: StudentProfile): string {
    const { socioeconomicData, familyIncome, constraints, personalInfo } = profile;
    
    // Check for financial constraints
    if (constraints?.financialConstraints || 
        familyIncome.includes('Below') || 
        familyIncome.includes('1-3')) {
      return PromptTemplates.generateFinancialConstraintsPrompt(profile);
    }
    
    // Check for rural background
    if (socioeconomicData.ruralUrban === 'rural') {
      return PromptTemplates.generateRuralStudentPrompt(profile);
    }
    
    // Check for disability considerations
    if (personalInfo.physicallyDisabled) {
      return PromptTemplates.generateInclusiveCareerPrompt(profile);
    }
    
    // Check for high academic performance
    if (profile.academicData.performance.toLowerCase().includes('excellent') ||
        profile.academicData.performance.toLowerCase().includes('outstanding')) {
      return PromptTemplates.generateHighAchieverPrompt(profile);
    }
    
    // Check for technology interests
    const techInterests = ['technology', 'computer', 'programming', 'engineering', 'science'];
    if (profile.academicData.interests.some(interest => 
        techInterests.some(tech => interest.toLowerCase().includes(tech)))) {
      return PromptTemplates.generateTechFocusedPrompt(profile);
    }
    
    // Check for creative interests
    const creativeInterests = ['arts', 'design', 'music', 'literature', 'creative'];
    if (profile.academicData.interests.some(interest => 
        creativeInterests.some(creative => interest.toLowerCase().includes(creative)))) {
      return PromptTemplates.generateCreativeCareerPrompt(profile);
    }
    
    // Default to NEP 2020 aligned prompt
    return PromptTemplates.generateNEP2020Prompt(profile);
  }

  /**
   * Enrich AI recommendations with database information
   */
  private async enrichRecommendations(
    recommendations: CareerRecommendation[], 
    profile: StudentProfile
  ): Promise<CareerRecommendation[]> {
    
    if (!this.config.enableDatabaseEnrichment) {
      return recommendations;
    }

    console.log('Enriching recommendations with database information');
    
    return Promise.all(recommendations.map(async (recommendation) => {
      try {
        // Find relevant colleges
        const relevantColleges = this.findRelevantColleges(recommendation);
        
        // Find applicable scholarships
        const applicableScholarships = this.findApplicableScholarships(recommendation, profile);
        
        // Enhance with additional career data
        const enhancedRecommendation = this.enhanceWithCareerData(recommendation);
        
        return {
          ...enhancedRecommendation,
          recommendedColleges: relevantColleges.slice(0, 5), // Top 5 colleges
          scholarships: applicableScholarships.slice(0, 3), // Top 3 scholarships
        };
        
      } catch (error) {
        console.error(`Error enriching recommendation ${recommendation.id}:`, error);
        return recommendation; // Return original if enrichment fails
      }
    }));
  }

  /**
   * Find relevant colleges for a career recommendation
   */
  private findRelevantColleges(recommendation: CareerRecommendation) {
    const { requirements } = recommendation;
    
    // Search colleges based on education requirements
    const colleges = this.databaseService.getAllColleges();
    
    return colleges.filter(college => {
      // Check if college offers relevant courses
      const hasRelevantCourse = requirements.education.some(education =>
        college.courses.some(course => 
          this.isEducationMatch(education, course)
        )
      );
      
      // Check if college accepts relevant entrance exams
      const hasRelevantExam = requirements.entranceExams.some(exam =>
        college.entranceExams.some(collegeExam =>
          this.isExamMatch(exam, collegeExam)
        )
      );
      
      return hasRelevantCourse || hasRelevantExam;
    })
    .sort((a, b) => {
      // Sort by NIRF ranking (lower is better)
      const rankA = a.rankings?.nirf || 999;
      const rankB = b.rankings?.nirf || 999;
      return rankA - rankB;
    });
  }

  /**
   * Find applicable scholarships for a student profile and career
   */
  private findApplicableScholarships(recommendation: CareerRecommendation, profile: StudentProfile) {
    const scholarshipCriteria: {
      category?: string;
      familyIncome?: number;
      course?: string;
      gender?: string;
      class?: string;
    } = {};
    
    if (profile.personalInfo.category) {
      scholarshipCriteria.category = profile.personalInfo.category;
    }
    
    scholarshipCriteria.familyIncome = this.parseFamilyIncome(profile.familyIncome);
    
    if (recommendation.requirements.education[0]) {
      scholarshipCriteria.course = recommendation.requirements.education[0];
    }
    
    if (profile.personalInfo.gender) {
      scholarshipCriteria.gender = profile.personalInfo.gender;
    }
    
    scholarshipCriteria.class = profile.personalInfo.grade;
    
    return this.databaseService.getApplicableScholarships(scholarshipCriteria);
  }

  /**
   * Enhance recommendation with additional career data from database
   */
  private enhanceWithCareerData(recommendation: CareerRecommendation): CareerRecommendation {
    // Find matching career in database
    const dbCareers = this.databaseService.getAllCareers();
    const matchingCareer = dbCareers.find(career => 
      this.isCareerMatch(recommendation.title, career.title)
    );
    
    if (matchingCareer) {
      // Merge database information with AI recommendation
      return {
        ...recommendation,
        prospects: {
          ...recommendation.prospects,
          // Use database salary if available and more recent
          averageSalary: matchingCareer.averageSalary.entry > 0 ? {
            entry: matchingCareer.averageSalary.entry,
            mid: matchingCareer.averageSalary.mid,
            senior: matchingCareer.averageSalary.senior,
            currency: 'INR'
          } : recommendation.prospects.averageSalary,
          growthRate: matchingCareer.growthProjection || recommendation.prospects.growthRate
        },
        requirements: {
          ...recommendation.requirements,
          // Merge education requirements
          education: this.mergeUniqueArrays(
            recommendation.requirements.education,
            matchingCareer.requiredEducation
          ),
          // Merge skills
          skills: this.mergeUniqueArrays(
            recommendation.requirements.skills,
            matchingCareer.skills
          ),
          // Merge entrance exams
          entranceExams: this.mergeUniqueArrays(
            recommendation.requirements.entranceExams,
            matchingCareer.relatedExams
          )
        }
      };
    }
    
    return recommendation;
  }

  /**
   * Validate and filter recommendations
   */
  private validateAndFilterRecommendations(
    recommendations: CareerRecommendation[]
  ): CareerRecommendation[] {
    return recommendations
      .filter(rec => rec.matchScore >= this.config.minMatchScore)
      .filter(rec => this.isValidRecommendation(rec))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, this.config.maxRecommendations);
  }

  /**
   * Validate individual recommendation
   */
  private isValidRecommendation(recommendation: CareerRecommendation): boolean {
    return !!(
      recommendation.id &&
      recommendation.title &&
      recommendation.description &&
      recommendation.matchScore >= 0 &&
      recommendation.matchScore <= 100 &&
      recommendation.requirements &&
      recommendation.prospects &&
      recommendation.visualData
    );
  }

  /**
   * Generate recommendation context
   */
  private generateRecommendationContext(
    profile: StudentProfile, 
    recommendations: CareerRecommendation[]
  ): RecommendationContext {
    
    const interests = profile.academicData.interests;
    const strengths = this.identifyStrengths(profile);
    const preferences = this.identifyPreferences(profile);
    const constraints = this.identifyConstraints(profile);
    
    // Calculate average reasoning factors
    const avgFactors = recommendations.reduce((acc, rec) => ({
      interestMatch: acc.interestMatch + this.calculateInterestMatch(interests, rec),
      skillAlignment: acc.skillAlignment + this.calculateSkillAlignment(profile, rec),
      marketDemand: acc.marketDemand + this.calculateMarketDemand(rec),
      financialViability: acc.financialViability + this.calculateFinancialViability(profile, rec),
      educationalFit: acc.educationalFit + this.calculateEducationalFit(profile, rec)
    }), {
      interestMatch: 0,
      skillAlignment: 0,
      marketDemand: 0,
      financialViability: 0,
      educationalFit: 0
    });
    
    const count = recommendations.length || 1;
    
    return {
      studentProfile: {
        interests,
        strengths,
        preferences,
        constraints
      },
      reasoningFactors: {
        interestMatch: Math.round(avgFactors.interestMatch / count),
        skillAlignment: Math.round(avgFactors.skillAlignment / count),
        marketDemand: Math.round(avgFactors.marketDemand / count),
        financialViability: Math.round(avgFactors.financialViability / count),
        educationalFit: Math.round(avgFactors.educationalFit / count)
      }
    };
  }

  /**
   * Generate fallback recommendations when AI fails
   */
  private async generateFallbackRecommendations(profile: StudentProfile): Promise<RecommendationResponse> {
    console.log('Generating fallback recommendations');
    
    const mockClient = new MockOpenAIClient();
    const aiResponse = await mockClient.generateCareerRecommendations(profile);
    
    const enrichedRecommendations = await this.enrichRecommendations(
      aiResponse.recommendations, 
      profile
    );
    
    const context = this.generateRecommendationContext(profile, enrichedRecommendations);
    
    return {
      recommendations: enrichedRecommendations,
      context,
      metadata: {
        generatedAt: new Date(),
        profileId: profile.id,
        aiModel: 'fallback-mock',
        processingTime: 1000
      }
    };
  }

  // Helper methods

  private isEducationMatch(requirement: string, course: string): boolean {
    const reqLower = requirement.toLowerCase();
    const courseLower = course.toLowerCase();
    
    // Direct match
    if (reqLower.includes(courseLower) || courseLower.includes(reqLower)) {
      return true;
    }
    
    // Subject-based matching
    const subjects = ['computer', 'engineering', 'science', 'commerce', 'arts', 'medicine'];
    return subjects.some(subject => 
      reqLower.includes(subject) && courseLower.includes(subject)
    );
  }

  private isExamMatch(requirement: string, exam: string): boolean {
    const reqLower = requirement.toLowerCase();
    const examLower = exam.toLowerCase();
    
    return reqLower.includes(examLower) || examLower.includes(reqLower);
  }

  private isCareerMatch(aiTitle: string, dbTitle: string): boolean {
    const aiLower = aiTitle.toLowerCase();
    const dbLower = dbTitle.toLowerCase();
    
    // Check for exact match or significant overlap
    const aiWords = aiLower.split(' ');
    const dbWords = dbLower.split(' ');
    
    const commonWords = aiWords.filter(word => 
      dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
    );
    
    return commonWords.length >= Math.min(aiWords.length, dbWords.length) * 0.5;
  }

  private parseFamilyIncome(incomeString: string): number {
    // Extract numeric value from income string
    const match = incomeString.match(/(\d+)/);
    if (match && match[1]) {
      const value = parseInt(match[1]);
      if (incomeString.toLowerCase().includes('lakh')) {
        return value * 100000;
      }
      if (incomeString.toLowerCase().includes('crore')) {
        return value * 10000000;
      }
      return value;
    }
    return 0;
  }

  private mergeUniqueArrays(arr1: string[], arr2: string[]): string[] {
    const combined = [...arr1, ...arr2];
    return [...new Set(combined.map(item => item.toLowerCase()))];
  }

  private identifyStrengths(profile: StudentProfile): string[] {
    const strengths: string[] = [];
    
    if (profile.academicData.favoriteSubjects?.length) {
      strengths.push(...profile.academicData.favoriteSubjects);
    }
    
    if (profile.academicData.extracurricularActivities?.length) {
      strengths.push(...profile.academicData.extracurricularActivities);
    }
    
    if (profile.academicData.performance.toLowerCase().includes('excellent')) {
      strengths.push('Academic Excellence');
    }
    
    return strengths;
  }

  private identifyPreferences(profile: StudentProfile): string[] {
    const preferences: string[] = [];
    
    if (profile.aspirations?.preferredCareers?.length) {
      preferences.push(...profile.aspirations.preferredCareers);
    }
    
    if (profile.aspirations?.preferredLocations?.length) {
      preferences.push(...profile.aspirations.preferredLocations);
    }
    
    if (profile.aspirations?.workLifeBalance) {
      preferences.push(`${profile.aspirations.workLifeBalance} work-life balance`);
    }
    
    return preferences;
  }

  private identifyConstraints(profile: StudentProfile): string[] {
    const constraints: string[] = [];
    
    if (profile.constraints?.financialConstraints) {
      constraints.push('Financial constraints');
    }
    
    if (profile.constraints?.locationConstraints?.length) {
      constraints.push(...profile.constraints.locationConstraints);
    }
    
    if (profile.constraints?.familyExpectations?.length) {
      constraints.push(...profile.constraints.familyExpectations);
    }
    
    return constraints;
  }

  private calculateInterestMatch(interests: string[], recommendation: CareerRecommendation): number {
    const recSkills = recommendation.requirements.skills.map(s => s.toLowerCase());
    const matchingInterests = interests.filter(interest => 
      recSkills.some(skill => skill.includes(interest.toLowerCase()) || 
                             interest.toLowerCase().includes(skill))
    );
    
    return Math.round((matchingInterests.length / interests.length) * 100);
  }

  private calculateSkillAlignment(profile: StudentProfile, recommendation: CareerRecommendation): number {
    // Simple heuristic based on academic performance and subjects
    let alignment = 60; // Base alignment
    
    if (profile.academicData.performance.toLowerCase().includes('excellent')) {
      alignment += 20;
    } else if (profile.academicData.performance.toLowerCase().includes('good')) {
      alignment += 10;
    }
    
    // Check subject alignment
    const relevantSubjects = profile.academicData.favoriteSubjects?.filter(subject =>
      recommendation.requirements.skills.some(skill => 
        skill.toLowerCase().includes(subject.toLowerCase())
      )
    ) || [];
    
    alignment += relevantSubjects.length * 5;
    
    return Math.min(alignment, 100);
  }

  private calculateMarketDemand(recommendation: CareerRecommendation): number {
    const demandMap = {
      'high': 90,
      'medium': 70,
      'low': 50
    };
    
    return demandMap[recommendation.prospects.demandLevel] || 70;
  }

  private calculateFinancialViability(profile: StudentProfile, recommendation: CareerRecommendation): number {
    const familyIncome = this.parseFamilyIncome(profile.familyIncome);
    const entrySalary = recommendation.prospects.averageSalary.entry;
    
    // Higher viability if career offers good ROI relative to family income
    if (entrySalary > familyIncome * 2) return 90;
    if (entrySalary > familyIncome) return 75;
    if (entrySalary > familyIncome * 0.5) return 60;
    return 40;
  }

  private calculateEducationalFit(profile: StudentProfile, recommendation: CareerRecommendation): number {
    const currentGrade = parseInt(profile.personalInfo.grade);
    const educationReqs = recommendation.requirements.education;
    
    // Check if educational path is realistic
    let fit = 70; // Base fit
    
    if (currentGrade >= 10 && educationReqs.some(req => req.includes('12'))) {
      fit += 10;
    }
    
    if (currentGrade >= 12 && educationReqs.some(req => req.includes('Bachelor'))) {
      fit += 10;
    }
    
    return Math.min(fit, 100);
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      config: this.config,
      aiClientStats: this.aiClient.getStats(),
      databaseStats: this.databaseService.getStatistics()
    };
  }

  /**
   * Test the recommendation engine
   */
  async testEngine(): Promise<boolean> {
    try {
      const testResult = await this.aiClient.testConnection();
      console.log('Recommendation engine test:', testResult ? 'PASSED' : 'FAILED');
      return testResult;
    } catch (error) {
      console.error('Recommendation engine test failed:', error);
      return false;
    }
  }
}