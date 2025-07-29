/**
 * OpenAI Client Service for career recommendations
 */

import OpenAI from 'openai';
import { StudentProfile } from '../types/studentProfile';
import { CareerRecommendation } from '../types/careerRecommendation';
import { CustomError } from '../middleware/errorHandler';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface AIResponse {
  recommendations: CareerRecommendation[];
  reasoning: string;
  confidence: number;
}

export class OpenAIClient {
  private client: OpenAI;
  private config: OpenAIConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  
  // Request batching and caching
  private requestQueue: Array<{ profile: StudentProfile; resolve: Function; reject: Function }> = [];
  private processingBatch = false;
  private responseCache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly BATCH_SIZE = 3;
  private readonly BATCH_TIMEOUT = 2000; // 2 seconds

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
  }

  /**
   * Generate career recommendations for a student profile (with caching and batching)
   */
  async generateCareerRecommendations(profile: StudentProfile): Promise<AIResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(profile);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Returning cached response for profile:', profile.id);
      return cached;
    }

    // Add to batch queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ profile, resolve, reject });
      this.processBatchIfReady();
    });
  }

  /**
   * Generate cache key for profile
   */
  private generateCacheKey(profile: StudentProfile): string {
    const key = {
      interests: profile.academicData.interests.sort(),
      grade: profile.personalInfo.grade,
      board: profile.personalInfo.board,
      performance: profile.academicData.performance,
      familyIncome: profile.familyIncome,
      location: profile.socioeconomicData.location
    };
    return JSON.stringify(key);
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): AIResponse | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + this.CACHE_TTL) {
      this.responseCache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  /**
   * Store response in cache
   */
  private setCache(key: string, response: AIResponse): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Process batch if ready
   */
  private processBatchIfReady(): void {
    if (this.processingBatch) return;
    
    if (this.requestQueue.length >= this.BATCH_SIZE) {
      this.processBatch();
    } else if (this.requestQueue.length > 0) {
      // Set timeout to process remaining requests
      setTimeout(() => {
        if (this.requestQueue.length > 0 && !this.processingBatch) {
          this.processBatch();
        }
      }, this.BATCH_TIMEOUT);
    }
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.processingBatch || this.requestQueue.length === 0) return;
    
    this.processingBatch = true;
    const batch = this.requestQueue.splice(0, this.BATCH_SIZE);
    
    try {
      // Process each request in the batch
      const promises = batch.map(async ({ profile, resolve, reject }) => {
        try {
          const cacheKey = this.generateCacheKey(profile);
          
          // Double-check cache (might have been populated by another request)
          const cached = this.getFromCache(cacheKey);
          if (cached) {
            resolve(cached);
            return;
          }

          await this.enforceRateLimit();
          const prompt = this.buildPrompt(profile);
          const response = await this.callOpenAI(prompt);
          const parsedResponse = this.parseResponse(response, profile);
          
          // Cache the response
          this.setCache(cacheKey, parsedResponse);
          resolve(parsedResponse);
        } catch (error) {
          reject(this.handleOpenAIError(error));
        }
      });

      await Promise.all(promises);
    } finally {
      this.processingBatch = false;
      
      // Process next batch if queue has items
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatchIfReady(), 100);
      }
    }
  }

  /**
   * Build comprehensive prompt for career recommendations
   */
  private buildPrompt(profile: StudentProfile): string {
    const { personalInfo, academicData, socioeconomicData, familyIncome, aspirations, constraints } = profile;

    return `You are an expert career counselor specializing in the Indian educational system and NEP 2020 guidelines. 
Analyze the following student profile and provide exactly 3 career recommendations that are:
1. Aligned with NEP 2020 principles and Indian educational pathways
2. Suitable for the student's academic background and interests
3. Realistic given their socioeconomic context
4. Include specific Indian colleges, entrance exams, and scholarships

STUDENT PROFILE:
Personal Information:
- Name: ${personalInfo.name}
- Grade: ${personalInfo.grade}
- Board: ${personalInfo.board}
- Age: ${personalInfo.age || 'Not specified'}
- Gender: ${personalInfo.gender || 'Not specified'}
- Category: ${personalInfo.category || 'Not specified'}
- Language Preference: ${personalInfo.languagePreference}
- Physically Disabled: ${personalInfo.physicallyDisabled ? 'Yes' : 'No'}

Academic Information:
- Interests: ${academicData.interests.join(', ')}
- Current Subjects: ${academicData.subjects.join(', ')}
- Academic Performance: ${academicData.performance}
- Favorite Subjects: ${academicData.favoriteSubjects?.join(', ') || 'None specified'}
- Difficult Subjects: ${academicData.difficultSubjects?.join(', ') || 'None specified'}
- Extracurricular Activities: ${academicData.extracurricularActivities?.join(', ') || 'None specified'}
- Achievements: ${academicData.achievements?.join(', ') || 'None specified'}

Socioeconomic Background:
- Location: ${socioeconomicData.location}
- Family Income: ${familyIncome}
- Family Background: ${socioeconomicData.familyBackground}
- Economic Factors: ${socioeconomicData.economicFactors.join(', ')}
- Area Type: ${socioeconomicData.ruralUrban}
- Internet Access: ${socioeconomicData.internetAccess ? 'Yes' : 'No'}
- Available Devices: ${socioeconomicData.deviceAccess.join(', ')}
- Household Size: ${socioeconomicData.householdSize || 'Not specified'}
- Father's Occupation: ${socioeconomicData.parentOccupation?.father || 'Not specified'}
- Mother's Occupation: ${socioeconomicData.parentOccupation?.mother || 'Not specified'}

Career Aspirations:
- Preferred Careers: ${aspirations?.preferredCareers?.join(', ') || 'Open to suggestions'}
- Preferred Locations: ${aspirations?.preferredLocations?.join(', ') || 'Flexible'}
- Salary Expectations: ${aspirations?.salaryExpectations || 'Not specified'}
- Work-Life Balance Priority: ${aspirations?.workLifeBalance || 'Medium'}

Constraints:
- Financial Constraints: ${constraints?.financialConstraints ? 'Yes' : 'No'}
- Location Constraints: ${constraints?.locationConstraints?.join(', ') || 'None'}
- Family Expectations: ${constraints?.familyExpectations?.join(', ') || 'None specified'}
- Time Constraints: ${constraints?.timeConstraints || 'None specified'}

INSTRUCTIONS:
Provide exactly 3 career recommendations in the following JSON format. Each recommendation should include:

{
  "recommendations": [
    {
      "id": "unique-career-id",
      "title": "Career Title",
      "description": "Detailed description of the career (100-150 words)",
      "nepAlignment": "How this career aligns with NEP 2020 principles",
      "matchScore": 85,
      "requirements": {
        "education": ["Specific degree requirements"],
        "skills": ["Required skills"],
        "entranceExams": ["Relevant Indian entrance exams"],
        "certifications": ["Optional certifications"],
        "personalityTraits": ["Suitable personality traits"]
      },
      "prospects": {
        "averageSalary": {
          "entry": 500000,
          "mid": 1000000,
          "senior": 2000000,
          "currency": "INR"
        },
        "growthRate": "Expected growth percentage",
        "jobMarket": "Current job market status in India",
        "demandLevel": "high/medium/low",
        "futureOutlook": "Future prospects description",
        "workLifeBalance": "excellent/good/average/challenging"
      },
      "pros": ["Advantage 1", "Advantage 2", "Advantage 3"],
      "cons": ["Challenge 1", "Challenge 2"],
      "dayInLife": "Brief description of a typical day",
      "careerPath": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "relatedCareers": ["Related career 1", "Related career 2"],
      "industryInsights": {
        "topCompanies": ["Company 1", "Company 2", "Company 3"],
        "emergingTrends": ["Trend 1", "Trend 2"],
        "challenges": ["Challenge 1", "Challenge 2"],
        "opportunities": ["Opportunity 1", "Opportunity 2"]
      }
    }
  ],
  "reasoning": "Explanation of why these careers were selected based on the student's profile",
  "confidence": 85
}

IMPORTANT GUIDELINES:
1. Match scores should be realistic (60-95 range) based on actual fit
2. Salary figures should be accurate for Indian market in INR
3. Include specific Indian entrance exams (JEE, NEET, CLAT, etc.)
4. Consider the student's socioeconomic background for realistic recommendations
5. Align with NEP 2020's emphasis on multidisciplinary education and skill development
6. Include both traditional and emerging career options
7. Consider the student's location and mobility constraints
8. Factor in family income and financial constraints
9. Provide actionable career paths with specific steps
10. Include relevant Indian companies and market insights

Respond ONLY with the JSON format specified above. Do not include any additional text or explanations outside the JSON.`;
  }

  /**
   * Call OpenAI API with error handling and retries
   */
  private async callOpenAI(prompt: string, retries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert career counselor specializing in Indian education and NEP 2020 guidelines. Provide accurate, culturally relevant career advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          response_format: { type: 'json_object' }
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('Empty response from OpenAI');
        }

        this.requestCount++;
        return response;
      } catch (error: any) {
        console.error(`OpenAI API attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('All OpenAI API attempts failed');
  }

  /**
   * Parse OpenAI response and validate structure
   */
  private parseResponse(response: string, profile: StudentProfile): AIResponse {
    try {
      const parsed = JSON.parse(response);
      
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid response format: missing recommendations array');
      }

      if (parsed.recommendations.length !== 3) {
        throw new Error(`Expected 3 recommendations, got ${parsed.recommendations.length}`);
      }

      // Validate each recommendation
      parsed.recommendations.forEach((rec: any, index: number) => {
        this.validateRecommendation(rec, index);
      });

      // Enrich recommendations with additional data
      const enrichedRecommendations = parsed.recommendations.map((rec: any) => ({
        ...rec,
        visualData: this.generateVisualizationData(rec),
        recommendedColleges: [], // Will be populated by recommendation engine
        scholarships: [], // Will be populated by recommendation engine
      }));

      return {
        recommendations: enrichedRecommendations,
        reasoning: parsed.reasoning || 'AI-generated career recommendations based on profile analysis',
        confidence: parsed.confidence || 80,
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new CustomError(
        'Failed to parse AI response',
        500,
        'AI_RESPONSE_PARSE_ERROR'
      );
    }
  }

  /**
   * Validate individual recommendation structure
   */
  private validateRecommendation(rec: any, index: number): void {
    const required = ['id', 'title', 'description', 'matchScore', 'requirements', 'prospects'];
    
    for (const field of required) {
      if (!rec[field]) {
        throw new Error(`Recommendation ${index + 1} missing required field: ${field}`);
      }
    }

    if (typeof rec.matchScore !== 'number' || rec.matchScore < 0 || rec.matchScore > 100) {
      throw new Error(`Recommendation ${index + 1} has invalid match score: ${rec.matchScore}`);
    }

    if (!rec.prospects.averageSalary || typeof rec.prospects.averageSalary.entry !== 'number') {
      throw new Error(`Recommendation ${index + 1} has invalid salary data`);
    }
  }

  /**
   * Generate visualization data for career recommendation
   */
  private generateVisualizationData(recommendation: any): any {
    const { prospects } = recommendation;
    
    return {
      salaryTrends: {
        labels: ['Entry Level', 'Mid Level', 'Senior Level'],
        datasets: [{
          label: 'Average Salary (INR)',
          data: [
            prospects.averageSalary.entry,
            prospects.averageSalary.mid,
            prospects.averageSalary.senior
          ],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
          borderColor: ['#1D4ED8', '#059669', '#D97706'],
          borderWidth: 2
        }]
      },
      educationPath: {
        steps: recommendation.careerPath?.map((step: string, index: number) => ({
          title: step,
          description: `Step ${index + 1} in career progression`,
          duration: index === 0 ? '2-4 years' : index === 1 ? '1-2 years' : '2-5 years',
          requirements: recommendation.requirements.education || []
        })) || [],
        totalDuration: '5-10 years',
        alternativePaths: [{
          title: 'Fast Track',
          description: 'Accelerated path through certifications',
          steps: ['Online courses', 'Certifications', 'Portfolio building', 'Direct entry']
        }]
      },
      requirements: {
        education: {
          level: recommendation.requirements.education?.[0] || 'Bachelor\'s degree',
          subjects: recommendation.requirements.education || [],
          minimumMarks: '60%',
          preferredBoards: ['CBSE', 'ICSE', 'State Board']
        },
        skills: {
          technical: recommendation.requirements.skills?.filter((skill: string) => 
            skill.toLowerCase().includes('programming') || 
            skill.toLowerCase().includes('software') ||
            skill.toLowerCase().includes('technical')
          ) || [],
          soft: recommendation.requirements.skills?.filter((skill: string) => 
            skill.toLowerCase().includes('communication') || 
            skill.toLowerCase().includes('leadership') ||
            skill.toLowerCase().includes('teamwork')
          ) || [],
          certifications: recommendation.requirements.certifications || []
        },
        experience: {
          internships: ['Industry internships', 'Research projects'],
          projects: ['Portfolio projects', 'Academic projects'],
          competitions: ['National competitions', 'Hackathons', 'Olympiads']
        }
      }
    };
  }

  /**
   * Handle OpenAI API errors
   */
  private handleOpenAIError(error: any): CustomError {
    console.error('OpenAI API Error:', error);

    if (error.code === 'insufficient_quota') {
      return new CustomError(
        'AI service quota exceeded',
        503,
        'AI_QUOTA_EXCEEDED'
      );
    }

    if (error.code === 'rate_limit_exceeded') {
      return new CustomError(
        'AI service rate limit exceeded',
        429,
        'AI_RATE_LIMIT_EXCEEDED'
      );
    }

    if (error.code === 'invalid_api_key') {
      return new CustomError(
        'AI service configuration error',
        500,
        'AI_CONFIG_ERROR'
      );
    }

    if (error.code === 'model_not_found') {
      return new CustomError(
        'AI model not available',
        503,
        'AI_MODEL_UNAVAILABLE'
      );
    }

    if (error.message?.includes('timeout')) {
      return new CustomError(
        'AI service timeout',
        504,
        'AI_TIMEOUT'
      );
    }

    return new CustomError(
      'AI service temporarily unavailable',
      503,
      'AI_SERVICE_UNAVAILABLE'
    );
  }

  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get client statistics
   */
  getStats(): { requestCount: number; lastRequestTime: number } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10,
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}