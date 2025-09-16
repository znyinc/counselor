/**
 * End-to-End User Journey Integration Tests
 * Tests the complete user flow from form submission to results display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { server } from './mocks/server';
import { rest } from 'msw';
import './setup';

// Test wrapper component
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

describe('Complete User Journey Integration Tests', () => {
  beforeEach(() => {
    // Reset any localStorage or sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Happy Path: Complete Form to Results Flow', () => {
    it('should complete the entire user journey from form to results', async () => {
      const user = userEvent.setup();
      renderApp();

      // Step 1: Verify initial page load
      expect(screen.getByText(/AI Career Counseling/i)).toBeInTheDocument();
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();

      // Step 2: Fill out personal information
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      await user.type(screen.getByLabelText(/Age/i), '17');
      await user.selectOptions(screen.getByLabelText(/Gender/i), 'female');
      await user.selectOptions(screen.getByLabelText(/Category/i), 'General');

      // Step 3: Navigate to academic information
      await user.click(screen.getByText(/Next/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Academic Information/i)).toBeInTheDocument();
      });

      // Step 4: Fill out academic information
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science', 'Technology', 'Mathematics']);

      const subjectsSelect = screen.getByLabelText(/Current Subjects/i);
      await user.selectOptions(subjectsSelect, ['Physics', 'Chemistry', 'Mathematics', 'Computer Science']);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');

      // Step 5: Navigate to background information
      await user.click(screen.getByText(/Next/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Background Information/i)).toBeInTheDocument();
      });

      // Step 6: Fill out socioeconomic information
      await user.type(screen.getByLabelText(/Location/i), 'Mumbai, Maharashtra');
      await user.type(
        screen.getByLabelText(/Family Background/i),
        'Both parents are engineers working in IT companies. Family values education highly.'
      );
      await user.selectOptions(screen.getByLabelText(/Annual Family Income/i), '10-20l');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'urban');
      await user.click(screen.getByLabelText(/Yes, I have regular internet access/i));

      // Step 7: Navigate to aspirations
      await user.click(screen.getByText(/Next/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Career Aspirations/i)).toBeInTheDocument();
      });

      // Step 8: Fill out aspirations
      const careersSelect = screen.getByLabelText(/Preferred Career Fields/i);
      await user.selectOptions(careersSelect, ['Software Engineering', 'Data Science']);

      await user.selectOptions(screen.getByLabelText(/Salary Expectations/i), 'high');
      await user.selectOptions(screen.getByLabelText(/Work-Life Balance Priority/i), 'medium');

      // Step 9: Submit the form
      await user.click(screen.getByText(/Submit Profile/i));

      // Step 10: Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/Processing with AI/i)).toBeInTheDocument();
      });

      // Step 11: Verify results page
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 12: Verify career recommendations are displayed
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Scientist/i)).toBeInTheDocument();
      expect(screen.getByText(/AI\/ML Engineer/i)).toBeInTheDocument();

      // Step 13: Verify match scores are displayed
      expect(screen.getByText(/95% Match/i)).toBeInTheDocument();
      expect(screen.getByText(/88% Match/i)).toBeInTheDocument();
      expect(screen.getByText(/92% Match/i)).toBeInTheDocument();

      // Step 14: Test career card interaction
      const softwareEngineerCard = screen.getByText(/Software Engineer/i).closest('.career-card');
      expect(softwareEngineerCard).toBeInTheDocument();

      await user.click(within(softwareEngineerCard as HTMLElement).getByText(/View Details/i));

      // Step 15: Verify detailed career information
      await waitFor(() => {
        expect(screen.getByText(/Design and develop software applications/i)).toBeInTheDocument();
      });

      // Step 16: Test back navigation
      await user.click(screen.getByText(/Modify Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
      });

      // Verify form data is preserved
      expect(screen.getByDisplayValue('Test Student')).toBeInTheDocument();
    });

    it('should handle form validation errors gracefully', async () => {
      const user = userEvent.setup();
      renderApp();

      // Try to submit without filling required fields
      await user.click(screen.getByText(/Next/i));

      // Verify validation errors are displayed
      await waitFor(() => {
        expect(screen.getByText(/Please enter your full name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select your current grade/i)).toBeInTheDocument();
      });

      // Fill required fields and verify errors disappear
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await waitFor(() => {
        expect(screen.queryByText(/Please enter your full name/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle AI service unavailable error', async () => {
      // Mock AI service error
      server.use(
        rest.post('/api/profile', (req, res, ctx) => {
          return res(
            ctx.status(503),
            ctx.json({
              success: false,
              error: {
                code: 'AI_SERVICE_UNAVAILABLE',
                message: 'AI service is temporarily unavailable',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Fill out minimal form data
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      // Navigate through form quickly
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Verify error notification appears
      await waitFor(() => {
        expect(screen.getByText(/AI service is temporarily unavailable/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });

    it('should handle network timeout errors', async () => {
      // Mock network timeout
      server.use(
        rest.post('/api/profile', (req, res, ctx) => {
          return res(
            ctx.delay(35000),
            ctx.status(408),
            ctx.json({
              success: false,
              error: {
                code: 'TIMEOUT',
                message: 'Request timed out',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Fill out minimal form and submit
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Verify timeout error handling
      await waitFor(() => {
        expect(screen.getByText(/Request timed out/i)).toBeInTheDocument();
      }, { timeout: 40000 });
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit error
      server.use(
        rest.post('/api/profile', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.json({
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Fill out and submit form
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Verify rate limit error message
      await waitFor(() => {
        expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
      });

      // Verify retry countdown is shown
      expect(screen.getByText(/Retry in/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Concurrent Users', () => {
    it('should handle multiple concurrent form submissions', async () => {
      const promises = [];
      
      // Simulate 5 concurrent users
      for (let i = 0; i < 5; i++) {
        const promise = new Promise(async (resolve) => {
          const user = userEvent.setup();
          const { unmount } = renderApp();

          try {
            // Fill out form quickly
            await user.type(screen.getByLabelText(/Full Name/i), `Test Student ${i}`);
            await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
            await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

            // Submit form
            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Next/i));
            await user.click(screen.getByText(/Submit Profile/i));

            // Wait for results
            await waitFor(() => {
              expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
            }, { timeout: 15000 });

            resolve(true);
          } catch (error) {
            resolve(false);
          } finally {
            unmount();
          }
        });

        promises.push(promise);
      }

      // Wait for all concurrent requests to complete
      const results = await Promise.all(promises);
      
      // Verify all requests succeeded
      expect(results.every(result => result === true)).toBe(true);
    });
  });
});