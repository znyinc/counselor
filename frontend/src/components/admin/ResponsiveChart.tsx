/**
 * Responsive Chart Wrapper Component
 * Handles responsive behavior for Chart.js components
 */

import React, { useEffect, useState } from 'react';

interface ResponsiveChartProps {
  children: React.ReactElement;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

export const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  minHeight = 200,
  maxHeight = 500,
  aspectRatio = 2
}) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.chart-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        const calculatedHeight = Math.min(
          Math.max(rect.width / aspectRatio, minHeight),
          maxHeight
        );
        
        setDimensions({
          width: rect.width,
          height: calculatedHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [aspectRatio, minHeight, maxHeight]);

  return (
    <div 
      className="responsive-chart-wrapper"
      style={{
        width: '100%',
        height: dimensions.height || minHeight,
        position: 'relative'
      }}
    >
      {React.cloneElement(children, {
        ...children.props,
        options: {
          ...children.props.options,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            ...children.props.options?.plugins,
            legend: {
              ...children.props.options?.plugins?.legend,
              labels: {
                ...children.props.options?.plugins?.legend?.labels,
                boxWidth: dimensions.width < 768 ? 12 : 16,
                padding: dimensions.width < 768 ? 10 : 20,
                font: {
                  size: dimensions.width < 768 ? 10 : 12
                }
              }
            }
          },
          scales: {
            ...children.props.options?.scales,
            x: {
              ...children.props.options?.scales?.x,
              ticks: {
                ...children.props.options?.scales?.x?.ticks,
                font: {
                  size: dimensions.width < 768 ? 10 : 12
                },
                maxRotation: dimensions.width < 768 ? 45 : 0
              }
            },
            y: {
              ...children.props.options?.scales?.y,
              ticks: {
                ...children.props.options?.scales?.y?.ticks,
                font: {
                  size: dimensions.width < 768 ? 10 : 12
                }
              }
            }
          }
        }
      })}
    </div>
  );
};

export default ResponsiveChart;