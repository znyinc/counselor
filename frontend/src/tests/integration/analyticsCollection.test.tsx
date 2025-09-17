/**
 * Analytics Collection Integration Tests
 * Tests analytics data collection during user interactions
 */

// @ts-nocheck

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { server } from './mocks/server';
import { http } from 'msw';
import './setup';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <LanguageProvider>
      {children}
    </LanguageProvider>
  </BrowserRouter>
);

const renderApp = () => {
  return render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
};

describe('Analytics Collection Integration Tests', () => {
  let analyticsRequests: any[] = [];

  beforeEach(() => {
    analyticsRequests = [];
    localStorage.clear();
    sessionStorage.clear();

    // Mock analytics endpoint to capture requests
    server.use(
      rest.get('/api/analytics', (req, res, ctx) => {
        const url = new URL(req.url);
        analyticsRequests.push({
          method: 'GET',
          url: url.toString(),
          params: Object.fromEntries(url.searchParams.entries()),
          timestamp: new Date().toISOString(),
        });

        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              overview: {
                totalStudents: 1500,
                totalRecommendations: 4500,
                activeRegions: 12,
                averageMatchScore: 87.5,
              },
              demographics: {
                byGender: { male: 45, female: 52, other: 3 },
                byCategory: { general: 40, obc: 35, sc: 15, st: 8, ews: 2 },
                byBoard: { cbse: 45, icse: 20, state: 30, ib: 5 },
              },
              trends: {
                popularCareers: [
                  { name: 'Software Engineer', count: 450, percentage: 30 },
                  { name: 'Data Scientist', count: 300, percentage: 20 },
                ],
                regionalDistribution: [
                  { region: 'Maharashtra', students: 300, percentage: 20 },
                  { region: 'Karnataka', students: 250, percentage: 16.7 },
                ],
              },
            },
          })
        );
      }),

      // Mock analytics data submission endpoint
      rest.post('/api/analytics/submit', (req, res, ctx) => {
        analyticsRequests.push({
          method: 'POST',
          body: req.body,
          timestamp: new Date().toISOString(),
        });

        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: { recorded: true },
          })
        );
      })
    );
  });

  describe('User Interaction Analytics', () => {
    it('should collect analytics data during profile submission', async () => {
      const user = userEvent.setup();
      renderApp();

      // Track form start time
      const startTime = Date.now();

      // Fill out profile form
      await user.type(screen.getByLabelText(/Full Name/i), 'Analytics Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      await user.type(screen.getByLabelText(/Age/i), '17');
      await user.selectOptions(screen.getByLabelText(/Gender/i), 'female');
      await user.selectOptions(screen.getByLabelText(/Category/i), 'General');

      // Navigate through sections (tracking section completion times)
      await user.click(screen.getByText(/Next/i));
      
      // Academic section
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science', 'Technology']);
      
      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');
      await user.click(screen.getByText(/Next/i));
      
      // Background section
      await user.type(screen.getByLabelText(/Location/i), 'Mumbai, Maharashtra');
      await user.type(screen.getByLabelText(/Family Background/i), 'Engineering family');
      await user.selectOptions(screen.getByLabelText(/Annual Family Income/i), '10-20l');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'urban');
      await user.click(screen.getByLabelText(/Yes, I have regular internet access/i));
      
      await user.click(screen.getByText(/Next/i));
      
      // Aspirations section
      await user.selectOptions(screen.getByLabelText(/Salary Expectations/i), 'high');
      
      // Submit form
      await user.click(screen.getByText(/Submit Profile/i));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify analytics data was collected
      await waitFor(() => {
        expect(analyticsRequests.some(req => req.method === 'POST')).toBe(true);
      });

      const analyticsSubmission = analyticsRequests.find(req => req.method === 'POST');
      expect(analyticsSubmission).toBeDefined();

      const analyticsData = JSON.parse(analyticsSubmission.body);
      
      // Verify anonymized profile data
      expect(analyticsData).toMatchObject({
        sessionId: expect.any(String),
        timestamp: expect.any(String),
        demographics: {
          grade: '12',
          board: 'CBSE',
          age: 17,
          gender: 'female',
          category: 'General',
          location: 'Maharashtra', // Should be anonymized to state level
        },
        academicProfile: {
          interests: expect.arrayContaining(['Science', 'Technology']),
          performance: 'excellent',
        },
        socioeconomicProfile: {
          incomeRange: '10-20l',
          areaType: 'urban',
          internetAccess: true,
        },
        formMetrics: {
          completionTime: expect.any(Number),
          sectionTimes: expect.any(Object),
          abandonmentPoints: expect.any(Array),
        },
        recommendations: {
          count: 3,
          averageMatchScore: expect.any(Number),
          topCareer: expect.any(String),
        },
      });

      // Verify sensitive data is not included
      expect(analyticsData.demographics).not.toHaveProperty('name');
      expect(analyticsData.socioeconomicProfile).not.toHaveProperty('familyBackground');
    });

    it('should track form abandonment analytics', async () => {
      const user = userEvent.setup();
      renderApp();

      // Start filling form
      await user.type(screen.getByLabelText(/Full Name/i), 'Abandonment Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');

      // Navigate to next section
      await user.click(screen.getByText(/Next/i));

      // Fill partial academic info
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science']);

      // Simulate page unload (abandonment)
      window.dispatchEvent(new Event('beforeunload'));

      // Wait for analytics to be sent
      await waitFor(() => {
        expect(analyticsRequests.some(req => req.method === 'POST')).toBe(true);
      });

      const analyticsData = JSON.parse(analyticsRequests.find(req => req.method === 'POST').body);
      
      expect(analyticsData).toMatchObject({
        event: 'form_abandoned',
        abandonmentPoint: 'academic_section',
        completedSections: ['personal_info'],
        partialData: {
          grade: '12',
          interests: ['Science'],
        },
        timeSpent: expect.any(Number),
      });
    });
  });

  describe('Analytics Dashboard Data Retrieval', () => {
    it('should fetch and display analytics data with filters', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics dashboard
      await user.click(screen.getByText(/Analytics/i));

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Verify initial analytics request
      expect(analyticsRequests.some(req => req.method === 'GET')).toBe(true);

      // Test region filter
      const regionSelect = screen.getByLabelText(/Region/i) || screen.getByDisplayValue(/All Regions/i);
      await user.selectOptions(regionSelect, 'Maharashtra');

      // Verify filtered request
      await waitFor(() => {
        const filteredRequest = analyticsRequests.find(req => 
          req.method === 'GET' && req.params.region === 'Maharashtra'
        );
        expect(filteredRequest).toBeDefined();
      });

      // Test board filter
      const boardSelect = screen.getByLabelText(/Board/i) || screen.getByDisplayValue(/All Boards/i);
      await user.selectOptions(boardSelect, 'CBSE');

      // Verify combined filters
      await waitFor(() => {
        const filteredRequest = analyticsRequests.find(req => 
          req.method === 'GET' && 
          req.params.region === 'Maharashtra' && 
          req.params.board === 'CBSE'
        );
        expect(filteredRequest).toBeDefined();
      });

      // Test time range filter
      const timeRangeSelect = screen.getByLabelText(/Time Range/i) || screen.getByDisplayValue(/Last 30 days/i);
      await user.selectOptions(timeRangeSelect, '7d');

      await waitFor(() => {
        const filteredRequest = analyticsRequests.find(req => 
          req.method === 'GET' && req.params.timeRange === '7d'
        );
        expect(filteredRequest).toBeDefined();
      });
    });

    it('should handle analytics data export functionality', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics dashboard
      await user.click(screen.getByText(/Analytics/i));

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Mock CSV export endpoint
      server.use(
        rest.get('/api/analytics/export/csv', (req, res, ctx) => {
          analyticsRequests.push({
            method: 'GET',
            url: req.url.toString(),
            export: 'csv',
            timestamp: new Date().toISOString(),
          });

          return res(
            ctx.status(200),
            ctx.set('Content-Type') || 'text/csv',
            ctx.set('Content-Disposition') || 'attachment; filename="analytics.csv"',
            ctx.text('Grade,Board,Count\n12,CBSE,450\n11,CBSE,320')
          );
        })
      );

      // Test CSV export
      const csvExportButton = screen.getByText(/Export CSV/i);
      await user.click(csvExportButton);

      await waitFor(() => {
        const exportRequest = analyticsRequests.find(req => req.export === 'csv');
        expect(exportRequest).toBeDefined();
      });
    });
  });

  describe('Privacy Compliance', () => {
    it('should anonymize sensitive data in analytics collection', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit profile with sensitive information
      await user.type(screen.getByLabelText(/Full Name/i), 'Sensitive Data Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));

      // Add sensitive background information
      await user.type(screen.getByLabelText(/Location/i), '123 Specific Street, Mumbai, Maharashtra');
      await user.type(
        screen.getByLabelText(/Family Background/i), 
        'Father works at XYZ Company, mother is a doctor at ABC Hospital'
      );

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify analytics data is anonymized
      await waitFor(() => {
        expect(analyticsRequests.some(req => req.method === 'POST')).toBe(true);
      });

      const analyticsData = JSON.parse(analyticsRequests.find(req => req.method === 'POST').body);

      // Verify PII is removed or anonymized
      expect(analyticsData.demographics).not.toHaveProperty('name');
      expect(analyticsData.demographics.location).toBe('Maharashtra'); // Only state, not full address
      expect(analyticsData.socioeconomicProfile).not.toHaveProperty('familyBackground');
      
      // Verify session ID is used instead of personal identifiers
      expect(analyticsData.sessionId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(analyticsData).not.toHaveProperty('userId');
      expect(analyticsData).not.toHaveProperty('email');
    });

    it('should provide data retention and deletion compliance', async () => {
      const user = userEvent.setup();
      renderApp();

      // Mock data deletion endpoint
      server.use(
        rest.delete('/api/analytics/session/:sessionId', (req, res, ctx) => {
          analyticsRequests.push({
            method: 'DELETE',
            sessionId: req.params.sessionId,
            timestamp: new Date().toISOString(),
          });

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { deleted: true },
            })
          );
        })
      );

      // Submit profile to generate analytics data
      await user.type(screen.getByLabelText(/Full Name/i), 'Deletion Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Get session ID from analytics data
      const analyticsSubmission = analyticsRequests.find(req => req.method === 'POST');
      const sessionId = JSON.parse(analyticsSubmission.body).sessionId;

      // Simulate data deletion request
      await fetch(`/api/analytics/session/${sessionId}`, { method: 'DELETE' });

      // Verify deletion request was processed
      await waitFor(() => {
        const deletionRequest = analyticsRequests.find(req => 
          req.method === 'DELETE' && req.sessionId === sessionId
        );
        expect(deletionRequest).toBeDefined();
      });
    });
  });

  describe('Real-time Analytics Updates', () => {
    it('should update analytics dashboard in real-time', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics dashboard
      await user.click(screen.getByText(/Analytics/i));

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Verify initial data load
      expect(screen.getByText(/1,500/)).toBeInTheDocument(); // Total students

      // Enable auto-refresh
      const autoRefreshToggle = screen.getByLabelText(/Auto Refresh/i);
      await user.click(autoRefreshToggle);

      // Mock updated analytics data
      server.use(
        rest.get('/api/analytics', (req, res, ctx) => {
          analyticsRequests.push({
            method: 'GET',
            autoRefresh: true,
            timestamp: new Date().toISOString(),
          });

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                overview: {
                  totalStudents: 1501, // Updated count
                  totalRecommendations: 4503,
                  activeRegions: 12,
                  averageMatchScore: 87.6,
                },
                // ... rest of data
              },
            })
          );
        })
      );

      // Wait for auto-refresh to trigger
      await waitFor(() => {
        const autoRefreshRequest = analyticsRequests.find(req => req.autoRefresh);
        expect(autoRefreshRequest).toBeDefined();
      }, { timeout: 35000 }); // Auto-refresh typically happens every 30 seconds

      // Verify updated data is displayed
      await waitFor(() => {
        expect(screen.getByText(/1,501/)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const user = userEvent.setup();

      // Mock large dataset
      server.use(
        rest.get('/api/analytics', (req, res, ctx) => {
          const startTime = Date.now();
          
          // Simulate processing time for large dataset
          const largeDataset = {
            overview: {
              totalStudents: 50000,
              totalRecommendations: 150000,
              activeRegions: 35,
              averageMatchScore: 87.5,
            },
            trends: {
              popularCareers: Array.from({ length: 100 }, (_, i) => ({
                name: `Career ${i + 1}`,
                count: Math.floor(Math.random() * 1000),
                percentage: Math.random() * 10,
              })),
              regionalDistribution: Array.from({ length: 35 }, (_, i) => ({
                region: `Region ${i + 1}`,
                students: Math.floor(Math.random() * 5000),
                percentage: Math.random() * 20,
              })),
            },
          };

          const processingTime = Date.now() - startTime;
          
          analyticsRequests.push({
            method: 'GET',
            dataSize: 'large',
            processingTime,
            timestamp: new Date().toISOString(),
          });

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: largeDataset,
            })
          );
        })
      );

      renderApp();

      // Navigate to analytics dashboard
      await user.click(screen.getByText(/Analytics/i));

      // Measure loading time
      const loadStartTime = Date.now();
      
      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      const loadEndTime = Date.now();
      const loadTime = loadEndTime - loadStartTime;

      // Verify reasonable loading time (should be under 5 seconds)
      expect(loadTime).toBeLessThan(5000);

      // Verify large dataset was handled
      const largeDataRequest = analyticsRequests.find(req => req.dataSize === 'large');
      expect(largeDataRequest).toBeDefined();
    });
  });
});