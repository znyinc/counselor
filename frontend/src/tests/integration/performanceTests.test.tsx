/**
 * Performance Integration Tests
 * Tests application performance under various load conditions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { server } from './mocks/server';
import { rest } from 'msw';
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

// Performance measurement utilities
const measurePerformance = async (operation: () => Promise<void>) => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};

const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any existing performance marks
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  });

  describe('Application Load Performance', () => {
    it('should load initial page within acceptable time limits', async () => {
      const loadTime = await measurePerformance(async () => {
        renderApp();
        await waitFor(() => {
          expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
        });
      });

      // Initial page load should be under 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle language switching without performance degradation', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
      });

      // Measure language switch performance
      const switchTime = await measurePerformance(async () => {
        const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
        await user.click(languageSwitcher);
        
        await waitFor(() => {
          expect(screen.getByText('AI करियर काउंसलिंग टूल')).toBeInTheDocument();
        });
      });

      // Language switching should be under 500ms
      expect(switchTime).toBeLessThan(500);
    });

    it('should maintain performance with multiple rapid navigation actions', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
      });

      // Perform rapid navigation
      const navigationTime = await measurePerformance(async () => {
        // Navigate to analytics
        await user.click(screen.getByText(/Analytics/i));
        await waitFor(() => {
          expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
        });

        // Navigate back to profile
        await user.click(screen.getByText(/Profile/i));
        await waitFor(() => {
          expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
        });

        // Navigate to analytics again
        await user.click(screen.getByText(/Analytics/i));
        await waitFor(() => {
          expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
        });
      });

      // Rapid navigation should complete within 3 seconds
      expect(navigationTime).toBeLessThan(3000);
    });
  });

  describe('Form Performance', () => {
    it('should handle form input without lag', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
      });

      // Measure form input performance
      const inputTime = await measurePerformance(async () => {
        await user.type(screen.getByLabelText(/Full Name/i), 'Performance Test Student');
        await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
        await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
        await user.type(screen.getByLabelText(/Age/i), '17');
        await user.selectOptions(screen.getByLabelText(/Gender/i), 'female');
      });

      // Form input should be responsive (under 1 second)
      expect(inputTime).toBeLessThan(1000);
    });

    it('should validate form fields efficiently', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
      });

      // Measure validation performance
      const validationTime = await measurePerformance(async () => {
        // Trigger validation by trying to proceed without filling required fields
        await user.click(screen.getByText(/Next/i));
        
        await waitFor(() => {
          expect(screen.getByText(/Please enter your full name/i)).toBeInTheDocument();
        });

        // Fill field and verify validation clears quickly
        await user.type(screen.getByLabelText(/Full Name/i), 'Test');
        
        await waitFor(() => {
          expect(screen.queryByText(/Please enter your full name/i)).not.toBeInTheDocument();
        });
      });

      // Validation should be near-instantaneous (under 200ms)
      expect(validationTime).toBeLessThan(200);
    });

    it('should handle large form data efficiently', async () => {
      const user = userEvent.setup();
      renderApp();

      // Fill out complete form with extensive data
      const formFillTime = await measurePerformance(async () => {
        // Personal info
        await user.type(screen.getByLabelText(/Full Name/i), 'Very Long Student Name With Multiple Words');
        await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
        await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
        await user.type(screen.getByLabelText(/Age/i), '17');

        await user.click(screen.getByText(/Next/i));

        // Academic info with many selections
        const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
        await user.selectOptions(interestsSelect, [
          'Science', 'Technology', 'Mathematics', 'Arts', 'Social Sciences'
        ]);

        const subjectsSelect = screen.getByLabelText(/Current Subjects/i);
        await user.selectOptions(subjectsSelect, [
          'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'
        ]);

        await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');

        await user.click(screen.getByText(/Next/i));

        // Background info with long text
        await user.type(screen.getByLabelText(/Location/i), 'Very Specific Location With Long Address, Mumbai, Maharashtra, India');
        await user.type(
          screen.getByLabelText(/Family Background/i),
          'Very detailed family background with extensive information about parents education, occupation, and family values. This is a long text to test performance with large form data.'
        );

        await user.click(screen.getByText(/Next/i));
        await user.click(screen.getByText(/Next/i));
      });

      // Large form handling should be under 3 seconds
      expect(formFillTime).toBeLessThan(3000);
    });
  });

  describe('API Performance', () => {
    it('should handle API responses within acceptable timeframes', async () => {
      const user = userEvent.setup();
      renderApp();

      // Fill minimal form
      await user.type(screen.getByLabelText(/Full Name/i), 'API Performance Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));

      // Measure API call performance
      const apiTime = await measurePerformance(async () => {
        await user.click(screen.getByText(/Submit Profile/i));
        
        await waitFor(() => {
          expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
        }, { timeout: 10000 });
      });

      // API response should be under 8 seconds
      expect(apiTime).toBeLessThan(8000);
    });

    it('should handle concurrent API requests efficiently', async () => {
      // Mock multiple concurrent requests
      let requestCount = 0;
      server.use(
        rest.post('/api/profile', (req, res, ctx) => {
          requestCount++;
          const delay = Math.random() * 1000; // Random delay up to 1 second
          
          return res(
            ctx.delay(delay),
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                recommendations: [
                  { id: `concurrent-${requestCount}`, title: 'Test Career', matchScore: 85 }
                ],
                requestId: requestCount,
              },
            })
          );
        })
      );

      const concurrentRequests = [];
      
      // Create 5 concurrent form submissions
      for (let i = 0; i < 5; i++) {
        const promise = (async () => {
          const user = userEvent.setup();
          const { unmount } = renderApp();

          try {
            await user.type(screen.getByLabelText(/Full Name/i), `Concurrent User ${i}`);
            await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
            await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Submit Profile/i));

            await waitFor(() => {
              expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
            }, { timeout: 15000 });

            return true;
          } catch (error) {
            return false;
          } finally {
            unmount();
          }
        })();

        concurrentRequests.push(promise);
      }

      const startTime = performance.now();
      const results = await Promise.all(concurrentRequests);
      const endTime = performance.now();

      // All concurrent requests should complete successfully
      expect(results.every(result => result === true)).toBe(true);
      
      // Concurrent processing should complete within reasonable time (20 seconds)
      expect(endTime - startTime).toBeLessThan(20000);
    });

    it('should handle API errors without performance degradation', async () => {
      // Mock API error
      server.use(
        rest.post('/api/profile', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      await user.type(screen.getByLabelText(/Full Name/i), 'Error Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));

      // Measure error handling performance
      const errorHandlingTime = await measurePerformance(async () => {
        await user.click(screen.getByText(/Submit Profile/i));
        
        await waitFor(() => {
          expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
        });
      });

      // Error handling should be fast (under 2 seconds)
      expect(errorHandlingTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should not have significant memory leaks during normal usage', async () => {
      const user = userEvent.setup();
      
      const initialMemory = measureMemoryUsage();
      
      // Perform multiple operations that could cause memory leaks
      for (let i = 0; i < 3; i++) {
        const { unmount } = renderApp();

        await waitFor(() => {
          expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
        });

        // Navigate through the app
        await user.click(screen.getByText(/Analytics/i));
        await waitFor(() => {
          expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
        });

        await user.click(screen.getByText(/Profile/i));
        await waitFor(() => {
          expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
        });

        // Switch languages
        const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
        await user.click(languageSwitcher);

        unmount();
      }

      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large datasets in analytics without performance issues', async () => {
      // Mock large analytics dataset
      server.use(
        rest.get('/api/analytics', (req, res, ctx) => {
          const largeDataset = {
            overview: {
              totalStudents: 100000,
              totalRecommendations: 300000,
              activeRegions: 50,
              averageMatchScore: 87.5,
            },
            trends: {
              popularCareers: Array.from({ length: 200 }, (_, i) => ({
                name: `Career ${i + 1}`,
                count: Math.floor(Math.random() * 10000),
                percentage: Math.random() * 50,
              })),
              regionalDistribution: Array.from({ length: 50 }, (_, i) => ({
                region: `Region ${i + 1}`,
                students: Math.floor(Math.random() * 20000),
                percentage: Math.random() * 30,
              })),
              monthlyGrowth: Array.from({ length: 24 }, (_, i) => ({
                month: `Month ${i + 1}`,
                students: Math.floor(Math.random() * 5000),
              })),
            },
          };

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: largeDataset,
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics and measure performance
      const analyticsLoadTime = await measurePerformance(async () => {
        await user.click(screen.getByText(/Analytics/i));
        
        await waitFor(() => {
          expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
          expect(screen.getByText(/100,000/)).toBeInTheDocument(); // Large dataset loaded
        });
      });

      // Large dataset should load within reasonable time (5 seconds)
      expect(analyticsLoadTime).toBeLessThan(5000);
    });
  });

  describe('Chart and Visualization Performance', () => {
    it('should render charts efficiently', async () => {
      const user = userEvent.setup();
      renderApp();

      // Complete form to reach results with charts
      await user.type(screen.getByLabelText(/Full Name/i), 'Chart Performance Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Measure chart rendering performance
      const chartRenderTime = await measurePerformance(async () => {
        await waitFor(() => {
          expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
        }, { timeout: 10000 });

        // Wait for charts to render
        await waitFor(() => {
          const canvasElements = document.querySelectorAll('canvas');
          expect(canvasElements.length).toBeGreaterThan(0);
        });
      });

      // Chart rendering should be efficient (under 3 seconds)
      expect(chartRenderTime).toBeLessThan(3000);
    });

    it('should handle chart interactions smoothly', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics dashboard with charts
      await user.click(screen.getByText(/Analytics/i));

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Measure chart interaction performance
      const interactionTime = await measurePerformance(async () => {
        // Test filter changes that update charts
        const regionSelect = screen.getByDisplayValue(/All Regions/i);
        await user.selectOptions(regionSelect, 'Maharashtra');

        await waitFor(() => {
          // Charts should update
          const canvasElements = document.querySelectorAll('canvas');
          expect(canvasElements.length).toBeGreaterThan(0);
        });

        // Change time range
        const timeRangeSelect = screen.getByDisplayValue(/Last 30 days/i);
        await user.selectOptions(timeRangeSelect, '7d');

        await waitFor(() => {
          // Charts should update again
          const canvasElements = document.querySelectorAll('canvas');
          expect(canvasElements.length).toBeGreaterThan(0);
        });
      });

      // Chart interactions should be responsive (under 2 seconds)
      expect(interactionTime).toBeLessThan(2000);
    });
  });

  describe('Mobile Performance', () => {
    it('should maintain performance on mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      window.dispatchEvent(new Event('resize'));

      const user = userEvent.setup();
      
      const mobileLoadTime = await measurePerformance(async () => {
        renderApp();
        
        await waitFor(() => {
          expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
        });
      });

      // Mobile load time should be reasonable (under 3 seconds)
      expect(mobileLoadTime).toBeLessThan(3000);

      // Test mobile form performance
      const mobileFormTime = await measurePerformance(async () => {
        await user.type(screen.getByLabelText(/Full Name/i), 'Mobile Test');
        await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
        await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      });

      // Mobile form interaction should be responsive
      expect(mobileFormTime).toBeLessThan(1500);
    });
  });
});