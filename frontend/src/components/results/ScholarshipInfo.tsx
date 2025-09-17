/**
 * Scholarship Info Component
 * Displays available scholarships for a specific career
 */

import React, { useState } from 'react';
import { Scholarship, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './ScholarshipInfo.css';

export interface ScholarshipInfoProps {
  scholarships: Scholarship[];
  careerTitle: string;
  language: SupportedLanguage;
}

export const ScholarshipInfo: React.FC<ScholarshipInfoProps> = ({
  scholarships,
  careerTitle,
  language
}) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'Merit-based' | 'Need-based' | 'Merit-cum-Means'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'deadline'>('amount');

  const formatAmount = (amount: any): string => {
    if (typeof amount === 'object') {
      // Handle complex amount structures
      const values = Object.values(amount).filter(v => typeof v === 'number') as number[];
      if (values.length > 0) {
        const maxAmount = Math.max(...values);
        return formatSingleAmount(maxAmount);
      }
      return 'Variable';
    }
    return formatSingleAmount(Number(amount) || 0);
  };

  const formatSingleAmount = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Merit-based': return '#10b981';
      case 'Need-based': return '#3b82f6';
      case 'Merit-cum-Means': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getEligibilityScore = (scholarship: Scholarship): number => {
    let score = 0;
    const eligibility = scholarship.eligibility;
    
    // More criteria = higher score (more specific)
    if (eligibility.categories?.length) score += eligibility.categories.length;
    if (eligibility.courses?.length) score += eligibility.courses.length;
    if (eligibility.incomeLimit) score += 2;
    if (eligibility.academicCriteria) score += 1;
    if (eligibility.gender) score += 1;
    
    return score;
  };

  const sortedAndFilteredScholarships = scholarships
    .filter(scholarship => filterType === 'all' || scholarship.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          const amountA = typeof a.amount === 'object' 
            ? Math.max(...Object.values(a.amount).filter(v => typeof v === 'number') as number[]) || 0
            : Number(a.amount) || 0;
          const amountB = typeof b.amount === 'object' 
            ? Math.max(...Object.values(b.amount).filter(v => typeof v === 'number') as number[]) || 0
            : Number(b.amount) || 0;
          return amountB - amountA;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'deadline':
          return a.applicationPeriod.localeCompare(b.applicationPeriod);
        default:
          return 0;
      }
    });

  if (scholarships.length === 0) {
    return (
      <div className="scholarship-info empty">
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>{t('results.noScholarships', 'No Scholarship Information')}</h3>
          <p>{t('results.noScholarshipsDescription', 'We couldn\'t find specific scholarship information for this career path.')}</p>
          <div className="general-advice">
            <h4>{t('results.generalAdvice', 'General Scholarship Tips')}</h4>
            <ul>
              <li>{t('results.tip1', 'Check with your state government for local scholarships')}</li>
              <li>{t('results.tip2', 'Look for merit-based scholarships from educational institutions')}</li>
              <li>{t('results.tip3', 'Explore corporate scholarships in your field of interest')}</li>
              <li>{t('results.tip4', 'Consider national scholarships like NSP (National Scholarship Portal)')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scholarship-info">
      <div className="scholarships-header">
        <div className="header-content">
          <h3>{t('results.scholarshipsFor', { 
            defaultValue: `Available Scholarships for ${careerTitle}`,
            interpolation: { career: careerTitle }
          })}</h3>
          <p className="scholarships-description">
            {t('results.scholarshipsDescription')}
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="scholarships-controls">
          <div className="filter-group">
            <label>{t('results.filterByType')}</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">{t('results.allTypes')}</option>
              <option value="Merit-based">{t('results.meritBased')}</option>
              <option value="Need-based">{t('results.needBased')}</option>
              <option value="Merit-cum-Means">{t('results.meritCumMeans')}</option>
            </select>
          </div>

          <div className="sort-group">
            <label>{t('results.sortBy')}</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="amount">{t('results.amount')}</option>
              <option value="name">{t('results.name')}</option>
              <option value="deadline">{t('results.deadline')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scholarships Grid */}
      <div className="scholarships-grid">
        {sortedAndFilteredScholarships.map((scholarship) => (
          <div key={scholarship.id} className="scholarship-card">
            {/* Scholarship Header */}
            <div className="scholarship-header">
              <div className="scholarship-title-section">
                <h4 className="scholarship-name">{scholarship.name}</h4>
                <div className="scholarship-provider">
                  <span className="provider-icon">🏛️</span>
                  {scholarship.provider}
                </div>
              </div>
              
              <div className="scholarship-badges">
                <span 
                  className="type-badge"
                  style={{ backgroundColor: getTypeColor(scholarship.type) }}
                >
                  {t(`results.${scholarship.type.toLowerCase().replace('-', '')}`)}
                </span>
                {scholarship.renewable && (
                  <span className="renewable-badge">
                    {t('results.renewable')}
                  </span>
                )}
              </div>
            </div>

            {/* Scholarship Amount */}
            <div className="scholarship-amount">
              <div className="amount-display">
                <span className="amount-value">{formatAmount(scholarship.amount)}</span>
                <span className="amount-label">{t('results.scholarshipAmount')}</span>
              </div>
            </div>

            {/* Scholarship Description */}
            {scholarship.description && (
              <div className="scholarship-description">
                <p>{scholarship.description}</p>
              </div>
            )}

            {/* Eligibility Criteria */}
            <div className="eligibility-section">
              <h5>{t('results.eligibilityCriteria')}</h5>
              <div className="eligibility-grid">
                {scholarship.eligibility.categories && (
                  <div className="eligibility-item">
                    <span className="eligibility-label">
                      <span className="eligibility-icon">👥</span>
                      {t('results.categories')}
                    </span>
                    <div className="eligibility-tags">
                      {scholarship.eligibility.categories.map((category, index) => (
                        <span key={index} className="eligibility-tag">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scholarship.eligibility.incomeLimit && (
                  <div className="eligibility-item">
                    <span className="eligibility-label">
                      <span className="eligibility-icon">💰</span>
                      {t('results.incomeLimit')}
                    </span>
                    <span className="eligibility-value">
                      {formatSingleAmount(scholarship.eligibility.incomeLimit)} {t('results.perAnnum')}
                    </span>
                  </div>
                )}

                {scholarship.eligibility.academicCriteria && (
                  <div className="eligibility-item">
                    <span className="eligibility-label">
                      <span className="eligibility-icon">📊</span>
                      {t('results.academicCriteria')}
                    </span>
                    <span className="eligibility-value">
                      {scholarship.eligibility.academicCriteria}
                    </span>
                  </div>
                )}

                {scholarship.eligibility.courses && (
                  <div className="eligibility-item">
                    <span className="eligibility-label">
                      <span className="eligibility-icon">📚</span>
                      {t('results.eligibleCourses')}
                    </span>
                    <div className="eligibility-tags">
                      {scholarship.eligibility.courses.slice(0, 3).map((course, index) => (
                        <span key={index} className="eligibility-tag">
                          {course}
                        </span>
                      ))}
                      {scholarship.eligibility.courses.length > 3 && (
                        <span className="eligibility-tag more">
                          +{scholarship.eligibility.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {scholarship.eligibility.gender && (
                  <div className="eligibility-item">
                    <span className="eligibility-label">
                      <span className="eligibility-icon">⚧️</span>
                      {t('results.gender')}
                    </span>
                    <span className="eligibility-value">
                      {scholarship.eligibility.gender}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Application Info */}
            <div className="application-info">
              <div className="application-period">
                <span className="period-label">
                  <span className="period-icon">📅</span>
                  {t('results.applicationPeriod')}
                </span>
                <span className="period-value">{scholarship.applicationPeriod}</span>
              </div>
            </div>

            {/* Scholarship Actions */}
            <div className="scholarship-actions">
              {scholarship.website && (
                <a 
                  href={scholarship.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="scholarship-link"
                >
                  <span className="link-icon">🌐</span>
                  {t('results.applyNow')}
                </a>
              )}
              <button className="scholarship-save">
                <span className="save-icon">💾</span>
                {t('results.saveForLater')}
              </button>
            </div>

            {/* Eligibility Score */}
            <div className="eligibility-score">
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ width: `${Math.min(getEligibilityScore(scholarship) * 10, 100)}%` }}
                ></div>
              </div>
              <span className="score-text">
                {t('results.eligibilityMatch')}: {Math.min(getEligibilityScore(scholarship) * 10, 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Scholarship Tips */}
      <div className="scholarship-tips">
        <h4>{t('results.applicationTips')}</h4>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📝</div>
            <div className="tip-content">
              <h5>{t('results.tip1Title')}</h5>
              <p>{t('results.tip1Content')}</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📋</div>
            <div className="tip-content">
              <h5>{t('results.tip2Title')}</h5>
              <p>{t('results.tip2Content')}</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <div className="tip-content">
              <h5>{t('results.tip3Title')}</h5>
              <p>{t('results.tip3Content')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="scholarships-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-value">{sortedAndFilteredScholarships.length}</span>
            <span className="summary-label">{t('results.totalScholarships')}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {sortedAndFilteredScholarships.filter(s => s.type === 'Merit-based').length}
            </span>
            <span className="summary-label">{t('results.meritBased')}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {sortedAndFilteredScholarships.filter(s => s.renewable).length}
            </span>
            <span className="summary-label">{t('results.renewable')}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-value">
              {formatAmount(Math.max(...sortedAndFilteredScholarships.map(s => 
                typeof s.amount === 'object' 
                  ? Math.max(...Object.values(s.amount).filter(v => typeof v === 'number') as number[]) || 0
                  : Number(s.amount) || 0
              )))}
            </span>
            <span className="summary-label">{t('results.maxAmount')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};