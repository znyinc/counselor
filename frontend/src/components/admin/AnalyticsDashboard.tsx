/**
 * Analytics Dashboard Component
 * Displays comprehensive analytics for educational administrators
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { useTranslation } from '../../hooks/useTranslation';
import './AnalyticsDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardMetrics {
  overview: {
    totalStudents: number;
    totalRecommendations: number;
    activeRegions: number;
    popularCareers: string[];
  };
  trends: {
    studentGrowth: Array<{ period: string; count: number }>;
    careerTrends: Array<{ career: string; count: number; growth: number }>;
    regionalDistribution: Array<{ region: string; count: number; percentage: number }>;
  };
  demographics: {
    byBoard: Array<{ board: string; count: number; percentage: number }>;
    byGrade: Array<{ grade: string; count: number; percentage: number }>;
    byRegion: Array<{ region: string; count: number; percentage: number }>;
  };
  performance: {
    averageMatchScore: number;
    recommendationAccuracy: number;
    processingTime: number;
    userSatisfaction: number;
  };
}

interface TrendAnalysis {
  type: string;
  timeRange: string;
  data: Array<{
    period: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  insights: string[];
  predictions: Array<{
    period: string;
    predicted: number;
    confidence: number;
  }>;
}

interface RealtimeMetrics {
  activeUsers: number;
  currentLoad: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
  };
  recentActivity: Array<{
    action: string;
    timestamp: string;
    user: string;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendAnalysis | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard metrics
  const fetchDashboardData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
        ...(selectedRegion && { region: selectedRegion }),
        ...(selectedBoard && { board: selectedBoard })
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [selectedTimeRange, selectedRegion, selectedBoard]);

  // Fetch trend analysis
  const fetchTrendData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: 'student',
        timeRange: selectedTimeRange,
        groupBy: 'week'
      });

      const response = await fetch(`/api/analytics/trends?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trend data');
      
      const result = await response.json();
      setTrendData(result.data);
    } catch (err) {
      console.error('Failed to fetch trend data:', err);
    }
  }, [selectedTimeRange]);

  // Fetch realtime metrics
  const fetchRealtimeData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      
      const result = await response.json();
      setRealtimeData(result.data);
    } catch (err) {
      console.error('Failed to fetch realtime data:', err);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchTrendData(),
        fetchRealtimeData()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData, fetchTrendData, fetchRealtimeData]);

  // Export analytics report
  const exportReport = async (format: 'csv' | 'pdf' | 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        reportType: 'dashboard',
        timeRange: selectedTimeRange
      });

      const response = await fetch(`/api/analytics/export?${params}`);
      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchRealtimeData();
      }, 30000); // Refresh realtime data every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeRange, selectedRegion, selectedBoard, autoRefresh, loadData, fetchRealtimeData]);

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner" data-testid="loading-spinner"></div>
        <p>{t('analytics.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">
          <h3>{t('analytics.error')}</h3>
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            {t('analytics.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <header className="dashboard-header">
        <h1>{t('analytics.title')}</h1>
        <div className="dashboard-controls">
          <div className="filter-controls">
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7d">{t('analytics.timeRange.7d')}</option>
              <option value="30d">{t('analytics.timeRange.30d')}</option>
              <option value="90d">{t('analytics.timeRange.90d')}</option>
              <option value="1y">{t('analytics.timeRange.1y')}</option>
            </select>

            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="region-select"
            >
              <option value="">{t('analytics.allRegions')}</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
            </select>

            <select 
              value={selectedBoard} 
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="board-select"
            >
              <option value="">{t('analytics.allBoards')}</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State Board">State Board</option>
              <option value="IB">IB</option>
            </select>
          </div>

          <div className="action-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              {t('analytics.autoRefresh')}
            </label>

            <div className="export-controls">
              <button onClick={() => exportReport('csv')} className="export-btn">
                {t('analytics.exportCSV')}
              </button>
              <button onClick={() => exportReport('pdf')} className="export-btn">
                {t('analytics.exportPDF')}
              </button>
            </div>

            <button onClick={loadData} className="refresh-btn">
              {t('analytics.refresh')}
            </button>
          </div>
        </div>
      </header>

      {/* Overview Cards */}
      {dashboardData && (
        <section className="overview-section">
          <div className="overview-cards">
            <div className="overview-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>{dashboardData.overview.totalStudents.toLocaleString()}</h3>
                <p>{t('analytics.totalStudents')}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">💼</div>
              <div className="card-content">
                <h3>{dashboardData.overview.totalRecommendations.toLocaleString()}</h3>
                <p>{t('analytics.totalRecommendations')}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">🗺️</div>
              <div className="card-content">
                <h3>{dashboardData.overview.activeRegions}</h3>
                <p>{t('analytics.activeRegions')}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <h3>{dashboardData.performance.averageMatchScore}%</h3>
                <p>{t('analytics.averageMatchScore')}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Realtime Metrics */}
      {realtimeData && (
        <section className="realtime-section">
          <h2>{t('analytics.realtimeMetrics')}</h2>
          <div className="realtime-grid">
            <div className="realtime-card">
              <h4>{t('analytics.activeUsers')}</h4>
              <div className="metric-value">{realtimeData.activeUsers}</div>
            </div>

            <div className="realtime-card">
              <h4>{t('analytics.responseTime')}</h4>
              <div className="metric-value">{Math.round(realtimeData.responseTime)}ms</div>
            </div>

            <div className="realtime-card">
              <h4>{t('analytics.throughput')}</h4>
              <div className="metric-value">{realtimeData.throughput}/min</div>
            </div>

            <div className="realtime-card">
              <h4>{t('analytics.errorRate')}</h4>
              <div className="metric-value">{realtimeData.errorRate.toFixed(2)}%</div>
            </div>
          </div>

          <div className="system-health">
            <h4>{t('analytics.systemHealth')}</h4>
            <div className="health-bars">
              <div className="health-bar">
                <label>CPU</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${realtimeData.systemHealth.cpu}%` }}
                  ></div>
                </div>
                <span>{Math.round(realtimeData.systemHealth.cpu)}%</span>
              </div>

              <div className="health-bar">
                <label>Memory</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${realtimeData.systemHealth.memory}%` }}
                  ></div>
                </div>
                <span>{Math.round(realtimeData.systemHealth.memory)}%</span>
              </div>

              <div className="health-bar">
                <label>Disk</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${realtimeData.systemHealth.disk}%` }}
                  ></div>
                </div>
                <span>{Math.round(realtimeData.systemHealth.disk)}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Charts and Trends */}
      {dashboardData && (
        <section className="charts-section">
          <div className="charts-grid">
            {/* Popular Careers Bar Chart */}
            <div className="chart-card">
              <h3>{t('analytics.popularCareers')}</h3>
              <div className="chart-container">
                <Bar
                  data={{
                    labels: dashboardData.trends.careerTrends.slice(0, 8).map(career => career.career),
                    datasets: [{
                      label: 'Students',
                      data: dashboardData.trends.careerTrends.slice(0, 8).map(career => career.count),
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                      ],
                      borderColor: [
                        '#1D4ED8', '#059669', '#D97706', '#DC2626',
                        '#7C3AED', '#0891B2', '#65A30D', '#EA580C'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          afterLabel: (context) => {
                            const career = dashboardData.trends.careerTrends[context.dataIndex];
                            return `Growth: ${career.growth > 0 ? '+' : ''}${career.growth.toFixed(1)}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>

            {/* Regional Distribution Doughnut Chart */}
            <div className="chart-card">
              <h3>{t('analytics.regionalDistribution')}</h3>
              <div className="chart-container">
                <Doughnut
                  data={{
                    labels: dashboardData.trends.regionalDistribution.slice(0, 6).map(region => region.region),
                    datasets: [{
                      data: dashboardData.trends.regionalDistribution.slice(0, 6).map(region => region.count),
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                      ],
                      borderColor: '#ffffff',
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 20,
                          usePointStyle: true
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const region = dashboardData.trends.regionalDistribution[context.dataIndex];
                            return `${region.region}: ${region.count} (${region.percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>

            {/* Board Distribution Pie Chart */}
            <div className="chart-card">
              <h3>{t('analytics.boardDistribution')}</h3>
              <div className="chart-container">
                <Pie
                  data={{
                    labels: dashboardData.demographics.byBoard.map(board => board.board),
                    datasets: [{
                      data: dashboardData.demographics.byBoard.map(board => board.count),
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                      ],
                      borderColor: '#ffffff',
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 20,
                          usePointStyle: true
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const board = dashboardData.demographics.byBoard[context.dataIndex];
                            return `${board.board}: ${board.count} students (${board.percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>

            {/* Grade Distribution Bar Chart */}
            <div className="chart-card">
              <h3>{t('analytics.gradeDistribution')}</h3>
              <div className="chart-container">
                <Bar
                  data={{
                    labels: dashboardData.demographics.byGrade.map(grade => `Grade ${grade.grade}`),
                    datasets: [{
                      label: 'Students',
                      data: dashboardData.demographics.byGrade.map(grade => grade.count),
                      backgroundColor: '#8B5CF6',
                      borderColor: '#7C3AED',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const grade = dashboardData.demographics.byGrade[context.dataIndex];
                            return `${grade.count} students (${grade.percentage}%)`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Performance Metrics */}
      {dashboardData && (
        <section className="performance-section">
          <h2>{t('analytics.performanceMetrics')}</h2>
          <div className="performance-grid">
            <div className="performance-card">
              <h4>{t('analytics.recommendationAccuracy')}</h4>
              <div className="performance-value">
                {dashboardData.performance.recommendationAccuracy.toFixed(1)}%
              </div>
              <div className="performance-indicator positive">
                ↗ Good performance
              </div>
            </div>

            <div className="performance-card">
              <h4>{t('analytics.processingTime')}</h4>
              <div className="performance-value">
                {Math.round(dashboardData.performance.processingTime)}ms
              </div>
              <div className="performance-indicator neutral">
                → Average response
              </div>
            </div>

            <div className="performance-card">
              <h4>{t('analytics.userSatisfaction')}</h4>
              <div className="performance-value">
                {dashboardData.performance.userSatisfaction.toFixed(1)}/5.0
              </div>
              <div className="performance-indicator positive">
                ↗ High satisfaction
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trend Analysis */}
      {trendData && (
        <section className="trends-section">
          <h2>{t('analytics.trendAnalysis')}</h2>
          <div className="trend-chart-container">
            <div className="chart-card">
              <h3>Student Growth Trend</h3>
              <div className="chart-container">
                <Line
                  data={{
                    labels: trendData.data.map(point => point.period),
                    datasets: [
                      {
                        label: 'Actual Values',
                        data: trendData.data.map(point => point.value),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: trendData.data.map(point => 
                          point.trend === 'up' ? '#10B981' : 
                          point.trend === 'down' ? '#EF4444' : '#6B7280'
                        ),
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                      },
                      ...(trendData.predictions.length > 0 ? [{
                        label: 'Predictions',
                        data: [
                          ...Array(trendData.data.length - 1).fill(null),
                          trendData.data[trendData.data.length - 1].value,
                          ...trendData.predictions.map(pred => pred.predicted)
                        ],
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                      }] : [])
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      intersect: false,
                      mode: 'index' as const
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          afterLabel: (context) => {
                            if (context.datasetIndex === 0) {
                              const point = trendData.data[context.dataIndex];
                              if (point) {
                                return `Change: ${point.change > 0 ? '+' : ''}${point.change.toFixed(1)}%`;
                              }
                            } else if (context.datasetIndex === 1) {
                              const predIndex = context.dataIndex - trendData.data.length;
                              const prediction = trendData.predictions[predIndex];
                              if (prediction) {
                                return `Confidence: ${Math.round(prediction.confidence * 100)}%`;
                              }
                            }
                            return '';
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                  height={400}
                />
              </div>
            </div>
          </div>

          <div className="trend-insights">
            <h4>{t('analytics.insights')}</h4>
            <ul>
              {trendData.insights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>

          {trendData.predictions.length > 0 && (
            <div className="trend-predictions">
              <h4>{t('analytics.predictions')}</h4>
              <div className="predictions-list">
                {trendData.predictions.map((prediction, index) => (
                  <div key={index} className="prediction-item">
                    <span className="prediction-period">{prediction.period}</span>
                    <span className="prediction-value">{prediction.predicted}</span>
                    <span className="prediction-confidence">
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Recent Activity */}
      {realtimeData && realtimeData.recentActivity.length > 0 && (
        <section className="activity-section">
          <h2>{t('analytics.recentActivity')}</h2>
          <div className="activity-list">
            {realtimeData.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-time">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
                <div className="activity-action">{activity.action}</div>
                <div className="activity-user">{activity.user}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AnalyticsDashboard;