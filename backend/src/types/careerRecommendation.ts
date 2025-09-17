/**
 * Career Recommendation data models and interfaces
 */

import { College, Scholarship } from '../utils/dataValidation';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface PathData {
  steps: {
    title: string;
    description: string;
    duration: string;
    requirements: string[];
  }[];
  totalDuration: string;
  alternativePaths?: {
    title: string;
    description: string;
    steps: string[];
  }[];
}

export interface RequirementData {
  education: {
    level: string;
    subjects: string[];
    minimumMarks: string;
    preferredBoards: string[];
  };
  skills: {
    technical: string[];
    soft: string[];
    certifications: string[];
  };
  experience: {
    internships: string[];
    projects: string[];
    competitions: string[];
  };
}

export interface VisualizationData {
  salaryTrends: ChartData;
  educationPath: PathData;
  requirements: RequirementData;
  jobMarketTrends?: ChartData;
  skillsRadar?: ChartData;
  geographicDistribution?: ChartData;
}

export interface CareerProspects {
  averageSalary: {
    entry: number;
    mid: number;
    senior: number;
    currency: string;
  };
  growthRate: string;
  jobMarket: string;
  demandLevel: 'high' | 'medium' | 'low';
  futureOutlook: string;
  workLifeBalance: 'excellent' | 'good' | 'average' | 'challenging';
}

export interface CareerRequirements {
  education: string[];
  skills: string[];
  entranceExams: string[];
  certifications?: string[];
  experience?: string[];
  personalityTraits?: string[];
}

export interface CareerRecommendation {
  id: string;
  title: string;
  description: string;
  nepAlignment: string;
  matchScore: number; // 0-100 percentage match with student profile
  requirements: CareerRequirements;
  prospects: CareerProspects;
  recommendedColleges: College[];
  scholarships: Scholarship[];
  visualData: VisualizationData;
  pros: string[];
  cons: string[];
  dayInLife?: string;
  careerPath?: string[];
  relatedCareers?: string[];
  industryInsights?: {
    topCompanies: string[];
    emergingTrends: string[];
    challenges: string[];
    opportunities: string[];
  };
}

export interface RecommendationContext {
  studentProfile: {
    interests: string[];
    strengths: string[];
    preferences: string[];
    constraints: string[];
  };
  reasoningFactors: {
    interestMatch: number;
    skillAlignment: number;
    marketDemand: number;
    financialViability: number;
    educationalFit: number;
  };
  alternativeOptions?: {
    title: string;
    reason: string;
    matchScore: number;
  }[];
}

export interface RecommendationResponse {
  recommendations: CareerRecommendation[];
  context: RecommendationContext;
  metadata: {
    generatedAt: Date;
    profileId: string;
    aiModel: string;
    processingTime: number;
  };
}

/**
 * Career Recommendation validation functions
 */
export class CareerRecommendationValidator {
  static validateCareerRecommendation(recommendation: any): boolean {
    return (
      typeof recommendation.id === 'string' &&
      typeof recommendation.title === 'string' &&
      typeof recommendation.description === 'string' &&
      typeof recommendation.nepAlignment === 'string' &&
      typeof recommendation.matchScore === 'number' &&
      recommendation.matchScore >= 0 &&
      recommendation.matchScore <= 100 &&
      this.validateRequirements(recommendation.requirements) &&
      this.validateProspects(recommendation.prospects) &&
      Array.isArray(recommendation.recommendedColleges) &&
      Array.isArray(recommendation.scholarships) &&
      this.validateVisualizationData(recommendation.visualData) &&
      Array.isArray(recommendation.pros) &&
      Array.isArray(recommendation.cons)
    );
  }

  static validateRequirements(requirements: any): boolean {
    return (
      requirements &&
      Array.isArray(requirements.education) &&
      Array.isArray(requirements.skills) &&
      Array.isArray(requirements.entranceExams)
    );
  }

  static validateProspects(prospects: any): boolean {
    return (
      prospects &&
      prospects.averageSalary &&
      typeof prospects.averageSalary.entry === 'number' &&
      typeof prospects.averageSalary.mid === 'number' &&
      typeof prospects.averageSalary.senior === 'number' &&
      typeof prospects.averageSalary.currency === 'string' &&
      typeof prospects.growthRate === 'string' &&
      typeof prospects.jobMarket === 'string' &&
      ['high', 'medium', 'low'].includes(prospects.demandLevel)
    );
  }

  static validateVisualizationData(visualData: any): boolean {
    return (
      visualData &&
      this.validateChartData(visualData.salaryTrends) &&
      this.validatePathData(visualData.educationPath) &&
      this.validateRequirementData(visualData.requirements)
    );
  }

  static validateChartData(chartData: any): boolean {
    return (
      chartData &&
      Array.isArray(chartData.labels) &&
      Array.isArray(chartData.datasets) &&
      chartData.datasets.every((dataset: any) => 
        typeof dataset.label === 'string' && Array.isArray(dataset.data)
      )
    );
  }

  static validatePathData(pathData: any): boolean {
    return (
      pathData &&
      Array.isArray(pathData.steps) &&
      typeof pathData.totalDuration === 'string' &&
      pathData.steps.every((step: any) => 
        typeof step.title === 'string' &&
        typeof step.description === 'string' &&
        typeof step.duration === 'string' &&
        Array.isArray(step.requirements)
      )
    );
  }

  static validateRequirementData(requirementData: any): boolean {
    return (
      requirementData &&
      requirementData.education &&
      requirementData.skills &&
      requirementData.experience &&
      typeof requirementData.education.level === 'string' &&
      Array.isArray(requirementData.education.subjects) &&
      Array.isArray(requirementData.skills.technical) &&
      Array.isArray(requirementData.skills.soft)
    );
  }
}

/**
 * Utility functions for career recommendations
 */
export class CareerRecommendationUtils {
  static generateRecommendationId(careerTitle: string, profileId: string): string {
    const cleanTitle = careerTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `rec_${cleanTitle}_${profileId.slice(-6)}_${timestamp}`;
  }

  static calculateMatchScore(
    interestMatch: number,
    skillAlignment: number,
    marketDemand: number,
    financialViability: number,
    educationalFit: number
  ): number {
    const weights = {
      interestMatch: 0.3,
      skillAlignment: 0.25,
      marketDemand: 0.2,
      financialViability: 0.15,
      educationalFit: 0.1
    };

    const weightedScore = 
      (interestMatch * weights.interestMatch) +
      (skillAlignment * weights.skillAlignment) +
      (marketDemand * weights.marketDemand) +
      (financialViability * weights.financialViability) +
      (educationalFit * weights.educationalFit);

    return Math.round(weightedScore);
  }

  static generateSalaryTrendsChart(salaryData: {
    entry: number;
    mid: number;
    senior: number;
  }): ChartData {
    return {
      labels: ['Entry Level', 'Mid Level', 'Senior Level'],
      datasets: [{
        label: 'Average Salary (INR)',
        data: [salaryData.entry, salaryData.mid, salaryData.senior],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderColor: ['#1D4ED8', '#059669', '#D97706'],
        borderWidth: 2
      }]
    };
  }

  static generateSkillsRadarChart(skills: {
    technical: number;
    communication: number;
    leadership: number;
    creativity: number;
    analytical: number;
  }): ChartData {
    return {
      labels: ['Technical', 'Communication', 'Leadership', 'Creativity', 'Analytical'],
      datasets: [{
        label: 'Skill Requirements',
        data: [skills.technical, skills.communication, skills.leadership, skills.creativity, skills.analytical],
        backgroundColor: ['rgba(59, 130, 246, 0.2)'],
        borderColor: ['#3B82F6'],
        borderWidth: 2
      }]
    };
  }

  static formatSalaryRange(entry: number, senior: number, currency: string = 'INR'): string {
    const formatAmount = (amount: number): string => {
      if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
      if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toString();
    };

    const symbol = currency === 'INR' ? '₹' : currency + ' ';
    return `${symbol}${formatAmount(entry)} - ${symbol}${formatAmount(senior)}`;
  }

  static categorizeCareerByDemand(growthProjection: string): 'high' | 'medium' | 'low' {
    const growthRate = parseFloat(growthProjection.replace(/[^\d.]/g, ''));
    if (growthRate >= 20) return 'high';
    if (growthRate >= 10) return 'medium';
    return 'low';
  }

  static generateEducationPath(career: any): PathData {
    const steps = [];
    
    // Add education steps based on requirements
    if (career.requiredEducation.some((edu: string) => edu.includes('12'))) {
      steps.push({
        title: 'Complete Class 12',
        description: 'Complete higher secondary education with relevant subjects',
        duration: '2 years',
        requirements: ['Class 10 completion', 'Subject selection based on career path']
      });
    }

    if (career.requiredEducation.some((edu: string) => edu.includes('Bachelor') || edu.includes('BTech') || edu.includes('BSc'))) {
      steps.push({
        title: 'Bachelor\'s Degree',
        description: 'Complete undergraduate education in relevant field',
        duration: '3-4 years',
        requirements: ['Class 12 completion', 'Entrance exam qualification']
      });
    }

    if (career.requiredEducation.some((edu: string) => edu.includes('Master') || edu.includes('MTech') || edu.includes('MSc'))) {
      steps.push({
        title: 'Master\'s Degree',
        description: 'Advanced specialization in chosen field',
        duration: '2 years',
        requirements: ['Bachelor\'s degree', 'Good academic record']
      });
    }

    // Add practical experience step
    steps.push({
      title: 'Gain Experience',
      description: 'Build practical skills through internships and entry-level positions',
      duration: '1-2 years',
      requirements: ['Relevant education', 'Skill development', 'Networking']
    });

    const totalYears = steps.reduce((total, step) => {
      const dur = String(step.duration || '0');
      const firstPart = String(dur.split('-')[0] || '0');
      const years = parseInt(firstPart) || parseInt(String(dur)) || 0;
      return total + years;
    }, 0);

    return {
      steps,
      totalDuration: `${totalYears}-${totalYears + 2} years`,
      alternativePaths: [
        {
          title: 'Fast Track',
          description: 'Accelerated path through certifications and practical experience',
          steps: ['Online certifications', 'Bootcamps', 'Portfolio development', 'Direct industry entry']
        }
      ]
    };
  }

  static sortRecommendationsByScore(recommendations: CareerRecommendation[]): CareerRecommendation[] {
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  static filterRecommendationsByMinScore(
    recommendations: CareerRecommendation[], 
    minScore: number = 60
  ): CareerRecommendation[] {
    return recommendations.filter(rec => rec.matchScore >= minScore);
  }
}