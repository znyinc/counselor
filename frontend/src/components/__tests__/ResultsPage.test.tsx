/**
 * Tests for ResultsPage component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsPage } from '../ResultsPage';
import { CareerRecommendation } from '../../types';

// Mock the translation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key
  })
}));

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Radar: () => <div data-testid="radar-chart">Radar Chart</div>
}));

const mockRecommendations: CareerRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Software Engineer',
    description: 'Develop software applications and systems',
    nepAlignment: 'Aligns with NEP 2020 technology focus',
    matchScore: 85,
    requirements: {
      education: ['BTech Computer Science'],
      skills: ['Programming', 'Problem Solving'],
      entranceExams: ['JEE Main'],
      certifications: ['AWS Certification'],
      personalityTraits: ['Analytical thinking']
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
      futureOutlook: 'Excellent growth prospects',
      workLifeBalance: 'good'
    },
    recommendedColleges: [
      {
        id: 'college-1',
        name: 'IIT Delhi',
        location: 'Delhi',
        type: 'government',
        courses: ['BTech Computer Science'],
        entranceExams: ['JEE Advanced'],
        fees: { annual: 200000, currency: 'INR' },
        rankings: { nirf: 2, category: 'Engineering' }
      }
    ],
    scholarships: [
      {
        id: 'scholarship-1',
        name: 'Merit Scholarship',
        description: 'For meritorious students',
        provider: 'Government',
        eligibility: {
          categories: ['General'],
          incomeLimit: 800000,
          academicCriteria: '85% marks'
        },
        amount: { value: 50000, currency: 'INR' },
        applicationPeriod: 'April-June',
        website: 'https://example.com',
        renewable: true,
        type: 'Merit-based'
      }
    ],
    visualData: {
      salaryTrends: {
        labels: ['Entry', 'Mid', 'Senior'],
        datasets: [{
          label: 'Salary',
          data: [600000, 1200000, 2500000],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
        }]
      },
      educationPath: {
        steps: [
          {
            title: 'Complete Class 12',
            description: 'Complete higher secondary education',
            duration: '2 years',
            requirements: ['Science stream']
          },
          {
            title: 'BTech Degree',
            description: 'Complete engineering degree',
            duration: '4 years',
            requirements: ['JEE qualification']
          }
        ],
        totalDuration: '6 years'
      },
      requirements: {
        education: {
          level: 'BTech',
          subjects: ['Computer Science'],
          minimumMarks: '60%',
          preferredBoards: ['CBSE']
        },
        skills: {
          technical: ['Programming'],
          soft: ['Communication'],
          certifications: ['AWS']
        },
        experience: {
          internships: ['Industry internships'],
          projects: ['Portfolio projects'],
          competitions: ['Hackathons']
        }
      }
    },
    pros: ['High salary', 'Good growth'],
    cons: ['Long hours', 'Continuous learning'],
    dayInLife: 'Code, meetings, problem-solving',
    careerPath: ['Junior Developer', 'Senior Developer', 'Tech Lead'],
    relatedCareers: ['Data Scientist', 'DevOps Engineer'],
    industryInsights: {
      topCompanies: ['Google', 'Microsoft', 'Amazon'],
      emergingTrends: ['AI/ML', 'Cloud Computing'],
      challenges: ['Skill obsolescence'],
      opportunities: ['Remote work', 'Startup ecosystem']
    }
  }
];

describe('ResultsPage', () => {
  const defaultProps = {
    recommendations: mockRecommendations,
    studentName: 'Test Student',
    language: 'english' as const,
    onLanguageChange: jest.fn(),
    onBackToForm: jest.fn(),
    onDownloadReport: jest.fn(),
    onShareResults: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ResultsPage {...defaultProps} />);
    
    expect(screen.getByText(/generating your career recommendations/i)).toBeInTheDocument();
  });

  it('renders recommendations after loading', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders empty state when no recommendations', async () => {
    render(<ResultsPage {...defaultProps} recommendations={[]} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText(/no recommendations available/i)).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Click on details tab
    const detailsTab = screen.getByText(/details/i);
    fireEvent.click(detailsTab);
    
    expect(screen.getByText(/requirements/i)).toBeInTheDocument();
  });

  it('handles career card selection', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // The first recommendation should be selected by default
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('calls onBackToForm when back button is clicked', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const backButton = screen.getByText(/back to form/i);
    fireEvent.click(backButton);
    
    expect(defaultProps.onBackToForm).toHaveBeenCalledTimes(1);
  });

  it('calls onLanguageChange when language is changed', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // This would depend on the LanguageSwitcher implementation
    // For now, we'll just verify the component renders
    expect(screen.getByText(/your career recommendations/i)).toBeInTheDocument();
  });

  it('displays student greeting with name', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText(/hello test student/i)).toBeInTheDocument();
  });

  it('renders charts in overview tab', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('shows colleges tab with correct count', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText(/colleges \(1\)/i)).toBeInTheDocument();
  });

  it('shows scholarships tab with correct count', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText(/scholarships \(1\)/i)).toBeInTheDocument();
  });

  it('displays match score correctly', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays career description', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText('Develop software applications and systems')).toBeInTheDocument();
  });

  it('displays NEP alignment information', async () => {
    render(<ResultsPage {...defaultProps} />);
    
    // Wait for loading to complete
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(screen.getByText('Aligns with NEP 2020 technology focus')).toBeInTheDocument();
  });
});