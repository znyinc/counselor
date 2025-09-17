/**
 * Mock Data for Integration Tests
 * Contains sample data structures for testing
 */

import { StudentProfile } from '../../../types';

export const mockStudentProfile: StudentProfile = {
  id: 'test-profile-123',
  timestamp: new Date(),
  personalInfo: {
    name: 'Test Student',
    grade: '12',
    board: 'CBSE',
    languagePreference: 'english',
    age: 17,
    gender: 'female',
    category: 'General',
    physicallyDisabled: false,
  },
  academicData: {
    interests: ['Science', 'Technology', 'Mathematics'],
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
    performance: 'excellent',
    favoriteSubjects: ['Mathematics', 'Computer Science'],
    difficultSubjects: ['Chemistry'],
    extracurricularActivities: ['Coding Club', 'Science Olympiad'],
    achievements: ['National Science Olympiad Gold Medal', 'State Level Coding Competition Winner'],
  },
  socioeconomicData: {
    location: 'Mumbai, Maharashtra',
    familyBackground: 'Both parents are engineers working in IT companies. Family values education highly.',
    economicFactors: ['Middle class family', 'Both parents working', 'Stable income'],
    ruralUrban: 'urban',
    internetAccess: true,
    deviceAccess: ['Laptop', 'Smartphone', 'Tablet'],
    householdSize: 4,
    parentOccupation: {
      father: 'Software Engineer',
      mother: 'Data Scientist',
    },
    transportMode: 'private-vehicle',
  },
  familyIncome: '10-20l',
  aspirations: {
    preferredCareers: ['Software Engineering', 'Data Science', 'Artificial Intelligence'],
    preferredLocations: ['Mumbai', 'Bangalore', 'Pune'],
    salaryExpectations: 'high',
    workLifeBalance: 'medium',
  },
  constraints: {
    financialConstraints: false,
    locationConstraints: [],
    familyExpectations: ['Family expects me to pursue engineering or technology field'],
    timeConstraints: 'None',
  },
};

export const mockCareerRecommendations = [
  {
    id: 'career-1',
    title: 'Software Engineer',
    description: 'Design and develop software applications and systems',
    matchScore: 95,
    salaryRange: {
      entry: 600000,
      mid: 1200000,
      senior: 2500000,
    },
    educationPath: {
      degree: 'Bachelor of Technology in Computer Science',
      duration: '4 years',
      topColleges: ['IIT Bombay', 'IIT Delhi', 'BITS Pilani'],
      entranceExams: ['JEE Main', 'JEE Advanced', 'BITSAT'],
    },
    skills: ['Programming', 'Problem Solving', 'System Design', 'Database Management'],
    jobMarket: {
      demand: 'High',
      growth: '22%',
      opportunities: 50000,
    },
    pros: ['High salary potential', 'Remote work opportunities', 'Continuous learning'],
    cons: ['High competition', 'Rapidly changing technology', 'Long working hours'],
    dayInLife: 'Write code, attend meetings, solve technical problems, collaborate with team',
    relatedCareers: ['Data Scientist', 'DevOps Engineer', 'Product Manager'],
    scholarships: [
      {
        name: 'Merit Scholarship for Engineering',
        amount: 50000,
        eligibility: 'Top 10% in entrance exam',
      },
    ],
  },
  {
    id: 'career-2',
    title: 'Data Scientist',
    description: 'Analyze complex data to help organizations make informed decisions',
    matchScore: 88,
    salaryRange: {
      entry: 800000,
      mid: 1500000,
      senior: 3000000,
    },
    educationPath: {
      degree: 'Bachelor in Computer Science/Statistics + Master in Data Science',
      duration: '4-6 years',
      topColleges: ['IISc Bangalore', 'IIT Kharagpur', 'ISI Kolkata'],
      entranceExams: ['JEE Main', 'JAM', 'GATE'],
    },
    skills: ['Statistics', 'Machine Learning', 'Python/R', 'Data Visualization'],
    jobMarket: {
      demand: 'Very High',
      growth: '31%',
      opportunities: 25000,
    },
    pros: ['High demand', 'Excellent salary', 'Diverse applications'],
    cons: ['Requires continuous learning', 'Complex problem solving', 'Data quality issues'],
    dayInLife: 'Analyze data, build models, create visualizations, present insights',
    relatedCareers: ['Machine Learning Engineer', 'Business Analyst', 'Research Scientist'],
    scholarships: [
      {
        name: 'Data Science Excellence Scholarship',
        amount: 75000,
        eligibility: 'Outstanding academic performance in mathematics',
      },
    ],
  },
  {
    id: 'career-3',
    title: 'AI/ML Engineer',
    description: 'Develop artificial intelligence and machine learning systems',
    matchScore: 92,
    salaryRange: {
      entry: 1000000,
      mid: 1800000,
      senior: 3500000,
    },
    educationPath: {
      degree: 'Bachelor in Computer Science + Specialization in AI/ML',
      duration: '4-5 years',
      topColleges: ['IIT Bombay', 'IIT Madras', 'IIIT Hyderabad'],
      entranceExams: ['JEE Main', 'JEE Advanced', 'IIIT Entrance'],
    },
    skills: ['Machine Learning', 'Deep Learning', 'Python', 'Neural Networks'],
    jobMarket: {
      demand: 'Extremely High',
      growth: '40%',
      opportunities: 15000,
    },
    pros: ['Cutting-edge technology', 'High salary', 'Innovation opportunities'],
    cons: ['Highly competitive', 'Requires advanced mathematics', 'Rapidly evolving field'],
    dayInLife: 'Design algorithms, train models, optimize performance, research new techniques',
    relatedCareers: ['Research Scientist', 'Robotics Engineer', 'Computer Vision Engineer'],
    scholarships: [
      {
        name: 'AI Innovation Scholarship',
        amount: 100000,
        eligibility: 'Exceptional performance in mathematics and computer science',
      },
    ],
  },
];

export const mockAnalyticsData = {
  overview: {
    totalStudents: 1500,
    totalRecommendations: 4500,
    activeRegions: 12,
    averageMatchScore: 87.5,
  },
  demographics: {
    byGender: {
      male: 45,
      female: 52,
      other: 3,
    },
    byCategory: {
      general: 40,
      obc: 35,
      sc: 15,
      st: 8,
      ews: 2,
    },
    byBoard: {
      cbse: 45,
      icse: 20,
      state: 30,
      ib: 5,
    },
  },
  trends: {
    popularCareers: [
      { name: 'Software Engineer', count: 450, percentage: 30 },
      { name: 'Data Scientist', count: 300, percentage: 20 },
      { name: 'Doctor', count: 225, percentage: 15 },
      { name: 'Teacher', count: 150, percentage: 10 },
      { name: 'Business Analyst', count: 120, percentage: 8 },
    ],
    regionalDistribution: [
      { region: 'Maharashtra', students: 300, percentage: 20 },
      { region: 'Karnataka', students: 250, percentage: 16.7 },
      { region: 'Tamil Nadu', students: 200, percentage: 13.3 },
      { region: 'Delhi', students: 180, percentage: 12 },
      { region: 'Gujarat', students: 150, percentage: 10 },
    ],
    monthlyGrowth: [
      { month: 'Jan', students: 100 },
      { month: 'Feb', students: 120 },
      { month: 'Mar', students: 150 },
      { month: 'Apr', students: 180 },
      { month: 'May', students: 200 },
      { month: 'Jun', students: 250 },
    ],
  },
  performance: {
    averageProcessingTime: 2.5,
    successRate: 98.5,
    userSatisfaction: 4.6,
    systemUptime: 99.9,
  },
};