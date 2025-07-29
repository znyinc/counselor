/**
 * Webhook Notifications Integration Tests
 * Tests webhook notification system during user interactions
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

describe('Webhook Notifications Integration Tests', () => {
  let notificationCalls: any[] = [];

  beforeEach(() => {
    notificationCalls = [];
    localStorage.clear();
    sessionStorage.clear();

    // Mock notification endpoint to capture calls
    server.use(
      rest.post('/api/notify', (req, res, ctx) => {
        notificationCalls.push({
          url: req.url.toString(),
          body: req.body,
          headers: Object.fromEntries(req.headers.entries()),
          timestamp: new Date().toISOString(),
        });

        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              notificationId: `notification-${Date.now()}`,
              status: 'sent',
            },
          })
        );
      })
    );
  });

  describe('Profile Submission Notifications', () => {
    it('should trigger webhook notification on successful profile submission', async () => {
      const user = userEvent.setup();
      renderApp();

      // Fill out complete profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      await user.type(screen.getByLabelText(/Age/i), '17');

      // Navigate through form sections
      await user.click(screen.getByText(/Next/i));
      
      // Academic section
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science', 'Technology']);
      
      const subjectsSelect = screen.getByLabelText(/Current Subjects/i);
      await user.selectOptions(subjectsSelect, ['Physics', 'Mathematics']);
      
      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');

      await user.click(screen.getByText(/Next/i));
      
      // Background section
      await user.type(screen.getByLabelText(/Location/i), 'Mumbai, Maharashtra');
      await user.type(screen.getByLabelText(/Family Background/i), 'Engineering family background');
      await user.selectOptions(screen.getByLabelText(/Annual Family Income/i), '10-20l');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'urban');
      await user.click(screen.getByLabelText(/Yes, I have regular internet access/i));

      await user.click(screen.getByText(/Next/i));
      
      // Aspirations section
      const careersSelect = screen.getByLabelText(/Preferred Career Fields/i);
      await user.selectOptions(careersSelect, ['Software Engineering']);
      
      await user.selectOptions(screen.getByLabelText(/Salary Expectations/i), 'high');

      // Submit profile
      await user.click(screen.getByText(/Submit Profile/i));

      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify webhook notification was triggered
      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      const notificationCall = notificationCalls[0];
      expect(notificationCall.url).toContain('/api/notify');
      
      // Verify notification payload structure
      const payload = JSON.parse(notificationCall.body);
      expect(payload).toMatchObject({
        event: 'profile_submitted',
        studentData: expect.objectContaining({
          name: 'Test Student',
          grade: '12',
          board: 'CBSE',
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            matchScore: expect.any(Number),
          }),
        ]),
        timestamp: expect.any(String),
      });
    });

    it('should include parent/counselor contact information in webhook', async () => {
      const user = userEvent.setup();
      renderApp();

      // Fill out profile with parent contact info
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      // Add parent email (if field exists)
      const parentEmailField = screen.queryByLabelText(/Parent Email/i);
      if (parentEmailField) {
        await user.type(parentEmailField, 'parent@example.com');
      }

      // Complete form quickly
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify webhook includes contact information
      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      const payload = JSON.parse(notificationCalls[0].body);
      expect(payload).toMatchObject({
        event: 'profile_submitted',
        contactInfo: expect.objectContaining({
          notifyParents: expect.any(Boolean),
          notifyCounselors: expect.any(Boolean),
        }),
      });
    });
  });

  describe('Webhook Error Handling', () => {
    it('should handle webhook failures gracefully without affecting user experience', async () => {
      // Mock webhook failure
      server.use(
        rest.post('/api/notify', (req, res, ctx) => {
          notificationCalls.push({ failed: true, timestamp: new Date().toISOString() });
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              error: {
                code: 'NOTIFICATION_FAILED',
                message: 'Failed to send notification',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Complete profile submission
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Verify user still gets results despite webhook failure
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify webhook was attempted but failed
      expect(notificationCalls).toHaveLength(1);
      expect(notificationCalls[0].failed).toBe(true);

      // Verify no error message is shown to user
      expect(screen.queryByText(/notification failed/i)).not.toBeInTheDocument();
    });

    it('should retry webhook notifications on temporary failures', async () => {
      let attemptCount = 0;

      // Mock webhook to fail first two times, then succeed
      server.use(
        rest.post('/api/notify', (req, res, ctx) => {
          attemptCount++;
          notificationCalls.push({ 
            attempt: attemptCount, 
            timestamp: new Date().toISOString() 
          });

          if (attemptCount < 3) {
            return res(
              ctx.status(503),
              ctx.json({
                success: false,
                error: {
                  code: 'SERVICE_UNAVAILABLE',
                  message: 'Service temporarily unavailable',
                },
              })
            );
          }

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                notificationId: 'notification-success',
                status: 'sent',
              },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Submit profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify multiple retry attempts were made
      await waitFor(() => {
        expect(notificationCalls.length).toBeGreaterThanOrEqual(3);
      }, { timeout: 15000 });

      expect(attemptCount).toBe(3);
    });
  });

  describe('Webhook Payload Validation', () => {
    it('should send properly formatted webhook payload', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit complete profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      await user.type(screen.getByLabelText(/Age/i), '17');
      await user.selectOptions(screen.getByLabelText(/Gender/i), 'female');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      const payload = JSON.parse(notificationCalls[0].body);

      // Verify required webhook fields
      expect(payload).toMatchObject({
        event: 'profile_submitted',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        studentData: expect.objectContaining({
          name: 'Test Student',
          grade: '12',
          board: 'CBSE',
          age: 17,
          gender: 'female',
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            matchScore: expect.any(Number),
            salaryRange: expect.objectContaining({
              entry: expect.any(Number),
              mid: expect.any(Number),
              senior: expect.any(Number),
            }),
          }),
        ]),
        metadata: expect.objectContaining({
          userAgent: expect.any(String),
          language: expect.any(String),
          sessionId: expect.any(String),
        }),
      });

      // Verify sensitive data is not included
      expect(payload.studentData).not.toHaveProperty('familyIncome');
      expect(payload.studentData).not.toHaveProperty('economicFactors');
    });

    it('should include analytics metadata in webhook payload', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      const payload = JSON.parse(notificationCalls[0].body);

      // Verify analytics metadata
      expect(payload.analytics).toMatchObject({
        formCompletionTime: expect.any(Number),
        processingTime: expect.any(Number),
        recommendationCount: 3,
        averageMatchScore: expect.any(Number),
      });
    });
  });

  describe('n8n Workflow Integration', () => {
    it('should format webhook payload for n8n compatibility', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      const headers = notificationCalls[0].headers;
      const payload = JSON.parse(notificationCalls[0].body);

      // Verify n8n compatible headers
      expect(headers['content-type']).toBe('application/json');
      expect(headers['x-webhook-source']).toBe('ai-career-counseling');

      // Verify n8n compatible payload structure
      expect(payload).toMatchObject({
        workflowData: expect.objectContaining({
          triggerEvent: 'profile_submitted',
          studentProfile: expect.any(Object),
          careerRecommendations: expect.any(Array),
        }),
      });
    });

    it('should handle n8n webhook authentication', async () => {
      // Mock n8n webhook with authentication
      server.use(
        rest.post('/api/notify', (req, res, ctx) => {
          const authHeader = req.headers.get('authorization');
          
          notificationCalls.push({
            hasAuth: !!authHeader,
            authHeader,
            timestamp: new Date().toISOString(),
          });

          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res(
              ctx.status(401),
              ctx.json({
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Missing or invalid authentication',
                },
              })
            );
          }

          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { notificationId: 'auth-success' },
            })
          );
        })
      );

      const user = userEvent.setup();
      renderApp();

      // Submit profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify authentication was included
      await waitFor(() => {
        expect(notificationCalls).toHaveLength(1);
      });

      expect(notificationCalls[0].hasAuth).toBe(true);
      expect(notificationCalls[0].authHeader).toMatch(/^Bearer /);
    });
  });
});