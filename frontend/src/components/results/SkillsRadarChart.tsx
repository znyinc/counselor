/**
 * Skills Radar Chart Component
 * Displays required skills in a radar chart format
 */

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { CareerRecommendation, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './charts.css';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export interface SkillsRadarChartProps {
  recommendation: CareerRecommendation;
  language: SupportedLanguage;
  height?: number;
}

export const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  recommendation,
  language,
  height = 300
}) => {
  const { t } = useTranslation();

  // Generate skill categories and scores based on the recommendation
  const generateSkillData = () => {
    const skillCategories = [
      { 
        label: t('results.technical', 'Technical'), 
        score: Math.min(recommendation.requirements.skills.length * 15, 100),
        description: t('results.technicalDesc', 'Technical expertise required')
      },
      { 
        label: t('results.communication', 'Communication'), 
        score: recommendation.prospects.workLifeBalance === 'excellent' ? 90 : 
               recommendation.prospects.workLifeBalance === 'good' ? 75 : 60,
        description: t('results.communicationDesc', 'Communication and interpersonal skills')
      },
      { 
        label: t('results.analytical', 'Analytical'), 
        score: recommendation.requirements.skills.some(skill => 
          skill.toLowerCase().includes('analysis') || 
          skill.toLowerCase().includes('problem') ||
          skill.toLowerCase().includes('research')
        ) ? 85 : 60,
        description: t('results.analyticalDesc', 'Analytical and problem-solving abilities')
      },
      { 
        label: t('results.creativity', 'Creativity'), 
        score: recommendation.requirements.skills.some(skill => 
          skill.toLowerCase().includes('creative') || 
          skill.toLowerCase().includes('design') ||
          skill.toLowerCase().includes('innovation')
        ) ? 80 : 50,
        description: t('results.creativityDesc', 'Creative thinking and innovation')
      },
      { 
        label: t('results.leadership', 'Leadership'), 
        score: recommendation.prospects.demandLevel === 'high' ? 75 : 
               recommendation.prospects.demandLevel === 'medium' ? 60 : 45,
        description: t('results.leadershipDesc', 'Leadership and management capabilities')
      },
      { 
        label: t('results.adaptability', 'Adaptability'), 
        score: recommendation.prospects.growthRate ? 
               Math.min(parseInt(recommendation.prospects.growthRate.replace(/[^\d]/g, '')) * 3, 90) : 70,
        description: t('results.adaptabilityDesc', 'Ability to adapt to change')
      }
    ];

    return skillCategories;
  };

  const skillData = generateSkillData();

  const data = {
    labels: skillData.map(skill => skill.label),
    datasets: [
      {
        label: t('results.skillLevel', 'Skill Level'),
        data: skillData.map(skill => skill.score),
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: '#667eea',
        borderWidth: 2,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#4f46e5',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3
      }
    ]
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#667eea',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            return skillData[index].label;
          },
          label: (context) => {
            const index = context.dataIndex;
            return [
              `${t('results.importance', 'Importance')}: ${context.parsed.r}%`,
              skillData[index].description
            ];
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          color: '#666',
          font: {
            size: 10
          },
          callback: (value) => `${value}%`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          color: '#333',
          font: {
            size: 11,
            weight: '500'
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="skills-radar-container">
      <div className="chart-wrapper" style={{ height: `${height}px` }}>
        <Radar data={data} options={options} />
      </div>

      {/* Skills Breakdown */}
      <div className="skills-breakdown">
        <h5>{t('results.skillsBreakdown', 'Skills Breakdown')}</h5>
        <div className="skills-list">
          {skillData.map((skill, index) => (
            <div key={index} className="skill-item">
              <div className="skill-header">
                <span className="skill-name">{skill.label}</span>
                <span className="skill-score">{skill.score}%</span>
              </div>
              <div className="skill-bar">
                <div 
                  className="skill-fill"
                  style={{ 
                    width: `${skill.score}%`,
                    backgroundColor: getSkillColor(skill.score)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Skills from Requirements */}
      <div className="key-skills">
        <h5>{t('results.keySkills', 'Key Skills Required')}</h5>
        <div className="skills-tags">
          {recommendation.requirements.skills.slice(0, 6).map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
          {recommendation.requirements.skills.length > 6 && (
            <span className="skill-tag more">
              +{recommendation.requirements.skills.length - 6} {t('results.more', 'more')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get color based on skill score
const getSkillColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // Green for high importance
  if (score >= 60) return '#f59e0b'; // Yellow for medium importance
  return '#ef4444'; // Red for lower importance
};