/**
 * Language Switching Integration Tests
 * Tests language switching functionality throughout the entire application
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { LanguageProvider } from '../../contexts/LanguageContext';
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

describe('Language Switching Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Language Persistence Across Navigation', () => {
    it('should maintain language preference throughout user journey', async () => {
      const user = userEvent.setup();
      renderApp();

      // Step 1: Verify initial language is English
      expect(screen.getByText('AI Career Counseling Tool')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();

      // Step 2: Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Step 3: Verify Hindi content is displayed
      await waitFor(() => {
        expect(screen.getByText('AI करियर काउंसलिंग टूल')).toBeInTheDocument();
        expect(screen.getByText('व्यक्तिगत जानकारी')).toBeInTheDocument();
      });

      // Step 4: Fill out form in Hindi
      await user.type(screen.getByLabelText(/पूरा नाम/i), 'परीक्षा छात्र');
      await user.selectOptions(screen.getByLabelText(/वर्तमान कक्षा/i), '12');
      await user.selectOptions(screen.getByLabelText(/शिक्षा बोर्ड/i), 'CBSE');

      // Step 5: Navigate to next section
      await user.click(screen.getByText(/आगे/i));

      // Step 6: Verify Hindi is maintained in academic section
      await waitFor(() => {
        expect(screen.getByText('शैक्षणिक जानकारी')).toBeInTheDocument();
        expect(screen.getByText('रुचि के क्षेत्र')).toBeInTheDocument();
      });

      // Step 7: Navigate to results (mock successful submission)
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/जमा करें/i));

      // Step 8: Verify Hindi is maintained in results
      await waitFor(() => {
        expect(screen.getByText('आपकी करियर सिफारिशें')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 9: Navigate back to form
      await user.click(screen.getByText(/प्रोफ़ाइल संशोधित करें/i));

      // Step 10: Verify Hindi is still maintained
      await waitFor(() => {
        expect(screen.getByText('व्यक्तिगत जानकारी')).toBeInTheDocument();
        expect(screen.getByDisplayValue('परीक्षा छात्र')).toBeInTheDocument();
      });
    });

    it('should persist language preference in localStorage', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify localStorage is updated
      await waitFor(() => {
        expect(localStorage.getItem('language')).toBe('hindi');
      });

      // Reload the app (simulate page refresh)
      renderApp();

      // Verify Hindi is loaded from localStorage
      await waitFor(() => {
        expect(screen.getByText('AI करियर काउंसलिंग टूल')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation Messages in Multiple Languages', () => {
    it('should display validation errors in selected language', async () => {
      const user = userEvent.setup();
      renderApp();

      // Test English validation messages first
      await user.click(screen.getByText(/Next/i));

      await waitFor(() => {
        expect(screen.getByText(/Please enter your full name/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select your current grade/i)).toBeInTheDocument();
      });

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify validation messages are now in Hindi
      await waitFor(() => {
        expect(screen.getByText(/कृपया अपना पूरा नाम दर्ज करें/i)).toBeInTheDocument();
        expect(screen.getByText(/कृपया अपनी वर्तमान कक्षा चुनें/i)).toBeInTheDocument();
      });

      // Fill one field and verify specific error disappears
      await user.type(screen.getByLabelText(/पूरा नाम/i), 'परीक्षा छात्र');

      await waitFor(() => {
        expect(screen.queryByText(/कृपया अपना पूरा नाम दर्ज करें/i)).not.toBeInTheDocument();
      });
    });

    it('should show field-specific validation suggestions in correct language', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi first
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Try to enter invalid age
      await user.type(screen.getByLabelText(/आयु/i), '5');
      await user.click(screen.getByText(/आगे/i));

      // Verify Hindi validation message for age
      await waitFor(() => {
        expect(screen.getByText(/कृपया 10 से 25 के बीच एक वैध आयु दर्ज करें/i)).toBeInTheDocument();
      });

      // Switch back to English
      await user.click(screen.getByRole('button', { name: /हिंदी में बदलें/i }));

      // Verify English validation message
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid age between 10 and 25/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Messages in Multiple Languages', () => {
    it('should display API error messages in selected language', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Fill minimal form data
      await user.type(screen.getByLabelText(/पूरा नाम/i), 'परीक्षा छात्र');
      await user.selectOptions(screen.getByLabelText(/वर्तमान कक्षा/i), '12');
      await user.selectOptions(screen.getByLabelText(/शिक्षा बोर्ड/i), 'CBSE');

      // Navigate through form and submit
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));

      // Mock API error by changing endpoint
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await user.click(screen.getByText(/जमा करें/i));

      // Verify Hindi error message
      await waitFor(() => {
        expect(screen.getByText(/नेटवर्क त्रुटि/i)).toBeInTheDocument();
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should display loading messages in selected language', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Fill and submit form
      await user.type(screen.getByLabelText(/पूरा नाम/i), 'परीक्षा छात्र');
      await user.selectOptions(screen.getByLabelText(/वर्तमान कक्षा/i), '12');
      await user.selectOptions(screen.getByLabelText(/शिक्षा बोर्ड/i), 'CBSE');

      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/जमा करें/i));

      // Verify Hindi loading messages
      await waitFor(() => {
        expect(screen.getByText(/AI के साथ संसाधित हो रहा है/i)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Dashboard Language Switching', () => {
    it('should switch language in analytics dashboard', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to analytics dashboard
      await user.click(screen.getByText(/Analytics/i));

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify Hindi content in dashboard
      await waitFor(() => {
        expect(screen.getByText(/एनालिटिक्स डैशबोर्ड/i)).toBeInTheDocument();
        expect(screen.getByText(/कुल छात्र/i)).toBeInTheDocument();
      });

      // Test filter labels in Hindi
      expect(screen.getByText(/सभी क्षेत्र/i)).toBeInTheDocument();
      expect(screen.getByText(/सभी बोर्ड/i)).toBeInTheDocument();
    });
  });

  describe('Results Page Language Switching', () => {
    it('should display career recommendations in selected language', async () => {
      const user = userEvent.setup();
      renderApp();

      // Complete form submission to reach results
      await user.type(screen.getByLabelText(/Full Name/i), 'Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Switch to Hindi on results page
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify Hindi content in results
      await waitFor(() => {
        expect(screen.getByText(/आपकी करियर सिफारिशें/i)).toBeInTheDocument();
        expect(screen.getByText(/मैच/i)).toBeInTheDocument();
      });

      // Verify career details are in Hindi
      expect(screen.getByText(/विवरण देखें/i)).toBeInTheDocument();
      expect(screen.getByText(/प्रोफ़ाइल संशोधित करें/i)).toBeInTheDocument();
    });
  });

  describe('Language Direction and Formatting', () => {
    it('should handle RTL languages correctly (if supported)', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi (which uses LTR but test the direction handling)
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify document direction
      await waitFor(() => {
        const htmlElement = document.documentElement;
        expect(htmlElement.getAttribute('dir')).toBe('ltr');
        expect(htmlElement.getAttribute('lang')).toBe('hi');
      });
    });

    it('should format numbers and dates according to language locale', async () => {
      const user = userEvent.setup();
      renderApp();

      // Complete form to reach results
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

      // Switch to Hindi
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      // Verify salary formatting in Indian locale
      await waitFor(() => {
        // Should show salary in Indian format (₹6,00,000 instead of $600,000)
        expect(screen.getByText(/₹/)).toBeInTheDocument();
      });
    });
  });
});