/**
 * Integration tests for Profile API endpoints
 * Tests the complete flow with real middleware and validation
 */

import request from 'supertest';
import app from '../../index';
import { StudentProfile } from '../../types/studentProfile';

describe('Profile API Integration Tests', () => {
  const validProfileData: Partial<StudentProfile> = {
    personalInfo: {
      name: 'Arjun Sharma',
      grade: '12',
      board: 'CBSE',
      languagePreference: 'english',
      age: 17,
      gender: 'male',
      category: 'General'
    },
    academicData: {
      interests: ['Technology', 'Science', 'Mathematics'],
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
      performance: 'Excellent',
      favoriteSubjects: ['Mathematics', 'Physics'],
      difficultSubjects: ['Chemistry'],
      extracurricularActivities: ['Science Club', 'Coding', 'Robotics'],
      achievements: ['State Science Fair Winner']
    },
    socioeconomicData: {
      location: 'Delhi',
      familyBackground: 'Middle class family with both parents working in professional jobs',
      economicFactors: ['Stable income', 'Education priority', 'Technology access'],
      ruralUrban: 'urban',
      internetAccess: true,
      deviceAccess: ['Laptop', 'Smartphone', 'Tablet'],
      householdSize: 4,
      parentOccupation: {
        father: 'Software Engineer',
        mother: 'Teacher'
      }
    },
    familyIncome: '8-12 Lakh per annum',
    aspirations: {
      preferredCareers: ['Software Engineer', 'Data Scientist'],
      preferredLocations: ['Delhi', 'Bangalore', 'Hyderabad'],
      salaryExpectations: '10-15 LPA',
      workLifeBalance: 'medium'
    },
    constraints: {
      financialConstraints: false,
      locationConstraints: [],
      familyExpectations: ['Stable career', 'Good growth prospects']
    }
  };

  describe('POST /api/profile - Complete Flow', () => {
    it('should process a complete valid profile successfully', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      // Verify response structure
      expect(response.body).toMatchObject({
        success: true,
        data: {
          profileId: expect.any(String),
          recommendations: expect.any(Array),
          context: expect.any(Object),
          metadata: expect.any(Object)
        },
        timestamp: expect.any(String)
      });

      // Verify recommendations
      expect(response.body.data.recommendations).toHaveLength(3);
      response.body.data.recommendations.forEach((rec: any) => {
        expect(rec).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          matchScore: expect.any(Number),
          requirements: expect.any(Object),
          prospects: expect.any(Object),
          visualData: expect.any(Object),
          pros: expect.any(Array),
          cons: expect.any(Array)
        });
        expect(rec.matchScore).toBeGreaterThanOrEqual(50);
        expect(rec.matchScore).toBeLessThanOrEqual(100);
      });

      // Verify context
      expect(response.body.data.context).toMatchObject({
        studentProfile: {
          interests: expect.any(Array),
          strengths: expect.any(Array),
          preferences: expect.any(Array),
          constraints: expect.any(Array)
        },
        reasoningFactors: {
          interestMatch: expect.any(Number),
          skillAlignment: expect.any(Number),
          marketDemand: expect.any(Number),
          financialViability: expect.any(Number),
          educationalFit: expect.any(Number)
        }
      });

      console.log('Integration test - Generated recommendations:', 
        response.body.data.recommendations.map((r: any) => ({
          title: r.title,
          matchScore: r.matchScore
        }))
      );
    });

    it('should handle science stream student profile', async () => {
      const scienceProfile = {
        ...validProfileData,
        academicData: {
          ...validProfileData.academicData,
          interests: ['Physics', 'Mathematics', 'Engineering', 'Research'],
          subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
          favoriteSubjects: ['Physics', 'Mathematics'],
          performance: 'Excellent'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(scienceProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);

      // Should have science/engineering related recommendations
      const hasSTEMCareer = response.body.data.recommendations.some((rec: any) =>
        rec.title.toLowerCase().includes('engineer') ||
        rec.title.toLowerCase().includes('scientist') ||
        rec.title.toLowerCase().includes('research')
      );
      expect(hasSTEMCareer).toBe(true);
    });

    it('should handle commerce stream student profile', async () => {
      const commerceProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: 'Priya Patel'
        },
        academicData: {
          interests: ['Business', 'Economics', 'Finance', 'Accounting'],
          subjects: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
          performance: 'Good',
          favoriteSubjects: ['Business Studies', 'Economics'],
          difficultSubjects: ['Mathematics'],
          extracurricularActivities: ['Debate Club', 'Business Quiz'],
          achievements: ['Best Speaker Award']
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(commerceProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);

      // Should have commerce/business related recommendations
      const hasCommerceCareer = response.body.data.recommendations.some((rec: any) =>
        rec.title.toLowerCase().includes('account') ||
        rec.title.toLowerCase().includes('business') ||
        rec.title.toLowerCase().includes('finance') ||
        rec.title.toLowerCase().includes('economic')
      );
      expect(hasCommerceCareer).toBe(true);
    });

    it('should handle rural student with financial constraints', async () => {
      const ruralProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: 'Ravi Kumar',
          category: 'SC'
        },
        socioeconomicData: {
          location: 'Rural Rajasthan',
          familyBackground: 'Agricultural family with limited resources',
          economicFactors: ['Seasonal income', 'Limited resources', 'Education aspiration'],
          ruralUrban: 'rural',
          internetAccess: false,
          deviceAccess: ['Basic phone'],
          householdSize: 7,
          parentOccupation: {
            father: 'Farmer',
            mother: 'Homemaker'
          }
        },
        familyIncome: 'Below 2 Lakh per annum',
        constraints: {
          financialConstraints: true,
          locationConstraints: ['Cannot relocate far from home'],
          familyExpectations: ['Stable government job', 'Support family']
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(ruralProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);

      // Should have appropriate recommendations for rural/constrained student
      response.body.data.recommendations.forEach((rec: any) => {
        // Should have realistic salary expectations
        expect(rec.prospects.averageSalary.entry).toBeLessThan(800000);
        
        // Should include scholarship information
        expect(rec.scholarships).toBeDefined();
      });
    });

    it('should handle Hindi language preference', async () => {
      const hindiProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          languagePreference: 'hindi' as const
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(hindiProfile)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(3);
    });
  });

  describe('Validation Tests', () => {
    it('should reject profile with missing required fields', async () => {
      const incompleteProfile = {
        personalInfo: {
          name: 'Test Student'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(incompleteProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject profile with invalid data types', async () => {
      const invalidProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          age: 'not-a-number'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject profile with invalid enum values', async () => {
      const invalidProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          grade: 'invalid-grade'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject profile with too many interests', async () => {
      const tooManyInterestsProfile = {
        ...validProfileData,
        academicData: {
          ...validProfileData.academicData,
          interests: Array(15).fill('Interest') // Too many
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(tooManyInterestsProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject profile with invalid family income format', async () => {
      const invalidIncomeProfile = {
        ...validProfileData,
        familyIncome: 'Invalid income format'
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidIncomeProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize input data', async () => {
      const profileWithExtraSpaces = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: '  Test   Student  '
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileWithExtraSpaces)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject potentially malicious content', async () => {
      const maliciousProfile = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          name: '<script>alert("xss")</script>'
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(maliciousProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large profile data', async () => {
      const largeProfile = {
        ...validProfileData,
        socioeconomicData: {
          ...validProfileData.socioeconomicData,
          familyBackground: 'A'.repeat(1000) // Very long content
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(largeProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should allow reasonable number of requests', async () => {
      // Make 3 requests (should be within limit)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/profile')
          .send(validProfileData);
        
        expect(response.status).toBe(200);
      }
    });

    // Note: Rate limiting test for exceeding limits would require 
    // multiple requests and might be flaky in CI/CD environments
  });

  describe('Statistics and Health Endpoints', () => {
    it('should return profile processing statistics', async () => {
      const response = await request(app)
        .get('/api/profile/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.engine).toBeDefined();
      expect(response.body.data.server).toBeDefined();
    });

    it('should test recommendation engine', async () => {
      const response = await request(app)
        .get('/api/profile/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.engineStatus).toBeDefined();
    });

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/profile/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.services).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle null values appropriately', async () => {
      const profileWithNulls = {
        ...validProfileData,
        personalInfo: {
          ...validProfileData.personalInfo,
          age: null
        }
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileWithNulls)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should process profile within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData)
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Profile processing took ${processingTime}ms`);
    });
  });
});