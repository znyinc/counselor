/**
 * Mock OpenAI Client for testing and development
 */

import { StudentProfile } from '../types/studentProfile';
import { AIResponse } from './openAIClient';

export class MockOpenAIClient {
  private requestCount: number = 0;
  private mockDelay: number = 1000; // 1 second delay to simulate API call

  constructor(private shouldFail: boolean = false) {}

  /**
   * Generate mock career recommendations
   */
  async generateCareerRecommendations(profile: StudentProfile): Promise<AIResponse> {
    this.requestCount++;
    
    // Simulate API delay
    await this.sleep(this.mockDelay);

    if (this.shouldFail) {
      throw new Error('Mock OpenAI API failure');
    }

    return this.generateMockResponse(profile);
  }

  /**
   * Generate mock response based on student profile
   */
  private generateMockResponse(profile: StudentProfile): AIResponse {
    const recommendations = this.selectRecommendationsBasedOnProfile(profile);
    
    return {
      recommendations: recommendations.map(rec => ({
        ...rec,
        visualData: this.generateMockVisualizationData(rec),
        recommendedColleges: [],
        scholarships: [],
      })),
      reasoning: this.generateMockReasoning(profile, recommendations),
      confidence: this.calculateMockConfidence(profile),
    };
  }

  /**
   * Select appropriate mock recommendations based on profile
   */
  private selectRecommendationsBasedOnProfile(profile: StudentProfile): any[] {
    const { academicData, socioeconomicData, familyIncome } = profile;
    const interests = academicData.interests.map(i => i.toLowerCase());
    
    let recommendations: any[] = [];

    // Science/Technology focused recommendations
    if (interests.some(i => ['science', 'technology', 'mathematics', 'engineering'].includes(i))) {
      recommendations.push(this.getMockRecommendation('software-engineer'));
      recommendations.push(this.getMockRecommendation('data-scientist'));
    }

    // Medical/Healthcare recommendations
    if (interests.some(i => ['biology', 'medicine', 'healthcare'].includes(i))) {
      recommendations.push(this.getMockRecommendation('doctor'));
    }

    // Business/Commerce recommendations
    if (interests.some(i => ['business', 'economics', 'commerce'].includes(i))) {
      recommendations.push(this.getMockRecommendation('chartered-accountant'));
    }

    // Arts/Creative recommendations
    if (interests.some(i => ['arts', 'literature', 'design', 'music'].includes(i))) {
      recommendations.push(this.getMockRecommendation('graphic-designer'));
    }

    // Education recommendations
    if (interests.some(i => ['teaching', 'education', 'social-work'].includes(i))) {
      recommendations.push(this.getMockRecommendation('teacher'));
    }

    // Default recommendations if no specific interests match
    if (recommendations.length === 0) {
      recommendations = [
        this.getMockRecommendation('software-engineer'),
        this.getMockRecommendation('teacher'),
        this.getMockRecommendation('chartered-accountant'),
      ];
    }

    // Adjust recommendations based on financial constraints
    if (familyIncome.includes('Below') || familyIncome.includes('1-3')) {
      recommendations = recommendations.filter(rec => 
        rec.prospects.averageSalary.entry <= 600000
      );
      recommendations.push(this.getMockRecommendation('government-officer'));
    }

    // Return exactly 3 recommendations
    return recommendations.slice(0, 3);
  }

  /**
   * Get mock recommendation data
   */
  private getMockRecommendation(type: string): any {
    const recommendations: Record<string, any> = {
      'software-engineer': {
        id: 'software-engineer-mock',
        title: 'Software Engineer',
        description: 'Design, develop, and maintain software applications using modern programming languages and frameworks. Work in diverse industries from startups to large corporations, contributing to digital transformation initiatives.',
        nepAlignment: 'Aligns with NEP 2020\'s emphasis on technology integration, critical thinking, and skill-based learning. Supports India\'s Digital India initiative and promotes innovation.',
        matchScore: 88,
        requirements: {
          education: ['BTech Computer Science', 'BCA', 'BSc Computer Science'],
          skills: ['Programming', 'Problem Solving', 'Software Development', 'Database Management'],
          entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
          certifications: ['AWS Certification', 'Google Cloud Certification'],
          personalityTraits: ['Analytical thinking', 'Attention to detail', 'Continuous learning']
        },
        prospects: {
          averageSalary: {
            entry: 600000,
            mid: 1200000,
            senior: 2500000,
            currency: 'INR'
          },
          growthRate: '25%',
          jobMarket: 'High demand across IT hubs',
          demandLevel: 'high',
          futureOutlook: 'Excellent growth prospects with emerging technologies',
          workLifeBalance: 'good'
        },
        pros: ['High salary potential', 'Remote work opportunities', 'Continuous learning', 'Global career prospects'],
        cons: ['Long working hours', 'Constant skill updates required'],
        dayInLife: 'Code development, team meetings, problem-solving, testing, and continuous learning',
        careerPath: ['Junior Developer', 'Senior Developer', 'Tech Lead', 'Engineering Manager'],
        relatedCareers: ['Data Scientist', 'DevOps Engineer', 'Product Manager'],
        industryInsights: {
          topCompanies: ['TCS', 'Infosys', 'Google', 'Microsoft', 'Amazon'],
          emergingTrends: ['AI/ML Integration', 'Cloud Computing', 'Microservices'],
          challenges: ['Skill obsolescence', 'Work-life balance'],
          opportunities: ['Startup ecosystem', 'Digital transformation', 'Remote work']
        }
      },
      'doctor': {
        id: 'doctor-mock',
        title: 'Medical Doctor',
        description: 'Diagnose and treat patients, provide medical care, and contribute to public health. Specialize in various fields like cardiology, pediatrics, or surgery to serve community healthcare needs.',
        nepAlignment: 'Supports NEP 2020\'s focus on holistic development, research, and social responsibility. Contributes to healthcare accessibility and community service.',
        matchScore: 85,
        requirements: {
          education: ['MBBS', 'MD (Specialization)', 'MS (Surgery)'],
          skills: ['Medical Knowledge', 'Patient Care', 'Communication', 'Emergency Response'],
          entranceExams: ['NEET UG', 'NEET PG', 'AIIMS INICET'],
          certifications: ['Medical License', 'Specialty Board Certification'],
          personalityTraits: ['Empathy', 'Patience', 'Decision-making under pressure']
        },
        prospects: {
          averageSalary: {
            entry: 800000,
            mid: 1500000,
            senior: 3000000,
            currency: 'INR'
          },
          growthRate: '15%',
          jobMarket: 'Consistent demand, especially in rural areas',
          demandLevel: 'high',
          futureOutlook: 'Stable with growing healthcare needs',
          workLifeBalance: 'challenging'
        },
        pros: ['Social impact', 'Job security', 'Respect in society', 'Diverse specializations'],
        cons: ['Long education period', 'High stress', 'Irregular hours'],
        dayInLife: 'Patient consultations, diagnosis, treatment planning, surgeries, and continuous medical education',
        careerPath: ['Medical Student', 'Intern', 'Resident', 'Specialist', 'Senior Consultant'],
        relatedCareers: ['Nurse', 'Pharmacist', 'Medical Researcher'],
        industryInsights: {
          topCompanies: ['AIIMS', 'Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare'],
          emergingTrends: ['Telemedicine', 'AI in Diagnostics', 'Personalized Medicine'],
          challenges: ['Healthcare infrastructure', 'Rural healthcare access'],
          opportunities: ['Digital health', 'Medical tourism', 'Preventive healthcare']
        }
      },
      'teacher': {
        id: 'teacher-mock',
        title: 'Teacher/Educator',
        description: 'Educate and inspire students, develop curriculum, and contribute to the academic and personal growth of learners. Shape future generations through innovative teaching methods.',
        nepAlignment: 'Central to NEP 2020 implementation, focusing on holistic education, critical thinking, and multidisciplinary learning approaches.',
        matchScore: 82,
        requirements: {
          education: ['BEd', 'BA/BSc + BEd', 'MEd'],
          skills: ['Subject Expertise', 'Communication', 'Classroom Management', 'Curriculum Development'],
          entranceExams: ['CTET', 'State TET', 'UGC NET'],
          certifications: ['Teaching License', 'Subject Certifications'],
          personalityTraits: ['Patience', 'Creativity', 'Leadership', 'Adaptability']
        },
        prospects: {
          averageSalary: {
            entry: 300000,
            mid: 600000,
            senior: 1200000,
            currency: 'INR'
          },
          growthRate: '12%',
          jobMarket: 'High demand due to NEP 2020 implementation',
          demandLevel: 'high',
          futureOutlook: 'Growing with education reforms',
          workLifeBalance: 'excellent'
        },
        pros: ['Social impact', 'Job security', 'Vacation time', 'Personal satisfaction'],
        cons: ['Lower initial salary', 'Administrative burden', 'Student behavior challenges'],
        dayInLife: 'Lesson planning, teaching, student assessment, parent meetings, and professional development',
        careerPath: ['Assistant Teacher', 'Teacher', 'Senior Teacher', 'Principal', 'Education Administrator'],
        relatedCareers: ['Education Counselor', 'Curriculum Designer', 'Educational Technology Specialist'],
        industryInsights: {
          topCompanies: ['Government Schools', 'CBSE Schools', 'International Schools', 'EdTech Companies'],
          emergingTrends: ['Digital Learning', 'Personalized Education', 'Skill-based Assessment'],
          challenges: ['Technology integration', 'Student engagement'],
          opportunities: ['Online education', 'Educational content creation', 'Teacher training']
        }
      },
      'chartered-accountant': {
        id: 'chartered-accountant-mock',
        title: 'Chartered Accountant',
        description: 'Provide financial advice, audit accounts, and ensure compliance with financial regulations. Help businesses and individuals manage their finances effectively.',
        nepAlignment: 'Supports NEP 2020\'s emphasis on skill development, entrepreneurship, and financial literacy for economic growth.',
        matchScore: 80,
        requirements: {
          education: ['BCom', 'CA Foundation', 'CA Intermediate', 'CA Final'],
          skills: ['Financial Analysis', 'Taxation', 'Auditing', 'Business Advisory'],
          entranceExams: ['CA Foundation', 'CA Intermediate', 'CA Final'],
          certifications: ['CA Certification', 'CPA (optional)'],
          personalityTraits: ['Attention to detail', 'Analytical thinking', 'Integrity']
        },
        prospects: {
          averageSalary: {
            entry: 600000,
            mid: 1200000,
            senior: 2500000,
            currency: 'INR'
          },
          growthRate: '10%',
          jobMarket: 'Consistent demand across all sectors',
          demandLevel: 'medium',
          futureOutlook: 'Stable with digital transformation opportunities',
          workLifeBalance: 'average'
        },
        pros: ['High earning potential', 'Professional recognition', 'Diverse opportunities', 'Self-employment options'],
        cons: ['Intensive study period', 'High competition', 'Seasonal work pressure'],
        dayInLife: 'Financial analysis, client meetings, audit work, tax planning, and business advisory',
        careerPath: ['CA Student', 'Junior CA', 'Senior CA', 'Partner', 'CFO'],
        relatedCareers: ['Financial Analyst', 'Tax Consultant', 'Investment Banker'],
        industryInsights: {
          topCompanies: ['Big 4 Firms', 'Banks', 'Corporations', 'Government'],
          emergingTrends: ['Digital Accounting', 'Data Analytics', 'Fintech Integration'],
          challenges: ['Automation impact', 'Regulatory changes'],
          opportunities: ['Digital transformation', 'Startup ecosystem', 'International markets']
        }
      },
      'data-scientist': {
        id: 'data-scientist-mock',
        title: 'Data Scientist',
        description: 'Analyze complex data to help organizations make informed decisions using statistical methods, machine learning, and data visualization techniques.',
        nepAlignment: 'Aligns with NEP 2020\'s focus on research, analytical thinking, and technology integration for evidence-based decision making.',
        matchScore: 90,
        requirements: {
          education: ['BTech', 'BSc Statistics', 'BSc Mathematics', 'MTech Data Science'],
          skills: ['Python/R', 'Machine Learning', 'Statistics', 'Data Visualization'],
          entranceExams: ['JEE Main', 'JAM', 'GATE'],
          certifications: ['Google Data Analytics', 'IBM Data Science', 'Microsoft Azure'],
          personalityTraits: ['Analytical thinking', 'Problem-solving', 'Curiosity']
        },
        prospects: {
          averageSalary: {
            entry: 800000,
            mid: 1600000,
            senior: 3500000,
            currency: 'INR'
          },
          growthRate: '35%',
          jobMarket: 'Rapidly growing with high demand',
          demandLevel: 'high',
          futureOutlook: 'Excellent with AI/ML advancement',
          workLifeBalance: 'good'
        },
        pros: ['High demand', 'Excellent salary', 'Diverse applications', 'Remote work options'],
        cons: ['Continuous learning required', 'Complex problem-solving', 'Data quality challenges'],
        dayInLife: 'Data analysis, model building, visualization creation, stakeholder presentations',
        careerPath: ['Junior Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'Data Science Manager'],
        relatedCareers: ['Machine Learning Engineer', 'Business Analyst', 'Research Scientist'],
        industryInsights: {
          topCompanies: ['Google', 'Amazon', 'Flipkart', 'Zomato', 'Paytm'],
          emergingTrends: ['AutoML', 'MLOps', 'Edge AI'],
          challenges: ['Data privacy', 'Model interpretability'],
          opportunities: ['AI democratization', 'Industry 4.0', 'Healthcare analytics']
        }
      },
      'graphic-designer': {
        id: 'graphic-designer-mock',
        title: 'Graphic Designer',
        description: 'Create visual concepts and designs for various media including print, digital, and multimedia platforms to communicate ideas effectively.',
        nepAlignment: 'Supports NEP 2020\'s emphasis on creativity, arts integration, and multidisciplinary learning approaches.',
        matchScore: 75,
        requirements: {
          education: ['BFA', 'BDes', 'Diploma in Graphic Design'],
          skills: ['Adobe Creative Suite', 'Typography', 'Color Theory', 'Brand Design'],
          entranceExams: ['NIFT', 'NID', 'CEED'],
          certifications: ['Adobe Certified Expert', 'Google UX Design'],
          personalityTraits: ['Creativity', 'Visual thinking', 'Attention to detail']
        },
        prospects: {
          averageSalary: {
            entry: 300000,
            mid: 600000,
            senior: 1200000,
            currency: 'INR'
          },
          growthRate: '15%',
          jobMarket: 'Good opportunities in digital media',
          demandLevel: 'medium',
          futureOutlook: 'Growing with digital transformation',
          workLifeBalance: 'good'
        },
        pros: ['Creative satisfaction', 'Diverse projects', 'Freelance opportunities', 'Portfolio-based career'],
        cons: ['Client dependency', 'Irregular income', 'Tight deadlines'],
        dayInLife: 'Design creation, client meetings, concept development, software work',
        careerPath: ['Junior Designer', 'Graphic Designer', 'Senior Designer', 'Creative Director'],
        relatedCareers: ['UI/UX Designer', 'Web Designer', 'Brand Manager'],
        industryInsights: {
          topCompanies: ['Design Studios', 'Advertising Agencies', 'Tech Companies', 'Media Houses'],
          emergingTrends: ['Motion Graphics', 'AR/VR Design', 'Sustainable Design'],
          challenges: ['AI design tools', 'Market saturation'],
          opportunities: ['Digital marketing', 'E-commerce', 'Content creation']
        }
      },
      'government-officer': {
        id: 'government-officer-mock',
        title: 'Government Officer (Civil Services)',
        description: 'Serve in various government departments, implement policies, and contribute to public administration and governance at different levels.',
        nepAlignment: 'Embodies NEP 2020\'s vision of ethical leadership, social responsibility, and nation-building through public service.',
        matchScore: 78,
        requirements: {
          education: ['Bachelor\'s Degree', 'Any discipline'],
          skills: ['Leadership', 'Communication', 'Policy Analysis', 'Public Administration'],
          entranceExams: ['UPSC CSE', 'State PSC', 'SSC CGL'],
          certifications: ['Administrative Training', 'Specialized Course Certifications'],
          personalityTraits: ['Integrity', 'Leadership', 'Social commitment']
        },
        prospects: {
          averageSalary: {
            entry: 500000,
            mid: 800000,
            senior: 1500000,
            currency: 'INR'
          },
          growthRate: '8%',
          jobMarket: 'Stable with regular recruitments',
          demandLevel: 'medium',
          futureOutlook: 'Stable with governance modernization',
          workLifeBalance: 'average'
        },
        pros: ['Job security', 'Social status', 'Pension benefits', 'Social impact'],
        cons: ['Bureaucratic constraints', 'Political pressure', 'Slow career progression'],
        dayInLife: 'Policy implementation, public meetings, administrative work, field visits',
        careerPath: ['Probationer', 'Assistant Collector', 'Collector', 'Secretary', 'Chief Secretary'],
        relatedCareers: ['Policy Analyst', 'Public Relations Officer', 'Development Officer'],
        industryInsights: {
          topCompanies: ['Central Government', 'State Governments', 'PSUs', 'Local Bodies'],
          emergingTrends: ['Digital Governance', 'E-governance', 'Policy Innovation'],
          challenges: ['Bureaucratic reforms', 'Technology adoption'],
          opportunities: ['Good governance', 'Digital India', 'Sustainable development']
        }
      }
    };

    return recommendations[type] || recommendations['software-engineer'];
  }

  /**
   * Generate mock visualization data
   */
  private generateMockVisualizationData(recommendation: any): any {
    return {
      salaryTrends: {
        labels: ['Entry Level', 'Mid Level', 'Senior Level'],
        datasets: [{
          label: 'Average Salary (INR)',
          data: [
            recommendation.prospects.averageSalary.entry,
            recommendation.prospects.averageSalary.mid,
            recommendation.prospects.averageSalary.senior
          ],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
          borderColor: ['#1D4ED8', '#059669', '#D97706'],
          borderWidth: 2
        }]
      },
      educationPath: {
        steps: recommendation.careerPath.map((step: string, index: number) => ({
          title: step,
          description: `Career progression step ${index + 1}`,
          duration: index === 0 ? '1-2 years' : index === 1 ? '2-3 years' : '3-5 years',
          requirements: recommendation.requirements.education
        })),
        totalDuration: '6-10 years',
        alternativePaths: [{
          title: 'Fast Track',
          description: 'Accelerated career path',
          steps: ['Certification', 'Portfolio', 'Entry-level', 'Senior role']
        }]
      },
      requirements: {
        education: {
          level: recommendation.requirements.education[0],
          subjects: recommendation.requirements.education,
          minimumMarks: '60%',
          preferredBoards: ['CBSE', 'ICSE', 'State Board']
        },
        skills: {
          technical: recommendation.requirements.skills.slice(0, 3),
          soft: ['Communication', 'Teamwork', 'Problem Solving'],
          certifications: recommendation.requirements.certifications || []
        },
        experience: {
          internships: ['Industry internships', 'Project work'],
          projects: ['Academic projects', 'Personal projects'],
          competitions: ['National competitions', 'Skill contests']
        }
      }
    };
  }

  /**
   * Generate mock reasoning
   */
  private generateMockReasoning(profile: StudentProfile, recommendations: any[]): string {
    const interests = profile.academicData.interests.join(', ');
    const performance = profile.academicData.performance;
    const location = profile.socioeconomicData.location;
    
    return `Based on the student's interests in ${interests}, ${performance} academic performance, and location in ${location}, these career recommendations align well with their profile. The recommendations consider their socioeconomic background, family income level, and available resources. Each career path offers growth opportunities while being realistic given their current circumstances and educational background.`;
  }

  /**
   * Calculate mock confidence score
   */
  private calculateMockConfidence(profile: StudentProfile): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence based on profile completeness
    if (profile.academicData.interests.length > 3) confidence += 5;
    if (profile.academicData.favoriteSubjects?.length) confidence += 5;
    if (profile.aspirations?.preferredCareers?.length) confidence += 10;
    if (profile.personalInfo.age) confidence += 5;
    if (profile.socioeconomicData.parentOccupation?.father || profile.socioeconomicData.parentOccupation?.mother) {
      confidence += 5;
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get mock statistics
   */
  getStats(): { requestCount: number; lastRequestTime: number } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: Date.now(),
    };
  }

  /**
   * Mock connection test (always succeeds)
   */
  async testConnection(): Promise<boolean> {
    await this.sleep(100);
    return true;
  }

  /**
   * Set mock delay for testing
   */
  setMockDelay(ms: number): void {
    this.mockDelay = ms;
  }

  /**
   * Set failure mode for testing
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}