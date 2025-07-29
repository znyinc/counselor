/**
 * Unit tests for CareerRecommendation types and utilities
 */

import {
  CareerRecommendation,
  CareerRecommendationValidator,
  CareerRecommendationUtils,
  ChartData,
  PathData,
  RequirementData,
  VisualizationData
} from '../careerRecommendation';

describe('CareerRecommendationValidator', () => {
  const validChartData: ChartData = {
    labels: ['Entry', 'Mid', 'Senior'],
    datasets: [{
      label: 'Salary',
      data: [500000, 1000000, 2000000]
    }]
  };

  const validPathData: PathData = {
    steps: [{
      title: 'Bachelor\'s Degree',
      description: 'Complete undergraduate education',
      duration: '4 years',
      requirements: ['Class 12', 'Entrance exam']
    }],
    totalDuration: '4-6 years'
  };

  const validRequirementData: RequirementData = {
    education: {
      level: 'Bachelor\'s',
      subjects: ['Mathematics', 'Physics'],
      minimumMarks: '75%',
      preferredBoards: ['CBSE', 'ICSE']
    },
    skills: {
      technical: ['Programming'],
      soft: ['Communication'],
      certifications: ['AWS']
    },
    experience: {
      internships: ['Tech company'],
      projects: ['Web development'],
      competitions: ['Hackathon']
    }
  };

  const validVisualizationData: VisualizationData = {
    salaryTrends: validChartData,
    educationPath: validPathData,
    requirements: validRequirementData
  };

  const validCareerRecommendation: CareerRecommendation = {
    id: 'software-engineer-rec',
    title: 'Software Engineer',
    description: 'Develop software applications',
    nepAlignment: 'Science and Technology',
    matchScore: 85,
    requirements: {
      education: ['BTech Computer Science'],
      skills: ['Programming', 'Problem Solving'],
      entranceExams: ['JEE Main']
    },
    prospects: {
      averageSalary: {
        entry: 600000,
        mid: 1200000,
        senior: 2500000,
        currency: 'INR'
      },
      growthRate: '25%',
      jobMarket: 'High demand',
      demandLevel: 'high',
      futureOutlook: 'Excellent',
      workLifeBalance: 'good'
    },
    recommendedColleges: [],
    scholarships: [],
    visualData: validVisualizationData,
    pros: ['High salary', 'Growth opportunities'],
    cons: ['Long hours', 'Continuous learning required']
  };

  describe('validateChartData', () => {
    test('should validate correct chart data', () => {
      const result = CareerRecommendationValidator.validateChartData(validChartData);
      expect(result).toBe(true);
    });

    test('should reject chart data without labels', () => {
      const invalidData = { ...validChartData, labels: undefined };
      const result = CareerRecommendationValidator.validateChartData(invalidData);
      expect(result).toBe(false);
    });

    test('should reject chart data without datasets', () => {
      const invalidData = { ...validChartData, datasets: undefined };
      const result = CareerRecommendationValidator.validateChartData(invalidData);
      expect(result).toBe(false);
    });

    test('should reject datasets without label', () => {
      const invalidData = {
        ...validChartData,
        datasets: [{ data: [1, 2, 3] }]
      };
      const result = CareerRecommendationValidator.validateChartData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('validatePathData', () => {
    test('should validate correct path data', () => {
      const result = CareerRecommendationValidator.validatePathData(validPathData);
      expect(result).toBe(true);
    });

    test('should reject path data without steps', () => {
      const invalidData = { ...validPathData, steps: undefined };
      const result = CareerRecommendationValidator.validatePathData(invalidData);
      expect(result).toBe(false);
    });

    test('should reject path data without total duration', () => {
      const invalidData = { ...validPathData, totalDuration: undefined };
      const result = CareerRecommendationValidator.validatePathData(invalidData);
      expect(result).toBe(false);
    });

    test('should reject steps without required fields', () => {
      const invalidData = {
        ...validPathData,
        steps: [{ title: 'Step 1' }]
      };
      const result = CareerRecommendationValidator.validatePathData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('validateRequirementData', () => {
    test('should validate correct requirement data', () => {
      const result = CareerRecommendationValidator.validateRequirementData(validRequirementData);
      expect(result).toBe(true);
    });

    test('should reject requirement data without education', () => {
      const invalidData = { ...validRequirementData, education: undefined };
      const result = CareerRecommendationValidator.validateRequirementData(invalidData);
      expect(result).toBe(false);
    });

    test('should reject requirement data without skills', () => {
      const invalidData = { ...validRequirementData, skills: undefined };
      const result = CareerRecommendationValidator.validateRequirementData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('validateVisualizationData', () => {
    test('should validate correct visualization data', () => {
      const result = CareerRecommendationValidator.validateVisualizationData(validVisualizationData);
      expect(result).toBe(true);
    });

    test('should reject visualization data without salary trends', () => {
      const invalidData = { ...validVisualizationData, salaryTrends: undefined };
      const result = CareerRecommendationValidator.validateVisualizationData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('validateCareerRecommendation', () => {
    test('should validate complete career recommendation', () => {
      const result = CareerRecommendationValidator.validateCareerRecommendation(validCareerRecommendation);
      expect(result).toBe(true);
    });

    test('should reject recommendation without ID', () => {
      const invalidRec = { ...validCareerRecommendation, id: undefined };
      const result = CareerRecommendationValidator.validateCareerRecommendation(invalidRec);
      expect(result).toBe(false);
    });

    test('should reject recommendation with invalid match score', () => {
      const invalidRec = { ...validCareerRecommendation, matchScore: 150 };
      const result = CareerRecommendationValidator.validateCareerRecommendation(invalidRec);
      expect(result).toBe(false);
    });

    test('should reject recommendation with negative match score', () => {
      const invalidRec = { ...validCareerRecommendation, matchScore: -10 };
      const result = CareerRecommendationValidator.validateCareerRecommendation(invalidRec);
      expect(result).toBe(false);
    });
  });
});

describe('CareerRecommendationUtils', () => {
  describe('generateRecommendationId', () => {
    test('should generate valid recommendation ID', () => {
      const id = CareerRecommendationUtils.generateRecommendationId('Software Engineer', 'profile_123456');
      expect(id).toMatch(/^rec_software-engineer_123456_[a-z0-9]+$/);
    });

    test('should handle special characters in career title', () => {
      const id = CareerRecommendationUtils.generateRecommendationId('Data Scientist & Analyst', 'profile_789');
      expect(id).toMatch(/^rec_data-scientist---analyst_789_[a-z0-9]+$/);
    });
  });

  describe('calculateMatchScore', () => {
    test('should calculate weighted match score correctly', () => {
      const score = CareerRecommendationUtils.calculateMatchScore(80, 70, 90, 60, 85);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should handle perfect scores', () => {
      const score = CareerRecommendationUtils.calculateMatchScore(100, 100, 100, 100, 100);
      expect(score).toBe(100);
    });

    test('should handle zero scores', () => {
      const score = CareerRecommendationUtils.calculateMatchScore(0, 0, 0, 0, 0);
      expect(score).toBe(0);
    });

    test('should weight interest match highest', () => {
      const highInterest = CareerRecommendationUtils.calculateMatchScore(100, 50, 50, 50, 50);
      const lowInterest = CareerRecommendationUtils.calculateMatchScore(50, 100, 100, 100, 100);
      expect(highInterest).toBeGreaterThan(lowInterest);
    });
  });

  describe('generateSalaryTrendsChart', () => {
    test('should generate valid chart data', () => {
      const salaryData = { entry: 500000, mid: 1000000, senior: 2000000 };
      const chartData = CareerRecommendationUtils.generateSalaryTrendsChart(salaryData);
      
      expect(chartData.labels).toEqual(['Entry Level', 'Mid Level', 'Senior Level']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([500000, 1000000, 2000000]);
      expect(chartData.datasets[0].label).toBe('Average Salary (INR)');
    });
  });

  describe('generateSkillsRadarChart', () => {
    test('should generate valid radar chart data', () => {
      const skills = {
        technical: 90,
        communication: 70,
        leadership: 60,
        creativity: 80,
        analytical: 95
      };
      
      const chartData = CareerRecommendationUtils.generateSkillsRadarChart(skills);
      
      expect(chartData.labels).toEqual(['Technical', 'Communication', 'Leadership', 'Creativity', 'Analytical']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].data).toEqual([90, 70, 60, 80, 95]);
    });
  });

  describe('formatSalaryRange', () => {
    test('should format INR salary range correctly', () => {
      const formatted = CareerRecommendationUtils.formatSalaryRange(500000, 2000000, 'INR');
      expect(formatted).toBe('₹5L - ₹20L');
    });

    test('should format crore amounts correctly', () => {
      const formatted = CareerRecommendationUtils.formatSalaryRange(1000000, 15000000, 'INR');
      expect(formatted).toBe('₹10L - ₹1.5 Cr');
    });

    test('should handle other currencies', () => {
      const formatted = CareerRecommendationUtils.formatSalaryRange(50000, 150000, 'USD');
      expect(formatted).toBe('USD 50K - USD 150K');
    });

    test('should default to INR', () => {
      const formatted = CareerRecommendationUtils.formatSalaryRange(600000, 1200000);
      expect(formatted).toBe('₹6L - ₹12L');
    });
  });

  describe('categorizeCareerByDemand', () => {
    test('should categorize high growth as high demand', () => {
      const category = CareerRecommendationUtils.categorizeCareerByDemand('25% growth expected');
      expect(category).toBe('high');
    });

    test('should categorize medium growth as medium demand', () => {
      const category = CareerRecommendationUtils.categorizeCareerByDemand('15% growth expected');
      expect(category).toBe('medium');
    });

    test('should categorize low growth as low demand', () => {
      const category = CareerRecommendationUtils.categorizeCareerByDemand('5% growth expected');
      expect(category).toBe('low');
    });

    test('should handle complex growth strings', () => {
      const category = CareerRecommendationUtils.categorizeCareerByDemand('Expected growth of 22.5% by 2030');
      expect(category).toBe('high');
    });
  });

  describe('generateEducationPath', () => {
    test('should generate education path for engineering career', () => {
      const career = {
        requiredEducation: ['Class 12', 'BTech Computer Science', 'MTech (Optional)']
      };
      
      const path = CareerRecommendationUtils.generateEducationPath(career);
      
      expect(path.steps).toHaveLength(4); // 12th, BTech, MTech, Experience
      expect(path.steps[0].title).toBe('Complete Class 12');
      expect(path.steps[1].title).toBe('Bachelor\'s Degree');
      expect(path.steps[2].title).toBe('Master\'s Degree');
      expect(path.steps[3].title).toBe('Gain Experience');
      expect(path.totalDuration).toMatch(/\d+-\d+ years/);
    });

    test('should generate path without masters for basic careers', () => {
      const career = {
        requiredEducation: ['Class 12', 'Bachelor\'s Degree']
      };
      
      const path = CareerRecommendationUtils.generateEducationPath(career);
      
      expect(path.steps).toHaveLength(3); // 12th, Bachelor's, Experience
      expect(path.alternativePaths).toBeDefined();
      expect(path.alternativePaths![0].title).toBe('Fast Track');
    });
  });

  describe('sortRecommendationsByScore', () => {
    test('should sort recommendations by match score descending', () => {
      const recommendations: CareerRecommendation[] = [
        { matchScore: 70 } as CareerRecommendation,
        { matchScore: 90 } as CareerRecommendation,
        { matchScore: 80 } as CareerRecommendation
      ];
      
      const sorted = CareerRecommendationUtils.sortRecommendationsByScore(recommendations);
      
      expect(sorted[0].matchScore).toBe(90);
      expect(sorted[1].matchScore).toBe(80);
      expect(sorted[2].matchScore).toBe(70);
    });
  });

  describe('filterRecommendationsByMinScore', () => {
    test('should filter recommendations by minimum score', () => {
      const recommendations: CareerRecommendation[] = [
        { matchScore: 70 } as CareerRecommendation,
        { matchScore: 50 } as CareerRecommendation,
        { matchScore: 80 } as CareerRecommendation
      ];
      
      const filtered = CareerRecommendationUtils.filterRecommendationsByMinScore(recommendations, 60);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(rec => rec.matchScore >= 60)).toBe(true);
    });

    test('should use default minimum score of 60', () => {
      const recommendations: CareerRecommendation[] = [
        { matchScore: 70 } as CareerRecommendation,
        { matchScore: 50 } as CareerRecommendation,
        { matchScore: 80 } as CareerRecommendation
      ];
      
      const filtered = CareerRecommendationUtils.filterRecommendationsByMinScore(recommendations);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(rec => rec.matchScore >= 60)).toBe(true);
    });
  });
});