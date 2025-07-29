/**
 * Education Path Chart Component
 * Displays the educational pathway as a visual timeline
 */

import React from 'react';
import { PathData, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './EducationPathChart.css';

export interface EducationPathChartProps {
  data: PathData;
  language: SupportedLanguage;
}

export const EducationPathChart: React.FC<EducationPathChartProps> = ({
  data,
  language
}) => {
  const { t } = useTranslation();

  const getStepIcon = (index: number): string => {
    const icons = ['🎓', '📚', '💼', '🚀', '⭐'];
    return icons[index] || '📈';
  };

  const getStepColor = (index: number): string => {
    const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
  };

  return (
    <div className="education-path-chart">
      {/* Main Path Timeline */}
      <div className="path-timeline">
        <div className="timeline-header">
          <h4>{t('results.educationPath', 'Education Path')}</h4>
          <div className="total-duration">
            <span className="duration-label">{t('results.totalDuration', 'Total Duration')}</span>
            <span className="duration-value">{data.totalDuration}</span>
          </div>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          {data.steps.map((step, index) => (
            <div key={index} className="timeline-step">
              <div 
                className="step-marker"
                style={{ backgroundColor: getStepColor(index) }}
              >
                <span className="step-icon">{getStepIcon(index)}</span>
                <span className="step-number">{index + 1}</span>
              </div>
              
              <div className="step-content">
                <div className="step-header">
                  <h5 className="step-title">{step.title}</h5>
                  <span className="step-duration">{step.duration}</span>
                </div>
                
                <p className="step-description">{step.description}</p>
                
                {step.requirements.length > 0 && (
                  <div className="step-requirements">
                    <span className="requirements-label">
                      {t('results.requirements', 'Requirements')}:
                    </span>
                    <ul className="requirements-list">
                      {step.requirements.map((req, reqIndex) => (
                        <li key={reqIndex}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Paths */}
      {data.alternativePaths && data.alternativePaths.length > 0 && (
        <div className="alternative-paths">
          <h5>{t('results.alternativePaths', 'Alternative Paths')}</h5>
          
          {data.alternativePaths.map((altPath, pathIndex) => (
            <div key={pathIndex} className="alternative-path">
              <div className="alt-path-header">
                <h6 className="alt-path-title">{altPath.title}</h6>
                <span className="alt-path-badge">
                  {t('results.alternative', 'Alternative')}
                </span>
              </div>
              
              <p className="alt-path-description">{altPath.description}</p>
              
              <div className="alt-path-steps">
                {altPath.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="alt-step">
                    <div className="alt-step-number">{stepIndex + 1}</div>
                    <span className="alt-step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Path Comparison */}
      <div className="path-comparison">
        <h5>{t('results.pathComparison', 'Path Comparison')}</h5>
        
        <div className="comparison-grid">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">⏱️</span>
              <span className="comparison-label">{t('results.timeToComplete', 'Time to Complete')}</span>
            </div>
            <div className="comparison-value">{data.totalDuration}</div>
          </div>
          
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">📋</span>
              <span className="comparison-label">{t('results.totalSteps', 'Total Steps')}</span>
            </div>
            <div className="comparison-value">{data.steps.length}</div>
          </div>
          
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">🎯</span>
              <span className="comparison-label">{t('results.complexity', 'Complexity')}</span>
            </div>
            <div className="comparison-value">
              {data.steps.length <= 3 ? t('results.low', 'Low') :
               data.steps.length <= 5 ? t('results.medium', 'Medium') :
               t('results.high', 'High')}
            </div>
          </div>
          
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">💡</span>
              <span className="comparison-label">{t('results.alternatives', 'Alternatives')}</span>
            </div>
            <div className="comparison-value">
              {data.alternativePaths?.length || 0} {t('results.available', 'Available')}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="progress-header">
          <span>{t('results.yourProgress', 'Your Current Progress')}</span>
          <span className="progress-percentage">0%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '0%' }}></div>
        </div>
        <div className="progress-note">
          {t('results.progressNote', 'Start your journey by completing the first step!')}
        </div>
      </div>
    </div>
  );
};