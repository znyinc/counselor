/**
 * Chart Utilities
 * Common configurations and helpers for Chart.js components
 */

import { ChartOptions } from 'chart.js';

// Color palette for consistent theming
export const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  orange: '#F97316',
  gray: '#6B7280'
};

export const chartColorPalette = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.accent,
  chartColors.danger,
  chartColors.purple,
  chartColors.cyan,
  chartColors.lime,
  chartColors.orange
];

// Common chart options
export const getBaseChartOptions = (responsive = true): Partial<ChartOptions> => ({
  responsive,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 6,
      displayColors: true,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2
    },
    line: {
      borderWidth: 2,
      tension: 0.4
    },
    bar: {
      borderRadius: 4,
      borderSkipped: false
    }
  }
});

// Bar chart specific options
export const getBarChartOptions = (
  showLegend = false,
  horizontal = false
): Partial<ChartOptions<'bar'>> => ({
  ...getBaseChartOptions(),
  indexAxis: horizontal ? 'y' as const : 'x' as const,
  plugins: {
    ...getBaseChartOptions().plugins,
    legend: {
      ...getBaseChartOptions().plugins?.legend,
      display: showLegend
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        font: {
          size: 11
        }
      }
    }
  }
});

// Line chart specific options
export const getLineChartOptions = (
  showGrid = true,
  fill = false
): Partial<ChartOptions<'line'>> => ({
  ...getBaseChartOptions(),
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  scales: {
    x: {
      grid: {
        display: showGrid,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        display: showGrid,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        precision: 0,
        font: {
          size: 11
        }
      }
    }
  },
  elements: {
    ...getBaseChartOptions().elements,
    line: {
      ...getBaseChartOptions().elements?.line,
      fill
    }
  }
});

// Doughnut/Pie chart specific options
export const getDoughnutChartOptions = (
  cutout = '60%'
): Partial<ChartOptions<'doughnut'>> => ({
  ...getBaseChartOptions(),
  cutout,
  plugins: {
    ...getBaseChartOptions().plugins,
    legend: {
      ...getBaseChartOptions().plugins?.legend,
      position: 'bottom' as const
    }
  }
});

// Utility functions for data formatting
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

export const formatCurrency = (num: number, currency = 'INR'): string => {
  if (currency === 'INR') {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(1)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)} K`;
    }
    return `₹${num}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(num);
};

// Generate gradient colors for charts
export const generateGradient = (
  ctx: CanvasRenderingContext2D,
  color1: string,
  color2: string,
  vertical = true
): CanvasGradient => {
  const gradient = vertical
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : ctx.createLinearGradient(0, 0, 400, 0);
  
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  
  return gradient;
};

// Create dataset with consistent styling
export const createDataset = (
  label: string,
  data: number[],
  type: 'bar' | 'line' | 'doughnut' | 'pie' = 'bar',
  colorIndex = 0
) => {
  const baseColor = chartColorPalette[colorIndex % chartColorPalette.length];
  const backgroundColor = type === 'line' 
    ? `${baseColor}20` 
    : type === 'doughnut' || type === 'pie'
    ? chartColorPalette.slice(0, data.length)
    : baseColor;
  
  return {
    label,
    data,
    backgroundColor,
    borderColor: type === 'doughnut' || type === 'pie' 
      ? '#ffffff' 
      : baseColor,
    borderWidth: type === 'doughnut' || type === 'pie' ? 2 : 1,
    ...(type === 'line' && {
      fill: true,
      tension: 0.4,
      pointBackgroundColor: baseColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    })
  };
};

// Responsive breakpoints
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1200
};

// Get responsive chart height based on screen size
export const getResponsiveHeight = (baseHeight = 300): number => {
  const width = window.innerWidth;
  
  if (width < breakpoints.mobile) {
    return Math.max(baseHeight * 0.7, 200);
  }
  if (width < breakpoints.tablet) {
    return Math.max(baseHeight * 0.8, 250);
  }
  if (width < breakpoints.desktop) {
    return baseHeight;
  }
  
  return Math.min(baseHeight * 1.2, 500);
};

// Animation configurations
export const animationConfig = {
  duration: 1000,
  easing: 'easeInOutQuart' as const,
  delay: (context: any) => context.dataIndex * 50
};

export const staggeredAnimation = {
  ...animationConfig,
  delay: (context: any) => context.dataIndex * 100
};

// Export all utilities
export default {
  chartColors,
  chartColorPalette,
  getBaseChartOptions,
  getBarChartOptions,
  getLineChartOptions,
  getDoughnutChartOptions,
  formatNumber,
  formatPercentage,
  formatCurrency,
  generateGradient,
  createDataset,
  breakpoints,
  getResponsiveHeight,
  animationConfig,
  staggeredAnimation
};