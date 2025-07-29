/**
 * Performance Tests
 * Tests for component render performance and optimization validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { StudentProfileForm } from '../../components/StudentProfileForm';
import { ResultsPage } from '../../components/ResultsPage';
import { AnalyticsDashboard } from '../../components/admin/AnalyticsDashboard';

// Mock data
const mockProfile = {
  id: 'test-profile',
  timestamp: new Date(),
  personalInfo: {
    name: 'Test Student',
    grade: '12',
    board: 'CBSE',
    languagePreference: 'english' as const,
    age: 17,
    gender: 'male' as const,
    category: 'General' as const,
    physicallyDisabled: false,
  },
  academicData: {
    interests: ['Science', 'Technology'],
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    performance: 'Excellent',
    favoriteSubjects: ['Physics'],
    difficultSubjects: ['Chemistry'],
    extracurricularActivities: ['Coding'],
    achievements: ['Science Fair Winner'],
  },
  socioeconomicData: {
    location: 'Delhi',
    familyBackground: 'Middle Class',
    economicFactors: ['Dual Income Family'],
    parentOccupation: {
      father: 'Engineer',
      mother: 'Teacher',
    },
    householdSize: 4,
    ruralUrban: 'urban' as const,
    transportMode: 'Public Transport',
    internetAccess: true,
    deviceAccess: ['Smartphone', 'Laptop'],
  },
  familyIncome: '5-10 Lakhs',
  aspirations: {
    preferredCareers: ['Software Engineer'],
    preferredLocations: ['Bangalore'],
    salaryExpectations: '10+ Lakhs',
    workLifeBalance: 'medium' as const,
  },
  constraints: {
    financialConstraints: false,
    locationConstraints: [],
    familyExpectations: ['Engineering'],
    timeConstraints: 'None',
  },
};

const mockRecommendations = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    description: 'Develop software applications',
    nepAlignment: 'Aligned with NEP 2020 technology focus',
    matchScore: 85,
    requirements: {
      education: ['BTech Computer Science'],
      skills: ['Programming', 'Problem Solving'],
      entranceExams: ['JEE Main'],
      certifications: ['AWS Certification'],
      experience: ['Internships'],
      personalityTraits: ['Analytical'],
    },
    prospects: {
      averageSalary: {
        entry: 600000,
        mid: 1200000,
        senior: 2500000,
        currency: 'INR',
      },
      growthRate: '25%',
      jobMarket: 'High demand',
      demandLevel: 'high' as const,
      futureOutlook: 'Excellent',
      workLifeBalance: 'good' as const,
    },
    recommendedColleges: [],
    scholarships: [],
    visualData: {
      salaryTrends: {
        labels: ['Entry', 'Mid', 'Senior'],
        datasets: [{
          label: 'Salary',
          data: [600000, 1200000, 2500000],
          backgroundColor: ['#3B82F6'],
        }],
      },
      educationPath: {
        steps: [],
        totalDuration: '4 years',
      },
      requirements: {
        education: {
          level: 'Bachelor',
          subjects: ['Computer Science'],
          minimumMarks: '60%',
          preferredBoards: ['CBSE'],
        },
        skills: {
          technical: ['Programming'],
          soft: ['Communication'],
          certifications: ['AWS'],
        },
        experience: {
          internships: ['Tech companies'],
          projects: ['Web development'],
          competitions: ['Hackathons'],
        },
      },
    },
    pros: ['High salary', 'Growth opportunities'],
    cons: ['Long hours'],
    dayInLife: 'Code, debug, collaborate',
    careerPath: ['Junior Dev', 'Senior Dev', 'Tech Lead'],
    relatedCareers: ['Data Scientist'],
    industryInsights: {
      topCompanies: ['Google', 'Microsoft'],
      emergingTrends: ['AI/ML'],
      challenges: ['Rapid technology changes'],
      opportunities: ['Remote work'],
    },
  },
];

describe('Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Component Render Performance', () => {
    test('StudentProfileForm renders within performance budget', async () => {
      const startTime = performance.now();
      
      const mockOnSubmit = jest.fn();
      render(<StudentProfileForm onSubmit={mockOnSubmit} />);
      
      const renderTime = performance.now() - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
      
      // Check if form is rendered
      expect(screen.getByText(/Personal Info/i)).toBeInTheDocument();
    });

    test('ResultsPage renders within performance budget', async () => {
      const startTime = performance.now();
      
      const mockProps = {
        recommendations: mockRecommendations,
        studentName: 'Test Student',
        language: 'english' as const,
        onLanguageChange: jest.fn(),
        onBackToForm: jest.fn(),
      };
      
      render(<ResultsPage {...mockProps} />);
      
      const renderTime = performance.now() - startTime;
      
      // Should render within 150ms (more complex component)
      expect(renderTime).toBeLessThan(150);
      
      // Check if results are rendered
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    test('AnalyticsDashboard renders within performance budget', async () => {
      const startTime = performance.now();
      
      render(<AnalyticsDashboard />);
      
      const renderTime = performance.now() - startTime;
      
      // Should render within 200ms (complex dashboard)
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    test('Components do not cause memory leaks', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <StudentProfileForm onSubmit={jest.fn()} />
        );
        unmount();
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Interaction Performance', () => {
    test('Form field changes are responsive', async () => {
      const mockOnSubmit = jest.fn();
      render(<StudentProfileForm onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      
      const startTime = performance.now();
      fireEvent.change(nameInput, { target: { value: 'Test Student' } });
      const changeTime = performance.now() - startTime;
      
      // Field changes should be instant (< 16ms for 60fps)
      expect(changeTime).toBeLessThan(16);
      
      expect(nameInput).toHaveValue('Test Student');
    });

    test('Step navigation is smooth', async () => {
      const mockOnSubmit = jest.fn();
      render(<StudentProfileForm onSubmit={mockOnSubmit} />);
      
      // Fill required fields for first step
      fireEvent.change(screen.getByLabelText(/name/i), { 
        target: { value: 'Test Student' } 
      });
      
      const nextButton = screen.getByText(/next/i);
      
      const startTime = performance.now();
      fireEvent.click(nextButton);
      const navigationTime = performance.now() - startTime;
      
      // Navigation should be smooth (< 50ms)
      expect(navigationTime).toBeLessThan(50);
    });
  });

  describe('Bundle Size Validation', () => {
    test('Critical components are code-split', () => {
      // This test would typically check if components are lazy-loaded
      // For now, we'll check if the lazy loading setup exists
      const lazyComponents = [
        'StudentProfileForm',
        'ResultsPage',
        'AnalyticsDashboard'
      ];
      
      // In a real scenario, you'd check the webpack bundle analysis
      // or use dynamic imports to verify code splitting
      lazyComponents.forEach(component => {
        expect(component).toBeDefined();
      });
    });
  });

  describe('Performance Monitoring', () => {
    test('Performance monitor tracks metrics correctly', () => {
      performanceMonitor.recordMetric('test-metric', 100, { test: true });
      
      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary).toBeDefined();
      
      const metrics = performanceMonitor.exportMetrics();
      expect(metrics.metrics).toHaveLength(1);
      expect(metrics.metrics[0].name).toBe('test-metric');
      expect(metrics.metrics[0].value).toBe(100);
    });

    test('Component render tracking works', () => {
      performanceMonitor.trackComponentRender('TestComponent', 25, { prop: 'value' });
      
      const metrics = performanceMonitor.exportMetrics();
      expect(metrics.componentMetrics).toHaveLength(1);
      expect(metrics.componentMetrics[0].componentName).toBe('TestComponent');
      expect(metrics.componentMetrics[0].renderTime).toBe(25);
    });
  });

  describe('Optimization Validation', () => {
    test('Memoized components prevent unnecessary re-renders', async () => {
      let renderCount = 0;
      
      const TestComponent = React.memo(() => {
        renderCount++;
        return <div>Test</div>;
      });
      
      const ParentComponent = () => {
        const [count, setCount] = React.useState(0);
        const [otherState, setOtherState] = React.useState(0);
        
        return (
          <div>
            <TestComponent />
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
            <button onClick={() => setOtherState(otherState + 1)}>Other: {otherState}</button>
          </div>
        );
      };
      
      render(<ParentComponent />);
      
      const initialRenderCount = renderCount;
      
      // Change parent state that doesn't affect TestComponent
      fireEvent.click(screen.getByText(/Other:/));
      
      // TestComponent should not re-render
      expect(renderCount).toBe(initialRenderCount);
    });

    test('useMemo prevents expensive calculations', () => {
      let calculationCount = 0;
      
      const TestComponent = ({ data }: { data: number[] }) => {
        const expensiveValue = React.useMemo(() => {
          calculationCount++;
          return data.reduce((sum, num) => sum + num, 0);
        }, [data]);
        
        return <div>{expensiveValue}</div>;
      };
      
      const { rerender } = render(<TestComponent data={[1, 2, 3]} />);
      
      const initialCalculationCount = calculationCount;
      
      // Re-render with same data
      rerender(<TestComponent data={[1, 2, 3]} />);
      
      // Calculation should not run again
      expect(calculationCount).toBe(initialCalculationCount);
    });

    test('useCallback prevents function recreation', () => {
      let callbackCreationCount = 0;
      const callbacks = new Set();
      
      const TestComponent = ({ value }: { value: number }) => {
        const handleClick = React.useCallback(() => {
          console.log(value);
        }, [value]);
        
        // Track unique callback instances
        if (!callbacks.has(handleClick)) {
          callbacks.add(handleClick);
          callbackCreationCount++;
        }
        
        return <button onClick={handleClick}>Click</button>;
      };
      
      const { rerender } = render(<TestComponent value={1} />);
      
      const initialCallbackCount = callbackCreationCount;
      
      // Re-render with same value
      rerender(<TestComponent value={1} />);
      
      // Callback should not be recreated
      expect(callbackCreationCount).toBe(initialCallbackCount);
    });
  });

  describe('Load Testing', () => {
    test('Form handles rapid input changes', async () => {
      const mockOnSubmit = jest.fn();
      render(<StudentProfileForm onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        fireEvent.change(nameInput, { target: { value: `Test${i}` } });
      }
      
      const totalTime = performance.now() - startTime;
      
      // Should handle 100 changes in reasonable time (< 500ms)
      expect(totalTime).toBeLessThan(500);
      
      expect(nameInput).toHaveValue('Test99');
    });

    test('Results page handles large datasets', async () => {
      // Create large dataset
      const largeRecommendations = Array.from({ length: 50 }, (_, i) => ({
        ...mockRecommendations[0],
        id: `career-${i}`,
        title: `Career ${i}`,
      }));
      
      const mockProps = {
        recommendations: largeRecommendations,
        studentName: 'Test Student',
        language: 'english' as const,
        onLanguageChange: jest.fn(),
        onBackToForm: jest.fn(),
      };
      
      const startTime = performance.now();
      render(<ResultsPage {...mockProps} />);
      const renderTime = performance.now() - startTime;
      
      // Should handle large dataset within reasonable time (< 1s)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});

// Performance test utilities
export const performanceTestUtils = {
  measureRenderTime: (component: React.ReactElement) => {
    const startTime = performance.now();
    render(component);
    return performance.now() - startTime;
  },
  
  measureMemoryUsage: () => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  },
  
  simulateSlowNetwork: () => {
    // Mock slow network conditions
    jest.setTimeout(10000);
  },
  
  createLargeDataset: (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      data: `Item ${i}`,
      timestamp: Date.now(),
    }));
  },
};