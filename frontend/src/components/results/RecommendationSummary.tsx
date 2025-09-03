/**
 * Recommendation Summary Component
 * Displays an overview of all career recommendations
 */

import React from 'react';
import { CareerRecommendation, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './RecommendationSummary.css';

export interface RecommendationSummaryProps {
  recommendations: CareerRecommendation[];
  language: SupportedLanguage;
}

export const RecommendationSummary: React.FC<RecommendationSummaryProps> = ({
  recommendations,
  language
}) => {
  const { t } = useTranslation();

  const calculateAverageMatchScore = (): number => {
    const total = recommendations.reduce((sum, rec) => sum + rec.matchScore, 0);
    return Math.round(total / recommendations.length);
  };

  const getTopDemandLevel = (): string => {
    const demandCounts = recommendations.reduce((acc, rec) => {
      acc[rec.prospects.demandLevel] = (acc[rec.prospects.demandLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(demandCounts).reduce((a, b) => 
      demandCounts[a[0]] > demandCounts[b[0]] ? a : b
    )[0];
  };

  const getAverageSalaryRange = (): { min: number; max: number } => {
    const minSalary = Math.min(...recommendations.map(rec => rec.prospects.averageSalary.entry));
    const maxSalary = Math.max(...recommendations.map(rec => rec.prospects.averageSalary.senior));
    return { min: minSalary, max: maxSalary };
  };

  const formatSalary = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const averageMatchScore = calculateAverageMatchScore();
  const topDemandLevel = getTopDemandLevel();
  const salaryRange = getAverageSalaryRange();

  return (
    <div className="recommendation-summary">
      <div className="summary-header">
        <h2>{t('results.summaryTitle') || 'Your Career Recommendations Summary'}</h2>
        <p className="summary-description">
          {t('results.summaryDescription', { count: recommendations.length } as any) || `Based on your profile, we've identified ${recommendations.length} career paths that align with your interests and goals.`}
        </p>
      </div>

      <div className="summary-stats">
        {/* Overall Match Score */}
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{averageMatchScore}%</div>
            <div className="stat-label">{t('results.averageMatch') || 'Average Match'}</div>
            <div className="stat-description">
              {averageMatchScore >= 80 
                ? t('results.excellentMatch') || 'Excellent alignment with your profile'
                : averageMatchScore >= 70 
                ? t('results.goodMatch') || 'Good alignment with your profile'
                : t('results.fairMatch') || 'Fair alignment with your profile'
              }
            </div>
          </div>
        </div>

        {/* Salary Range */}
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">
              {formatSalary(salaryRange.min)} - {formatSalary(salaryRange.max)}
            </div>
            <div className="stat-label">{t('results.salaryRange') || 'Salary Range'}</div>
            <div className="stat-description">
              {t('results.salaryDescription') || 'Expected earning potential across all recommendations'}
            </div>
          </div>
        </div>

        {/* Market Demand */}
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value demand-level" data-level={topDemandLevel}>
              {t(`results.demand.${topDemandLevel}`) || topDemandLevel}
            </div>
            <div className="stat-label">{t('results.marketDemand') || 'Market Demand'}</div>
            <div className="stat-description">
              {t('results.demandDescription') || 'Overall job market demand for your recommended careers'}
            </div>
          </div>
        </div>

        {/* Total Opportunities */}
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <div className="stat-value">
              {recommendations.reduce((total, rec) => total + rec.recommendedColleges.length, 0)}
            </div>
            <div className="stat-label">{t('results.totalColleges') || 'Total Colleges'}</div>
            <div className="stat-description">
              {t('results.collegesDescription') || 'Educational institutions available for your career paths'}
            </div>
          </div>
        </div>
      </div>

      {/* Career Categories */}
      <div className="career-categories">
        <h3>{t('results.careerCategories') || 'Career Categories'}</h3>
        <div className="categories-grid">
          {recommendations.map((recommendation, index) => (
            <div key={recommendation.id} className="category-card">
              <div className="category-rank">#{index + 1}</div>
              <div className="category-content">
                <h4 className="category-title">{recommendation.title}</h4>
                <div className="category-match">
                  <div className="match-bar">
                    <div 
                      className="match-fill"
                      style={{ width: `${recommendation.matchScore}%` }}
                    ></div>
                  </div>
                  <span className="match-text">{recommendation.matchScore}%</span>
                </div>
                <div className="category-highlights">
                  <span className="highlight-item">
                    💼 {recommendation.prospects.demandLevel} demand
                  </span>
                  <span className="highlight-item">
                    💰 {formatSalary(recommendation.prospects.averageSalary.entry)}+
                  </span>
                  <span className="highlight-item">
                    📚 {recommendation.recommendedColleges.length} colleges
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="key-insights">
        <h3>{t('results.keyInsights') || 'Key Insights'}</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🎓</div>
            <div className="insight-content">
              <h4>{t('results.educationInsight') || 'Education Path'}</h4>
              <p>
                {recommendations.some(rec => rec.requirements.education.some(edu => edu.includes('BTech') || edu.includes('Engineering')))
                  ? t('results.techEducation') || 'Technical education pathway recommended for most careers'
                  : recommendations.some(rec => rec.requirements.education.some(edu => edu.includes('Commerce') || edu.includes('Business')))
                  ? t('results.businessEducation') || 'Business and commerce education pathway recommended'
                  : t('results.diverseEducation') || 'Diverse educational pathways available'
                }
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <h4>{t('results.skillsInsight') || 'Skills Focus'}</h4>
              <p>
                {recommendations.some(rec => rec.requirements.skills.some(skill => skill.toLowerCase().includes('technical') || skill.toLowerCase().includes('programming')))
                  ? t('results.technicalSkills') || 'Strong emphasis on technical and analytical skills'
                  : recommendations.some(rec => rec.requirements.skills.some(skill => skill.toLowerCase().includes('communication') || skill.toLowerCase().includes('leadership')))
                  ? t('results.softSkills') || 'Focus on communication and leadership skills'
                  : t('results.balancedSkills') || 'Balanced mix of technical and soft skills required'
                }
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🚀</div>
            <div className="insight-content">
              <h4>{t('results.growthInsight') || 'Growth Potential'}</h4>
              <p>
                {recommendations.every(rec => parseInt(rec.prospects.growthRate.replace(/[^\d]/g, '')) >= 15)
                  ? t('results.highGrowth') || 'All recommended careers show high growth potential'
                  : recommendations.some(rec => parseInt(rec.prospects.growthRate.replace(/[^\d]/g, '')) >= 15)
                  ? t('results.mixedGrowth') || 'Mix of high and moderate growth potential careers'
                  : t('results.stableGrowth') || 'Stable career growth with consistent opportunities'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h3>{t('results.nextSteps') || 'Next Steps'}</h3>
        <div className="steps-list">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>{t('results.step1Title') || 'Explore Details'}</h4>
              <p>{t('results.step1Description') || 'Click on each career to explore detailed information, requirements, and prospects.'}</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>{t('results.step2Title') || 'Research Colleges'}</h4>
              <p>{t('results.step2Description') || 'Review recommended colleges and their admission requirements for your chosen career path.'}</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>{t('results.step3Title') || 'Plan Your Path'}</h4>
              <p>{t('results.step3Description') || 'Create a timeline for your education and skill development based on the career path you choose.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};