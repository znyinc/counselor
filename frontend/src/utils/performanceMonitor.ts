/**
 * Performance Monitoring Utilities
 * Tracks and reports performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ComponentMetric {
  componentName: string;
  renderTime: number;
  propsSize: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: ComponentMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                     process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true';
    
    if (this.isEnabled) {
      this.initializeObservers();
      this.trackWebVitals();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Track navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', entry.duration, {
              type: entry.entryType,
              name: entry.name
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Track resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Only track slow resources
              this.recordMetric('resource-load', entry.duration, {
                name: entry.name,
                size: (entry as any).transferSize || 0,
                type: this.getResourceType(entry.name)
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Track long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);

      } catch (error) {
        console.warn('Performance observers not supported:', error);
      }
    }
  }

  /**
   * Track Web Vitals metrics
   */
  private trackWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.trackLCP();
    
    // First Input Delay (FID)
    this.trackFID();
    
    // Cumulative Layout Shift (CLS)
    this.trackCLS();
    
    // Time to First Byte (TTFB)
    this.trackTTFB();
  }

  private trackLCP(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime, {
            element: (lastEntry as any).element?.tagName || 'unknown'
          });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('LCP tracking not supported:', error);
      }
    }
  }

  private trackFID(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('FID', (entry as any).processingStart - entry.startTime, {
              eventType: (entry as any).name
            });
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('FID tracking not supported:', error);
      }
    }
  }

  private trackCLS(): void {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.recordMetric('CLS', clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(observer);
      } catch (error) {
        console.warn('CLS tracking not supported:', error);
      }
    }
  }

  private trackTTFB(): void {
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.requestStart;
      this.recordMetric('TTFB', ttfb);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      console.warn(`⚠️ Performance issue detected: ${name} = ${value.toFixed(2)}ms`, metadata);
    }

    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Track React component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, props?: any): void {
    if (!this.isEnabled) return;

    const metric: ComponentMetric = {
      componentName,
      renderTime,
      propsSize: props ? JSON.stringify(props).length : 0,
      timestamp: Date.now()
    };

    this.componentMetrics.push(metric);

    // Warn about slow renders
    if (renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    // Keep only recent metrics
    if (this.componentMetrics.length > 50) {
      this.componentMetrics = this.componentMetrics.slice(-50);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    webVitals: Record<string, number>;
    slowComponents: ComponentMetric[];
    resourceIssues: PerformanceMetric[];
  } {
    const webVitals: Record<string, number> = {};
    const resourceIssues: PerformanceMetric[] = [];

    // Extract Web Vitals
    ['LCP', 'FID', 'CLS', 'TTFB'].forEach(vital => {
      const metric = this.metrics.find(m => m.name === vital);
      if (metric) {
        webVitals[vital] = metric.value;
      }
    });

    // Find resource issues
    this.metrics.forEach(metric => {
      if (metric.name === 'resource-load' && metric.value > 1000) {
        resourceIssues.push(metric);
      }
    });

    // Find slow components
    const slowComponents = this.componentMetrics
      .filter(m => m.renderTime > 16)
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10);

    return {
      webVitals,
      slowComponents,
      resourceIssues
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    componentMetrics: ComponentMetric[];
    summary: ReturnType<typeof this.getPerformanceSummary>;
  } {
    return {
      metrics: [...this.metrics],
      componentMetrics: [...this.componentMetrics],
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.componentMetrics = [];
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'LCP': 2500, // 2.5s
      'FID': 100,  // 100ms
      'CLS': 0.1,  // 0.1
      'TTFB': 600, // 600ms
      'resource-load': 1000, // 1s
      'long-task': 50 // 50ms
    };

    return value > (thresholds[name] || Infinity);
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css|scss|sass)$/)) return 'style';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for tracking component performance
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();

  return {
    trackRender: (props?: any) => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime, props);
    }
  };
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const PerformanceTrackedComponent: React.FC<P> = (props) => {
    const { trackRender } = usePerformanceTracking(displayName);

    React.useEffect(() => {
      trackRender(props);
    });

    return <WrappedComponent {...props} />;
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  return PerformanceTrackedComponent;
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}