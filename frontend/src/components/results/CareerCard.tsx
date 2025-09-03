/**
 * Career Card Component
 * Displays a summary card for each career recommendation
 */

import React from 'react';
import { CareerRecommendation, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './CareerCard.css';

export interface CareerCardProps {
  recommendation: CareerRecommendation;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  language: SupportedLanguage;
}

export const CareerCard: React.FC<CareerCardProps> = ({
  recommendation,
  rank,
  isSelected,
  onClick,
  language
}) => {
  const { t } = useTranslation();

  const formatSalary = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const getDemandLevelColor = (level: string): string => {
    switch (level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div 
      className={`career-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Rank Badge */}
      <div className="rank-badge">
        <span className="rank-number">{rank}</span>
      </div>

      {/* Career Title */}
      <h3 className="career-title">{recommendation.title}</h3>

      {/* Match Score */}
      <div className="match-score-container">
        <div className="match-score-bar">
          <div 
            className="match-score-fill"
            style={{ width: `${recommendation.matchScore}%` }}
          ></div>
        </div>
        <span className="match-score-text">
          {recommendation.matchScore}% {t('results.match') || 'Match'}
        </span>
      </div>

      {/* Key Info */}
      <div className="career-info">
        {/* Salary Range */}
        <div className="info-item">
          <span className="info-label">{t('results.salary') || 'Salary'}</span>
          <span className="info-value">
            {formatSalary(recommendation.prospects.averageSalary.entry)} - {formatSalary(recommendation.prospects.averageSalary.senior)}
          </span>
        </div>

        {/* Demand Level */}
        <div className="info-item">
          <span className="info-label">{t('results.demand') || 'Demand'}</span>
          <span 
            className="info-value demand-indicator"
            style={{ color: getDemandLevelColor(recommendation.prospects.demandLevel) }}
          >
            {t(`results.demand.${recommendation.prospects.demandLevel}`) || recommendation.prospects.demandLevel}
          </span>
        </div>

        {/* Growth Rate */}
        <div className="info-item">
          <span className="info-label">{t('results.growth') || 'Growth'}</span>
          <span className="info-value">{recommendation.prospects.growthRate}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-number">{recommendation.recommendedColleges.length}</span>
          <span className="stat-label">{t('results.colleges') || 'Colleges'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{recommendation.scholarships.length}</span>
          <span className="stat-label">{t('results.scholarships') || 'Scholarships'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{recommendation.requirements.entranceExams.length}</span>
          <span className="stat-label">{t('results.exams') || 'Exams'}</span>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="selection-indicator">
          <span className="selection-text">{t('results.selected') || 'Selected'}</span>
        </div>
      )}
    </div>
  );
};