/**
 * Analytics Dashboard Component Tests
 * Tests for the admin analytics dashboard functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  LineElement: {},
  PointElement: {},
  ArcElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {}
}));

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Bar Chart
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Doughnut Chart
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Pie Chart
    </div>
  )
}));

// Mock fetch
global.fetch = jest.fn();

const mockDashboardData = {
  overview: {
    totalStudents: 1500,
    totalRecommendations: 4500,
    activeRegions: 12,
    popularCareers: ['Software Engineer', 'Doctor', 'Teacher']
  },
  trends: {
    studentGrowth: [
      { period: '2024-01-01', count: 100 },
      { period: '2024-01-08', count: 120 },
      { period: '2024-01-15', count: 150 }
    ],
    careerTrends: [
      { career: 'Software Engineer', count: 450, growth: 15.2 },
      { career: 'Doctor', count: 380, growth: 8.5 },
      { career: 'Teacher', count: 320, growth: -2.1 }
    ],
    regionalDistribution: [
      { region: 'Maharashtra', count: 400, percentage: 26.7 },
      { region: 'Delhi', count: 350, percentage: 23.3 },
      { region: 'Karnataka', count: 300, percentage: 20.0 }
    ]
  },
  demographics: {
    byBoard: [
      { board: 'CBSE', count: 800, percentage: 53.3 },
      { board: 'ICSE', count: 400, percentage: 26.7 },
      { board: 'State Board', count: 300, percentage: 20.0 }
    ],
    byGrade: [
      { grade: '12', count: 600, percentage: 40.0 },
      { grade: '11', count: 500, percentage: 33.3 },
      { grade: '10', count: 400, percentage: 26.7 }
    ],
    byRegion: [
      { region: 'Maharashtra', count: 400, percentage: 26.7 },
      { region: 'Delhi', count: 350, percentage: 23.3 }
    ]
  },
  performance: {
    averageMatchScore: 82.5,
    recommendationAccuracy: 89.2,
    processingTime: 1250,
    userSatisfaction: 4.3
  }
};

const mockTrendData = {
  type: 'student',
  timeRange: '30d',
  data: [
    { period: 'Week 1', value: 100, change: 5.2, trend: 'up' as const },
    { period: 'Week 2', value: 120, change: 20.0, trend: 'up' as const },
    { period: 'Week 3', value: 110, change: -8.3, trend: 'down' as const },
    { period: 'Week 4', value: 130, change: 18.2, trend: 'up' as const }
  ],
  insights: [
    'Student registrations show positive growth trend',
    'Peak activity observed in Week 2 and Week 4',
    'Overall growth of 30% over the period'
  ],
  predictions: [
    { period: 'Week 5', predicted: 140, confidence: 0.85 },
    { period: 'Week 6', predicted: 145, confidence: 0.78 }
  ]
};

const mockRealtimeData = {
  activeUsers: 25,
  currentLoad: 45.2,
  responseTime: 320,
  errorRate: 1.2,
  throughput: 85,
  systemHealth: {
    cpu: 35.5,
    memory: 62.8,
    disk: 28.3
  },
  recentActivity: [
    { action: 'Profile processed', timestamp: '2024-01-15T10:30:00Z', user: 'Student123' },
    { action: 'Report generated', timestamp: '2024-01-15T10:25:00Z', user: 'Admin' }
  ]
};

const renderWithLanguageProvider = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/analytics/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDashboardData })
        });
      }
      if (url.includes('/api/analytics/trends')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTrendData })
        });
      }
      if (url.includes('/api/analytics/realtime')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockRealtimeData })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);
      
      expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Dashboard Data Display', () => {
    it('should display overview cards with correct data', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument(); // Total students
        expect(screen.getByText('4,500')).toBeInTheDocument(); // Total recommendations
        expect(screen.getByText('12')).toBeInTheDocument(); // Active regions
        expect(screen.getByText('82.5%')).toBeInTheDocument(); // Average match score
      });
    });

    it('should display realtime metrics', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // Active users
        expect(screen.getByText('320ms')).toBeInTheDocument(); // Response time
        expect(screen.getByText('85/min')).toBeInTheDocument(); // Throughput
        expect(screen.getByText('1.20%')).toBeInTheDocument(); // Error rate
      });
    });

    it('should display system health bars', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('36%')).toBeInTheDocument(); // CPU
        expect(screen.getByText('63%')).toBeInTheDocument(); // Memory
        expect(screen.getByText('28%')).toBeInTheDocument(); // Disk
      });
    });
  });

  describe('Charts Rendering', () => {
    it('should render all chart types', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Popular careers
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument(); // Regional distribution
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument(); // Board distribution
        expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // Trend analysis
      });
    });

    it('should pass correct data to bar chart', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const barChart = screen.getByTestId('bar-chart');
        const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toEqual(['Software Engineer', 'Doctor', 'Teacher']);
        expect(chartData.datasets[0].data).toEqual([450, 380, 320]);
      });
    });

    it('should pass correct data to doughnut chart', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const doughnutChart = screen.getByTestId('doughnut-chart');
        const chartData = JSON.parse(doughnutChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toEqual(['Maharashtra', 'Delhi', 'Karnataka']);
        expect(chartData.datasets[0].data).toEqual([400, 350, 300]);
      });
    });

    it('should pass correct data to line chart for trends', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const lineChart = screen.getByTestId('line-chart');
        const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '{}');
        
        expect(chartData.labels).toEqual(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
        expect(chartData.datasets[0].data).toEqual([100, 120, 110, 130]);
        expect(chartData.datasets[1].data).toEqual([null, null, null, 130, 140, 145]); // Predictions
      });
    });
  });

  describe('Filtering and Controls', () => {
    it('should render filter controls', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('30d')).toBeInTheDocument(); // Time range select
        expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Region select (empty)
        expect(screen.getByText('All Boards')).toBeInTheDocument(); // Board select
      });
    });

    it('should update data when time range changes', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const timeRangeSelect = screen.getByDisplayValue('30d');
        fireEvent.change(timeRangeSelect, { target: { value: '7d' } });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('timeRange=7d')
        );
      });
    });

    it('should update data when region filter changes', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const regionSelect = screen.getByDisplayValue('');
        fireEvent.change(regionSelect, { target: { value: 'Delhi' } });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('region=Delhi')
        );
      });
    });

    it('should toggle auto-refresh', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const autoRefreshCheckbox = screen.getByRole('checkbox');
        expect(autoRefreshCheckbox).toBeChecked();
        
        fireEvent.click(autoRefreshCheckbox);
        expect(autoRefreshCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should trigger CSV export', async () => {
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        })
      );

      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const csvButton = screen.getByText('Export CSV');
        fireEvent.click(csvButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/export?format=csv')
        );
      });
    });

    it('should trigger PDF export', async () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        })
      );

      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        const pdfButton = screen.getByText('Export PDF');
        fireEvent.click(pdfButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/export?format=pdf')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error loading analytics')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry loading data when retry button is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockImplementation((url: string) => {
          if (url.includes('/api/analytics/dashboard')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: mockDashboardData })
            });
          }
          return Promise.reject(new Error('Unknown URL'));
        });

      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('1,500')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display performance metrics correctly', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('89.2%')).toBeInTheDocument(); // Recommendation accuracy
        expect(screen.getByText('1250ms')).toBeInTheDocument(); // Processing time
        expect(screen.getByText('4.3/5.0')).toBeInTheDocument(); // User satisfaction
      });
    });

    it('should show performance indicators', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('↗ Good performance')).toBeInTheDocument();
        expect(screen.getByText('→ Average response')).toBeInTheDocument();
        expect(screen.getByText('↗ High satisfaction')).toBeInTheDocument();
      });
    });
  });

  describe('Trend Insights', () => {
    it('should display trend insights', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Student registrations show positive growth trend')).toBeInTheDocument();
        expect(screen.getByText('Peak activity observed in Week 2 and Week 4')).toBeInTheDocument();
        expect(screen.getByText('Overall growth of 30% over the period')).toBeInTheDocument();
      });
    });

    it('should display predictions with confidence levels', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Week 5')).toBeInTheDocument();
        expect(screen.getByText('140')).toBeInTheDocument();
        expect(screen.getByText('85% confidence')).toBeInTheDocument();
        
        expect(screen.getByText('Week 6')).toBeInTheDocument();
        expect(screen.getByText('145')).toBeInTheDocument();
        expect(screen.getByText('78% confidence')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activity list', async () => {
      renderWithLanguageProvider(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Profile processed')).toBeInTheDocument();
        expect(screen.getByText('Student123')).toBeInTheDocument();
        expect(screen.getByText('Report generated')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithLanguageProvider(<AnalyticsDashboard />);
      
      // Component should render without errors on mobile
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });
});