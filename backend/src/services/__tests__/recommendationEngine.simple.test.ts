/**
 * Simple test to verify RecommendationEngine basic functionality
 */

import { RecommendationEngine, RecommendationEngineConfig } from '../recommendationEngine';
import { StudentProfile } from '../../types/studentProfile';

describe('RecommendationEngine Simple Test', () => {
  let engine: RecommendationEngine;

  const testConfig: RecommendationEngineConfig = {
    useOpenAI: false, // Use mock for testing
    maxRecommendations: 3,
    minMatchScore: 50,
    enableDatabaseEnrichment: false // Disable for simple test
  };

  beforeEach(() => {
    engine = new RecommendationEngine(testConfig);
  });

  it('should create recommendation engine instance', () => {
    expect(engine).toBeDefined();
  });

  it('should generate basic recommendations', async () => {
    const testProfile: StudentProfile = {
      id: 'test-profile-123',
      timestamp: new Date(),
      personalInfo: {
        name: 'Test Student',
        grade: '12',
        board: 'CBSE',
        languagePreference: 'english'
      },
      academicData: {
        interests: ['Technology', 'Programming'],
        subjects: ['Physics', 'Mathematics'],
        performance: 'Good',
        favoriteSubjects: ['Mathematics'],
        difficultSubjects: ['Chemistry'],
        extracurricularActivities: ['Coding Club']
      },
      socioeconomicData: {
        location: 'Delhi',
        familyBackground: 'Middle class',
        economicFactors: ['Stable income'],
        ruralUrban: 'urban',
        internetAccess: true,
        deviceAccess: ['Laptop']
      },
      familyIncome: '5-10 Lakh per annum'
    };

    const result = await engine.generateRecommendations(testProfile);

    expect(result).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.context).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.profileId).toBe(testProfile.id);
  });

  it('should return engine statistics', () => {
    const stats = engine.getStats();
    expect(stats).toBeDefined();
    expect(stats.config).toBeDefined();
    expect(stats.aiClientStats).toBeDefined();
  });

  it('should test engine connectivity', async () => {
    const testResult = await engine.testEngine();
    expect(testResult).toBe(true);
  });
});