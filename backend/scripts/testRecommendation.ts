import dotenv from 'dotenv';
dotenv.config();

import { RecommendationEngine, RecommendationEngineConfig } from '../src/services/recommendationEngine';
import { StudentProfile } from '../src/types/studentProfile';

async function runTest() {
  const config: RecommendationEngineConfig = {
    useOpenAI: !!process.env.OPENAI_API_KEY && process.env.NODE_ENV === 'production',
    maxRecommendations: 3,
    minMatchScore: 50,
    enableDatabaseEnrichment: false
  };

  // Allow selecting Gemini provider via env var
  if (process.env.GEMINI_API_KEY) {
    (config as any).provider = 'gemini';
    (config as any).geminiConfig = { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL };
  }

  if (config.useOpenAI && process.env.OPENAI_API_KEY) {
    config.openAIConfig = {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
    };
  }

  const engine = new RecommendationEngine(config);

  const profile: StudentProfile = {
    id: 'test-local-001',
    timestamp: new Date(),
    personalInfo: {
      name: 'Test Student',
      grade: '12',
      board: 'CBSE',
      languagePreference: 'english',
      age: 17,
      gender: 'male',
      category: 'General'
    },
    academicData: {
      interests: ['Programming', 'Mathematics', 'Science'],
      subjects: ['Physics', 'Mathematics', 'Computer Science'],
      performance: 'Good',
      favoriteSubjects: ['Mathematics'],
      difficultSubjects: ['Chemistry'],
      extracurricularActivities: ['Coding Club'],
      achievements: ['Regional Coding Contest']
    },
    socioeconomicData: {
      location: 'Bengaluru',
      familyBackground: 'Middle class',
      economicFactors: ['Stable income'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Laptop'],
      householdSize: 4
    },
    familyIncome: '5-10 Lakh per annum',
    aspirations: {
      preferredCareers: ['Software Engineer'],
      preferredLocations: ['Bengaluru', 'Hyderabad'],
      salaryExpectations: '8-12 LPA',
      workLifeBalance: 'medium'
    },
    constraints: {
      financialConstraints: false,
      locationConstraints: [],
      familyExpectations: []
    }
  } as StudentProfile;

  try {
    const result = await engine.generateRecommendations(profile);
    console.log('=== Recommendation Result ===');
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Recommendation test failed:', error);
    if (error.details) console.error('Details:', JSON.stringify(error.details, null, 2));
  }
}

runTest().catch(err => console.error(err));
