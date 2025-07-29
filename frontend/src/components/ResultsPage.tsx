/**
 * Results Page Component
 * Displays career recommendations with visual data and charts
 */

import React, { useState, useEffect } from 'react';
import { CareerRecommendation, SupportedLanguage } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigationState } from '../hooks/useNavigationState';
import { useParams } from 'react-router-dom';
import { CareerCard } from './results/CareerCard';
import { SalaryChart } from './results/SalaryChart';
import { EducationPathChart } from './results/EducationPathChart';
import { SkillsRadarChart } from './results/SkillsRadarChart';
import { RecommendationSummary } from './results/RecommendationSummary';
import { CollegeRecommendations } from './results/CollegeRecommendations';
import { ScholarshipInfo } from './results/ScholarshipInfo';
import { LanguageSwitcher } from './LanguageSwitcher';
import './ResultsPage.css';

export interface ResultsPageProps {
  recommendations: CareerRecommendation[];
  studentName: string;
  language: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
  onBackToForm: () => void;
  onDownloadReport?: () => void;
  onShareResults?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  recommendations: propRecommendations,
  studentName: propStudentName,
  language,
  onLanguageChange,
  onBackToForm,
  onDownloadReport,
  onShareResults
}) => {
  const { t } = useTranslation();
  const { profileId } = useParams<{ profileId?: string }>();
  const { getProfileData, getResultsData, navigateBack, saveResultsData } = useNavigationState();
  
  // Use navigation state data if available, otherwise use props
  const savedProfileData = getProfileData();
  const savedResultsData = getResultsData();
  
  const recommendations = propRecommendations || savedResultsData?.recommendations || [];
  const studentName = propStudentName || savedProfileData?.personalInfo?.name || 'Student';
  const [selectedRecommendation, setSelectedRecommendation] = useState<CareerRecommendation | null>(
    recommendations.length > 0 ? recommendations[0] : null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'colleges' | 'scholarships'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for charts to render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Update selected recommendation when recommendations change
    if (recommendations.length > 0 && !selectedRecommendation) {
      setSelectedRecommendation(recommendations[0]);
    }
  }, [recommendations, selectedRecommendation]);

  const handleRecommendationSelect = (recommendation: CareerRecommendation) => {
    setSelectedRecommendation(recommendation);
    setActiveTab('overview');
  };

  const handleTabChange = (tab: 'overview' | 'details' | 'colleges' | 'scholarships') => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="results-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>{t('results.loading', 'Generating your career recommendations...')}</h2>
          <p>{t('results.loadingDescription', 'Please wait while we prepare your personalized career insights.')}</p>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="results-page error">
        <div className="error-container">
          <h2>{t('results.noRecommendations', 'No Recommendations Available')}</h2>
          <p>{t('results.noRecommendationsDescription', 'We were unable to generate career recommendations. Please try again.')}</p>
          <button onClick={() => onBackToForm ? onBackToForm() : navigateBack()} className="btn btn-primary">
            {t('results.backToForm', 'Back to Form')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      {/* Header Section */}
      <header className="results-header">
        <div className="header-content">
          <div className="header-left">
            <h1>{t('results.title', 'Your Career Recommendations')}</h1>
            <p className="student-greeting">
              {t('results.greeting', 'Hello {{name}}, here are your personalized career recommendations based on your profile.', { name: studentName })}
            </p>
          </div>
          <div className="header-right">
            <LanguageSwitcher 
              currentLanguage={language} 
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </header>

      {/* Summary Section */}
      <section className="results-summary">
        <RecommendationSummary 
          recommendations={recommendations}
          language={language}
        />
      </section>

      {/* Main Content */}
      <div className="results-content">
        {/* Sidebar - Career Cards */}
        <aside className="results-sidebar">
          <h3>{t('results.yourRecommendations', 'Your Recommendations')}</h3>
          <div className="career-cards-list">
            {recommendations.map((recommendation, index) => (
              <CareerCard
                key={recommendation.id}
                recommendation={recommendation}
                rank={index + 1}
                isSelected={selectedRecommendation?.id === recommendation.id}
                onClick={() => handleRecommendationSelect(recommendation)}
                language={language}
              />
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="sidebar-actions">
            <button onClick={() => onBackToForm ? onBackToForm() : navigateBack()} className="btn btn-secondary">
              {t('results.backToForm', 'Back to Form')}
            </button>
            {onDownloadReport && (
              <button onClick={onDownloadReport} className="btn btn-outline">
                {t('results.downloadReport', 'Download Report')}
              </button>
            )}
            {onShareResults && (
              <button onClick={onShareResults} className="btn btn-outline">
                {t('results.shareResults', 'Share Results')}
              </button>
            )}
          </div>
        </aside>

        {/* Main Panel - Detailed View */}
        <main className="results-main">
          {selectedRecommendation && (
            <>
              {/* Tab Navigation */}
              <nav className="results-tabs">
                <button 
                  className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => handleTabChange('overview')}
                >
                  {t('results.tabs.overview', 'Overview')}
                </button>
                <button 
                  className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => handleTabChange('details')}
                >
                  {t('results.tabs.details', 'Details')}
                </button>
                <button 
                  className={`tab ${activeTab === 'colleges' ? 'active' : ''}`}
                  onClick={() => handleTabChange('colleges')}
                >
                  {t('results.tabs.colleges', 'Colleges')} ({selectedRecommendation.recommendedColleges.length})
                </button>
                <button 
                  className={`tab ${activeTab === 'scholarships' ? 'active' : ''}`}
                  onClick={() => handleTabChange('scholarships')}
                >
                  {t('results.tabs.scholarships', 'Scholarships')} ({selectedRecommendation.scholarships.length})
                </button>
              </nav>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-content">
                    {/* Career Overview */}
                    <section className="career-overview">
                      <div className="career-header">
                        <h2>{selectedRecommendation.title}</h2>
                        <div className="match-score">
                          <span className="score-label">{t('results.matchScore', 'Match Score')}</span>
                          <span className="score-value">{selectedRecommendation.matchScore}%</span>
                        </div>
                      </div>
                      <p className="career-description">{selectedRecommendation.description}</p>
                      <div className="nep-alignment">
                        <h4>{t('results.nepAlignment', 'NEP 2020 Alignment')}</h4>
                        <p>{selectedRecommendation.nepAlignment}</p>
                      </div>
                    </section>

                    {/* Visual Charts */}
                    <section className="visual-charts">
                      <div className="charts-grid">
                        <div className="chart-container">
                          <h4>{t('results.salaryTrends', 'Salary Progression')}</h4>
                          <SalaryChart 
                            data={selectedRecommendation.visualData.salaryTrends}
                            language={language}
                          />
                        </div>
                        <div className="chart-container">
                          <h4>{t('results.skillsRequired', 'Skills Required')}</h4>
                          <SkillsRadarChart 
                            recommendation={selectedRecommendation}
                            language={language}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Education Path */}
                    <section className="education-path">
                      <h4>{t('results.educationPath', 'Education Path')}</h4>
                      <EducationPathChart 
                        data={selectedRecommendation.visualData.educationPath}
                        language={language}
                      />
                    </section>

                    {/* Pros and Cons */}
                    <section className="pros-cons">
                      <div className="pros-cons-grid">
                        <div className="pros">
                          <h4>{t('results.pros', 'Advantages')}</h4>
                          <ul>
                            {selectedRecommendation.pros.map((pro, index) => (
                              <li key={index}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="cons">
                          <h4>{t('results.cons', 'Challenges')}</h4>
                          <ul>
                            {selectedRecommendation.cons.map((con, index) => (
                              <li key={index}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="details-content">
                    {/* Career Details */}
                    <section className="career-details">
                      <div className="details-grid">
                        {/* Requirements */}
                        <div className="requirements-section">
                          <h4>{t('results.requirements', 'Requirements')}</h4>
                          <div className="requirement-category">
                            <h5>{t('results.education', 'Education')}</h5>
                            <ul>
                              {selectedRecommendation.requirements.education.map((edu, index) => (
                                <li key={index}>{edu}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="requirement-category">
                            <h5>{t('results.skills', 'Skills')}</h5>
                            <ul>
                              {selectedRecommendation.requirements.skills.map((skill, index) => (
                                <li key={index}>{skill}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="requirement-category">
                            <h5>{t('results.entranceExams', 'Entrance Exams')}</h5>
                            <ul>
                              {selectedRecommendation.requirements.entranceExams.map((exam, index) => (
                                <li key={index}>{exam}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Prospects */}
                        <div className="prospects-section">
                          <h4>{t('results.prospects', 'Career Prospects')}</h4>
                          <div className="prospect-item">
                            <span className="label">{t('results.growthRate', 'Growth Rate')}</span>
                            <span className="value">{selectedRecommendation.prospects.growthRate}</span>
                          </div>
                          <div className="prospect-item">
                            <span className="label">{t('results.jobMarket', 'Job Market')}</span>
                            <span className="value">{selectedRecommendation.prospects.jobMarket}</span>
                          </div>
                          <div className="prospect-item">
                            <span className="label">{t('results.demandLevel', 'Demand Level')}</span>
                            <span className={`value demand-${selectedRecommendation.prospects.demandLevel}`}>
                              {t(`results.demand.${selectedRecommendation.prospects.demandLevel}`, selectedRecommendation.prospects.demandLevel)}
                            </span>
                          </div>
                          <div className="prospect-item">
                            <span className="label">{t('results.workLifeBalance', 'Work-Life Balance')}</span>
                            <span className={`value balance-${selectedRecommendation.prospects.workLifeBalance}`}>
                              {t(`results.balance.${selectedRecommendation.prospects.workLifeBalance}`, selectedRecommendation.prospects.workLifeBalance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Day in Life */}
                      {selectedRecommendation.dayInLife && (
                        <div className="day-in-life">
                          <h4>{t('results.dayInLife', 'A Day in the Life')}</h4>
                          <p>{selectedRecommendation.dayInLife}</p>
                        </div>
                      )}

                      {/* Career Path */}
                      {selectedRecommendation.careerPath && (
                        <div className="career-progression">
                          <h4>{t('results.careerPath', 'Career Progression')}</h4>
                          <div className="career-steps">
                            {selectedRecommendation.careerPath.map((step, index) => (
                              <div key={index} className="career-step">
                                <div className="step-number">{index + 1}</div>
                                <div className="step-title">{step}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Industry Insights */}
                      {selectedRecommendation.industryInsights && (
                        <div className="industry-insights">
                          <h4>{t('results.industryInsights', 'Industry Insights')}</h4>
                          <div className="insights-grid">
                            <div className="insight-category">
                              <h5>{t('results.topCompanies', 'Top Companies')}</h5>
                              <ul>
                                {selectedRecommendation.industryInsights.topCompanies.map((company, index) => (
                                  <li key={index}>{company}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="insight-category">
                              <h5>{t('results.emergingTrends', 'Emerging Trends')}</h5>
                              <ul>
                                {selectedRecommendation.industryInsights.emergingTrends.map((trend, index) => (
                                  <li key={index}>{trend}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="insight-category">
                              <h5>{t('results.opportunities', 'Opportunities')}</h5>
                              <ul>
                                {selectedRecommendation.industryInsights.opportunities.map((opportunity, index) => (
                                  <li key={index}>{opportunity}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="insight-category">
                              <h5>{t('results.challenges', 'Challenges')}</h5>
                              <ul>
                                {selectedRecommendation.industryInsights.challenges.map((challenge, index) => (
                                  <li key={index}>{challenge}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'colleges' && (
                  <div className="colleges-content">
                    <CollegeRecommendations 
                      colleges={selectedRecommendation.recommendedColleges}
                      careerTitle={selectedRecommendation.title}
                      language={language}
                    />
                  </div>
                )}

                {activeTab === 'scholarships' && (
                  <div className="scholarships-content">
                    <ScholarshipInfo 
                      scholarships={selectedRecommendation.scholarships}
                      careerTitle={selectedRecommendation.title}
                      language={language}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};