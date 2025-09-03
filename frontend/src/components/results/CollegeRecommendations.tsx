/**
 * College Recommendations Component
 * Displays recommended colleges for a specific career
 */

import React, { useState } from 'react';
import { College, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './CollegeRecommendations.css';

export interface CollegeRecommendationsProps {
  colleges: College[];
  careerTitle: string;
  language: SupportedLanguage;
}

export const CollegeRecommendations: React.FC<CollegeRecommendationsProps> = ({
  colleges,
  careerTitle,
  language
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'ranking' | 'fees' | 'name'>('ranking');
  const [filterType, setFilterType] = useState<'all' | 'government' | 'private' | 'deemed'>('all');

  const formatFees = (fees: number): string => {
    if (fees >= 100000) return `₹${(fees / 100000).toFixed(1)}L`;
    if (fees >= 1000) return `₹${(fees / 1000).toFixed(0)}K`;
    return `₹${fees}`;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'government': return '#10b981';
      case 'private': return '#3b82f6';
      case 'deemed': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRankingBadge = (ranking: number): string => {
    if (ranking <= 10) return 'top-10';
    if (ranking <= 50) return 'top-50';
    if (ranking <= 100) return 'top-100';
    return 'other';
  };

  const sortedAndFilteredColleges = colleges
    .filter(college => filterType === 'all' || college.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return (a.rankings?.nirf || 999) - (b.rankings?.nirf || 999);
        case 'fees':
          return a.fees.annual - b.fees.annual;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (colleges.length === 0) {
    return (
      <div className="college-recommendations empty">
        <div className="empty-state">
          <div className="empty-icon">🏫</div>
          <h3>{t('results.noColleges') || 'No College Recommendations'}</h3>
          <p>{t('results.noCollegesDescription') || 'We couldn\'t find specific college recommendations for this career path.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="college-recommendations">
      <div className="colleges-header">
        <div className="header-content">
          <h3>{t('results.collegesFor', { career: careerTitle } as any) || `Recommended Colleges for ${careerTitle}`}</h3>
          <p className="colleges-description">
            {t('results.collegesDescription') || 'These colleges offer relevant programs and have good placement records for your chosen career path.'}
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="colleges-controls">
          <div className="filter-group">
            <label>{t('results.filterByType') || 'Filter by Type'}</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">{t('results.allTypes') || 'All Types'}</option>
              <option value="government">{t('results.government') || 'Government'}</option>
              <option value="private">{t('results.private') || 'Private'}</option>
              <option value="deemed">{t('results.deemed') || 'Deemed'}</option>
            </select>
          </div>

          <div className="sort-group">
            <label>{t('results.sortBy') || 'Sort by'}</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="ranking">{t('results.ranking') || 'Ranking'}</option>
              <option value="fees">{t('results.fees') || 'Fees'}</option>
              <option value="name">{t('results.name') || 'Name'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Colleges Grid */}
      <div className="colleges-grid">
        {sortedAndFilteredColleges.map((college) => (
          <div key={college.id} className="college-card">
            {/* College Header */}
            <div className="college-header">
              <div className="college-title-section">
                <h4 className="college-name">{college.name}</h4>
                <div className="college-location">
                  <span className="location-icon">📍</span>
                  {college.location}
                </div>
              </div>
              
              <div className="college-badges">
                <span 
                  className="type-badge"
                  style={{ backgroundColor: getTypeColor(college.type) }}
                >
                  {t(`results.${college.type}`) || college.type}
                </span>
                {college.rankings?.nirf && (
                  <span className={`ranking-badge ${getRankingBadge(college.rankings.nirf)}`}>
                    NIRF #{college.rankings.nirf}
                  </span>
                )}
              </div>
            </div>

            {/* College Info */}
            <div className="college-info">
              {/* Fees */}
              <div className="info-row">
                <span className="info-label">
                  <span className="info-icon">💰</span>
                  {t('results.annualFees') || 'Annual Fees'}
                </span>
                <span className="info-value fees-value">
                  {formatFees(college.fees.annual)}
                </span>
              </div>

              {/* Courses */}
              <div className="info-row">
                <span className="info-label">
                  <span className="info-icon">📚</span>
                  {t('results.relevantCourses') || 'Relevant Courses'}
                </span>
                <div className="courses-list">
                  {college.courses.slice(0, 2).map((course, index) => (
                    <span key={index} className="course-tag">
                      {course}
                    </span>
                  ))}
                  {college.courses.length > 2 && (
                    <span className="course-tag more">
                      +{college.courses.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Entrance Exams */}
              <div className="info-row">
                <span className="info-label">
                  <span className="info-icon">📝</span>
                  {t('results.entranceExams') || 'Entrance Exams'}
                </span>
                <div className="exams-list">
                  {college.entranceExams.map((exam, index) => (
                    <span key={index} className="exam-tag">
                      {exam}
                    </span>
                  ))}
                </div>
              </div>

              {/* Established Year */}
              {college.established && (
                <div className="info-row">
                  <span className="info-label">
                    <span className="info-icon">🏛️</span>
                    {t('results.established') || 'Established'}
                  </span>
                  <span className="info-value">{college.established}</span>
                </div>
              )}
            </div>

            {/* College Actions */}
            <div className="college-actions">
              {college.website && (
                <a 
                  href={college.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="college-link"
                >
                  <span className="link-icon">🌐</span>
                  {t('results.visitWebsite') || 'Visit Website'}
                </a>
              )}
              <button className="college-bookmark">
                <span className="bookmark-icon">🔖</span>
                {t('results.bookmark') || 'Bookmark'}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="college-stats">
              <div className="stat-item">
                <span className="stat-value">{college.courses.length}</span>
                <span className="stat-label">{t('results.courses') || 'Courses'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{college.entranceExams.length}</span>
                <span className="stat-label">{t('results.exams') || 'Exams'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {college.rankings?.nirf ? `#${college.rankings.nirf}` : 'N/A'}
                </span>
                <span className="stat-label">{t('results.nirfRank') || 'NIRF Rank'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="colleges-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-value">{sortedAndFilteredColleges.length}</span>
            <span className="summary-label">{t('results.totalColleges') || 'Total Colleges'}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {formatFees(Math.min(...sortedAndFilteredColleges.map(c => c.fees.annual)))} - {formatFees(Math.max(...sortedAndFilteredColleges.map(c => c.fees.annual)))}
            </span>
            <span className="summary-label">{t('results.feesRange') || 'Fees Range'}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {sortedAndFilteredColleges.filter(c => c.type === 'government').length}
            </span>
            <span className="summary-label">{t('results.governmentColleges') || 'Government'}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {sortedAndFilteredColleges.filter(c => c.rankings?.nirf && c.rankings.nirf <= 100).length}
            </span>
            <span className="summary-label">{t('results.top100') || 'Top 100 NIRF'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};