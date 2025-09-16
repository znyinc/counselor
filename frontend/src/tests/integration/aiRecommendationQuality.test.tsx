/**
 * AI Recommendation Quality Integration Tests
 * Tests AI recommendation quality and NEP 2020 alignment
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

describe('AI Recommendation Quality Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('NEP 2020 Alignment Validation', () => {
    it('should provide recommendations aligned with NEP 2020 multidisciplinary approach', async () => {
      const user = userEvent.setup();
      renderApp();

      // Create profile with diverse interests (NEP 2020 encourages multidisciplinary learning)
      await user.type(screen.getByLabelText(/Full Name/i), 'Multidisciplinary Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '11');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));

      // Select diverse interests spanning STEM and humanities
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, [
        'Science', 'Technology', 'Arts', 'Social Sciences'
      ]);

      const subjectsSelect = screen.getByLabelText(/Current Subjects/i);
      await user.selectOptions(subjectsSelect, [
        'Physics', 'Mathematics', 'English', 'Psychology'
      ]);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'good');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Wait for recommendations
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify recommendations include multidisciplinary careers
      const careerTitles = screen.getAllByText(/Engineer|Scientist|Designer|Analyst/i);
      expect(careerTitles.length).toBeGreaterThan(0);

      // Check for NEP 2020 aligned career paths
      const expectedNEPCareers = [
        'Data Scientist', // STEM + Analytics
        'UX Designer', // Technology + Arts
        'Environmental Engineer', // Science + Social Impact
        'Educational Technology Specialist', // Education + Technology
      ];

      // At least one recommendation should align with NEP 2020 multidisciplinary approach
      const hasMultidisciplinaryCareer = expectedNEPCareers.some(career => 
        screen.queryByText(new RegExp(career, 'i'))
      );
      expect(hasMultidisciplinaryCareer).toBe(true);
    });

    it('should consider socioeconomic factors in recommendations per NEP 2020 equity principles', async () => {
      const user = userEvent.setup();
      renderApp();

      // Create profile representing economically disadvantaged student
      await user.type(screen.getByLabelText(/Full Name/i), 'Equity Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'State Board');
      await user.selectOptions(screen.getByLabelText(/Category/i), 'SC');

      await user.click(screen.getByText(/Next/i));

      // Academic interests
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science', 'Technology']);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'average');

      await user.click(screen.getByText(/Next/i));

      // Socioeconomic background indicating financial constraints
      await user.type(screen.getByLabelText(/Location/i), 'Rural Village, Bihar');
      await user.type(screen.getByLabelText(/Family Background/i), 'First generation learner, agricultural family');
      await user.selectOptions(screen.getByLabelText(/Annual Family Income/i), 'below-1l');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'rural');
      await user.click(screen.getByLabelText(/No, limited or no internet access/i));

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify recommendations include scholarship information
      expect(screen.getByText(/Available Scholarships/i)).toBeInTheDocument();
      expect(screen.getByText(/SC\/ST Scholarship/i)).toBeInTheDocument();

      // Verify recommendations consider financial constraints
      const careerCards = screen.getAllByText(/View Details/i);
      await user.click(careerCards[0]);

      // Should show affordable education paths
      await waitFor(() => {
        expect(screen.getByText(/Government Colleges/i)).toBeInTheDocument();
        expect(screen.getByText(/Distance Learning/i)).toBeInTheDocument();
      });
    });

    it('should provide vernacular language support as per NEP 2020', async () => {
      const user = userEvent.setup();
      renderApp();

      // Switch to Hindi (vernacular language support)
      const languageSwitcher = screen.getByRole('button', { name: /switch to/i });
      await user.click(languageSwitcher);

      await waitFor(() => {
        expect(screen.getByText('AI करियर काउंसलिंग टूल')).toBeInTheDocument();
      });

      // Fill profile in Hindi
      await user.type(screen.getByLabelText(/पूरा नाम/i), 'भाषा परीक्षण छात्र');
      await user.selectOptions(screen.getByLabelText(/वर्तमान कक्षा/i), '12');
      await user.selectOptions(screen.getByLabelText(/शिक्षा बोर्ड/i), 'CBSE');

      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/आगे/i));
      await user.click(screen.getByText(/जमा करें/i));

      // Verify recommendations are provided in Hindi
      await waitFor(() => {
        expect(screen.getByText(/आपकी करियर सिफारिशें/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify career descriptions are in Hindi
      expect(screen.getByText(/विवरण/i)).toBeInTheDocument();
      expect(screen.getByText(/आवश्यकताएं/i)).toBeInTheDocument();
    });
  });

  describe('Recommendation Accuracy and Relevance', () => {
    it('should provide exactly 3 career recommendations as specified', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit any valid profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Count Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Count career recommendation cards
      const careerCards = screen.getAllByText(/% Match/i);
      expect(careerCards).toHaveLength(3);

      // Verify each has required components
      const viewDetailsButtons = screen.getAllByText(/View Details/i);
      expect(viewDetailsButtons).toHaveLength(3);
    });

    it('should provide high-quality match scores based on profile alignment', async () => {
      const user = userEvent.setup();
      renderApp();

      // Create highly specific profile for software engineering
      await user.type(screen.getByLabelText(/Full Name/i), 'High Match Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));

      // Perfect match for software engineering
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Technology', 'Mathematics', 'Problem Solving']);

      const subjectsSelect = screen.getByLabelText(/Current Subjects/i);
      await user.selectOptions(subjectsSelect, ['Mathematics', 'Computer Science', 'Physics']);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');

      const favoriteSubjects = screen.getByLabelText(/Favorite Subjects/i);
      await user.selectOptions(favoriteSubjects, ['Computer Science', 'Mathematics']);

      await user.click(screen.getByText(/Next/i));

      // Tech-friendly background
      await user.type(screen.getByLabelText(/Location/i), 'Bangalore, Karnataka');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'urban');
      await user.click(screen.getByLabelText(/Yes, I have regular internet access/i));

      const deviceAccess = screen.getByLabelText(/Device Access/i);
      await user.selectOptions(deviceAccess, ['Laptop', 'Smartphone']);

      await user.click(screen.getByText(/Next/i));

      // Career aspirations aligned with tech
      const preferredCareers = screen.getByLabelText(/Preferred Career Fields/i);
      await user.selectOptions(preferredCareers, ['Software Engineering', 'Data Science']);

      await user.selectOptions(screen.getByLabelText(/Salary Expectations/i), 'high');

      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify high match scores for aligned careers
      const matchScores = screen.getAllByText(/\d+% Match/i);
      expect(matchScores).toHaveLength(3);

      // At least one should be a high match (>85%)
      const highMatchExists = matchScores.some(element => {
        const score = parseInt(element.textContent?.match(/(\d+)%/)?.[1] || '0');
        return score >= 85;
      });
      expect(highMatchExists).toBe(true);

      // Software Engineer should be top recommendation
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
    });

    it('should provide comprehensive career information for each recommendation', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit profile
      await user.type(screen.getByLabelText(/Full Name/i), 'Comprehensive Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click on first career for details
      const viewDetailsButtons = screen.getAllByText(/View Details/i);
      await user.click(viewDetailsButtons[0]);

      // Verify comprehensive information is provided
      await waitFor(() => {
        // Career description
        expect(screen.getByText(/Description/i)).toBeInTheDocument();
        
        // Education requirements
        expect(screen.getByText(/Education Path/i)).toBeInTheDocument();
        expect(screen.getByText(/Duration/i)).toBeInTheDocument();
        
        // Salary information
        expect(screen.getByText(/Salary Range/i)).toBeInTheDocument();
        expect(screen.getByText(/Entry Level/i)).toBeInTheDocument();
        
        // Skills required
        expect(screen.getByText(/Skills Required/i)).toBeInTheDocument();
        
        // College recommendations
        expect(screen.getByText(/Recommended Colleges/i)).toBeInTheDocument();
        
        // Scholarship information
        expect(screen.getByText(/Available Scholarships/i)).toBeInTheDocument();
        
        // Pros and cons
        expect(screen.getByText(/Advantages/i)).toBeInTheDocument();
        expect(screen.getByText(/Challenges/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Service Quality and Performance', () => {
    it('should handle AI processing within reasonable time limits', async () => {
      const user = userEvent.setup();
      renderApp();

      // Submit profile and measure processing time
      const startTime = Date.now();

      await user.type(screen.getByLabelText(/Full Name/i), 'Performance Test');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      // Verify loading state is shown
      expect(screen.getByText(/Processing with AI/i)).toBeInTheDocument();

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verify processing completed within reasonable time (15 seconds)
      expect(processingTime).toBeLessThan(15000);
    });

    it('should provide consistent recommendations for similar profiles', async () => {
      const user = userEvent.setup();
      
      const similarProfile = {
        name: 'Consistency Test',
        grade: '12',
        board: 'CBSE',
        interests: ['Science', 'Technology'],
        performance: 'excellent',
      };

      // Submit same profile multiple times
      const recommendations: string[][] = [];

      for (let i = 0; i < 3; i++) {
        renderApp();

        await user.type(screen.getByLabelText(/Full Name/i), `${similarProfile.name} ${i + 1}`);
        await user.selectOptions(screen.getByLabelText(/Current Grade/i), similarProfile.grade);
        await user.selectOptions(screen.getByLabelText(/Education Board/i), similarProfile.board);

        await user.click(screen.getByText(/Next/i));

        const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
        await user.selectOptions(interestsSelect, similarProfile.interests);

        await user.selectOptions(screen.getByLabelText(/Academic Performance/i), similarProfile.performance);

        await user.click(screen.getByText(/Next/i));
        await user.click(screen.getByText(/Next/i));
        await user.click(screen.getByText(/Submit Profile/i));

        await waitFor(() => {
          expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
        }, { timeout: 10000 });

        // Extract career titles
        const careerElements = screen.getAllByText(/Software Engineer|Data Scientist|AI\/ML Engineer/i);
        const careerTitles = careerElements.map(el => el.textContent || '');
        recommendations.push(careerTitles);

        // Clean up for next iteration
        screen.getByText(/Modify Profile/i).click();
        await waitFor(() => {
          expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
        });
      }

      // Verify consistency - at least 2 out of 3 recommendations should be the same
      const firstRecommendation = recommendations[0];
      const consistentRecommendations = recommendations.filter(rec => 
        rec.some(career => firstRecommendation.includes(career))
      );

      expect(consistentRecommendations.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle edge cases and unusual profiles gracefully', async () => {
      const user = userEvent.setup();
      renderApp();

      // Create unusual profile with conflicting interests
      await user.type(screen.getByLabelText(/Full Name/i), 'Edge Case Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '10'); // Younger student
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'IB'); // International board

      await user.click(screen.getByText(/Next/i));

      // Conflicting interests
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Arts', 'Science', 'Sports', 'Business']);

      // Mixed performance
      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'average');

      await user.click(screen.getByText(/Next/i));

      // Unusual background
      await user.type(screen.getByLabelText(/Location/i), 'Remote Island, Andaman');
      await user.selectOptions(screen.getByLabelText(/Area Type/i), 'rural');
      await user.click(screen.getByLabelText(/No, limited or no internet access/i));

      await user.click(screen.getByText(/Next/i));

      // Conflicting aspirations
      await user.selectOptions(screen.getByLabelText(/Salary Expectations/i), 'not-important');
      await user.selectOptions(screen.getByLabelText(/Work-Life Balance Priority/i), 'high');

      await user.click(screen.getByText(/Submit Profile/i));

      // Verify system handles edge case gracefully
      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Should still provide 3 recommendations
      const careerCards = screen.getAllByText(/% Match/i);
      expect(careerCards).toHaveLength(3);

      // Recommendations should be reasonable despite conflicts
      const matchScores = careerCards.map(element => {
        const score = parseInt(element.textContent?.match(/(\d+)%/)?.[1] || '0');
        return score;
      });

      // At least one recommendation should have reasonable match score (>50%)
      expect(matchScores.some(score => score >= 50)).toBe(true);
    });
  });

  describe('Recommendation Diversity and Inclusivity', () => {
    it('should provide diverse career options across different fields', async () => {
      const user = userEvent.setup();
      renderApp();

      // Create profile with broad interests
      await user.type(screen.getByLabelText(/Full Name/i), 'Diversity Test Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '11');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');

      await user.click(screen.getByText(/Next/i));

      // Broad interests
      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, [
        'Science', 'Arts', 'Technology', 'Social Sciences', 'Business'
      ]);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'good');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Extract all career titles
      const careerElements = screen.getAllByText(/Engineer|Scientist|Designer|Teacher|Doctor|Analyst|Manager/i);
      const careerTitles = careerElements.map(el => el.textContent || '');

      // Verify diversity across different sectors
      const sectors = {
        technology: careerTitles.some(title => /Engineer|Developer|Analyst/i.test(title)),
        healthcare: careerTitles.some(title => /Doctor|Nurse|Therapist/i.test(title)),
        education: careerTitles.some(title => /Teacher|Professor|Educator/i.test(title)),
        creative: careerTitles.some(title => /Designer|Artist|Writer/i.test(title)),
        business: careerTitles.some(title => /Manager|Consultant|Entrepreneur/i.test(title)),
      };

      // At least 2 different sectors should be represented
      const representedSectors = Object.values(sectors).filter(Boolean).length;
      expect(representedSectors).toBeGreaterThanOrEqual(2);
    });

    it('should consider gender-inclusive career recommendations', async () => {
      const user = userEvent.setup();
      renderApp();

      // Female student interested in STEM
      await user.type(screen.getByLabelText(/Full Name/i), 'Female STEM Student');
      await user.selectOptions(screen.getByLabelText(/Current Grade/i), '12');
      await user.selectOptions(screen.getByLabelText(/Education Board/i), 'CBSE');
      await user.selectOptions(screen.getByLabelText(/Gender/i), 'female');

      await user.click(screen.getByText(/Next/i));

      const interestsSelect = screen.getByLabelText(/Areas of Interest/i);
      await user.selectOptions(interestsSelect, ['Science', 'Technology', 'Engineering']);

      await user.selectOptions(screen.getByLabelText(/Academic Performance/i), 'excellent');

      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Next/i));
      await user.click(screen.getByText(/Submit Profile/i));

      await waitFor(() => {
        expect(screen.getByText(/Your Career Recommendations/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify STEM careers are recommended regardless of gender
      expect(screen.getByText(/Engineer|Scientist|Developer/i)).toBeInTheDocument();

      // Check for gender-inclusive language in descriptions
      const viewDetailsButtons = screen.getAllByText(/View Details/i);
      await user.click(viewDetailsButtons[0]);

      await waitFor(() => {
        // Should not contain gender-biased language
        const description = screen.getByText(/Description/i).parentElement;
        expect(description?.textContent).not.toMatch(/\b(his|her|he|she)\b/i);
      });
    });
  });
});