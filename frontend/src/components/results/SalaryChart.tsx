/**
 * Salary Chart Component
 * Displays salary progression chart using Chart.js
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChartData, SupportedLanguage } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import './charts.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface SalaryChartProps {
  data: ChartData;
  language: SupportedLanguage;
  height?: number;
}

export const SalaryChart: React.FC<SalaryChartProps> = ({
  data,
  language,
  height = 300
}) => {
  const { t } = useTranslation();

  const formatSalary = (value: number): string => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
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
          label: (context) => {
            return `${t('results.salary', 'Salary')}: ${formatSalary(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          },
          callback: (value) => {
            return formatSalary(Number(value));
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false
      }
    }
  };

  // Enhance the chart data with gradients and styling
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        '#667eea',
        '#10b981',
        '#f59e0b'
      ],
      borderWidth: 2,
      hoverBackgroundColor: [
        'rgba(102, 126, 234, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      hoverBorderColor: [
        '#4f46e5',
        '#059669',
        '#d97706'
      ],
      hoverBorderWidth: 3
    }))
  };

  return (
    <div className="salary-chart-container">
      <div className="chart-wrapper" style={{ height: `${height}px` }}>
        <Bar data={enhancedData} options={options} />
      </div>
      
      {/* Chart Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#667eea' }}></div>
          <span>{t('results.entryLevel', 'Entry Level')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
          <span>{t('results.midLevel', 'Mid Level')}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>{t('results.seniorLevel', 'Senior Level')}</span>
        </div>
      </div>

      {/* Salary Insights */}
      <div className="salary-insights">
        <div className="insight-item">
          <span className="insight-label">{t('results.startingSalary', 'Starting Salary')}</span>
          <span className="insight-value">{formatSalary(data.datasets[0]?.data[0] || 0)}</span>
        </div>
        <div className="insight-item">
          <span className="insight-label">{t('results.peakSalary', 'Peak Salary')}</span>
          <span className="insight-value">{formatSalary(Math.max(...(data.datasets[0]?.data || [0])))}</span>
        </div>
        <div className="insight-item">
          <span className="insight-label">{t('results.growthPotential', 'Growth Potential')}</span>
          <span className="insight-value">
            {data.datasets[0]?.data.length > 1 
              ? `${Math.round(((data.datasets[0].data[data.datasets[0].data.length - 1] / data.datasets[0].data[0]) - 1) * 100)}%`
              : 'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
};