/**
 * BCT Enterprise - Lightweight Performance & Stability Monitoring Service
 * Tracks page load times, component rendering metrics, store sync latency,
 * and detects slow operations (>50ms) to prevent UI thread lockups.
 */

export interface PerformanceMetric {
  name: string;
  category: 'navigation' | 'auth' | 'render' | 'store_sync' | 'calculation';
  durationMs: number;
  timestamp: number;
  details?: Record<string, any>;
}

export interface PerformanceReport {
  summary: {
    totalEvents: number;
    averageDurationMs: number;
    slowOperationsCount: number; // operations > 50ms
    authAverageMs: number;
    navigationAverageMs: number;
  };
  renderCounts: Record<string, number>;
  slowOperations: PerformanceMetric[];
  recentMetrics: PerformanceMetric[];
}

const MAX_STORED_METRICS = 150;
const SLOW_OPERATION_THRESHOLD_MS = 50;

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private marks = new Map<string, number>();
  private renderCounts = new Map<string, number>();

  /**
   * Start a timing mark
   */
  public startMark(markName: string): void {
    if (typeof performance !== 'undefined') {
      this.marks.set(markName, performance.now());
    } else {
      this.marks.set(markName, Date.now());
    }
  }

  /**
   * End a timing mark and record duration
   */
  public endMark(
    markName: string,
    category: PerformanceMetric['category'] = 'calculation',
    details?: Record<string, any>
  ): number {
    const startTime = this.marks.get(markName);
    if (startTime === undefined) return 0;

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = Math.round((endTime - startTime) * 100) / 100;
    this.marks.delete(markName);

    this.recordMetric({
      name: markName,
      category,
      durationMs,
      timestamp: Date.now(),
      details
    });

    return durationMs;
  }

  /**
   * Directly record a known duration
   */
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > MAX_STORED_METRICS) {
      this.metrics.shift();
    }

    if (metric.durationMs >= SLOW_OPERATION_THRESHOLD_MS) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          `[BCT Performance Warning] Slow operation detected: ${metric.name} (${metric.category}) took ${metric.durationMs}ms (> ${SLOW_OPERATION_THRESHOLD_MS}ms threshold)`
        );
      }
    }
  }

  /**
   * Track component render count and duration
   */
  public recordRender(componentName: string, durationMs: number = 0): void {
    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);

    if (durationMs > 0) {
      this.recordMetric({
        name: `Render: ${componentName}`,
        category: 'render',
        durationMs,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track authentication lifecycle timing
   */
  public recordAuthTiming(durationMs: number, username: string, success: boolean): void {
    this.recordMetric({
      name: `Auth: ${username}`,
      category: 'auth',
      durationMs,
      timestamp: Date.now(),
      details: { username, success }
    });
  }

  /**
   * Track route navigation timing
   */
  public recordNavigation(fromPath: string, toPath: string, durationMs: number): void {
    this.recordMetric({
      name: `Nav: ${fromPath} -> ${toPath}`,
      category: 'navigation',
      durationMs,
      timestamp: Date.now(),
      details: { from: fromPath, to: toPath }
    });
  }

  /**
   * Get an aggregated diagnostic report
   */
  public getReport(): PerformanceReport {
    const totalEvents = this.metrics.length;
    const totalDuration = this.metrics.reduce((acc, m) => acc + m.durationMs, 0);
    const averageDurationMs = totalEvents > 0 ? Math.round((totalDuration / totalEvents) * 10) / 10 : 0;

    const slowOperations = this.metrics.filter(m => m.durationMs >= SLOW_OPERATION_THRESHOLD_MS);

    const authMetrics = this.metrics.filter(m => m.category === 'auth');
    const authTotal = authMetrics.reduce((acc, m) => acc + m.durationMs, 0);
    const authAverageMs = authMetrics.length > 0 ? Math.round((authTotal / authMetrics.length) * 10) / 10 : 0;

    const navMetrics = this.metrics.filter(m => m.category === 'navigation');
    const navTotal = navMetrics.reduce((acc, m) => acc + m.durationMs, 0);
    const navigationAverageMs = navMetrics.length > 0 ? Math.round((navTotal / navMetrics.length) * 10) / 10 : 0;

    const renderCountsObj: Record<string, number> = {};
    this.renderCounts.forEach((count, name) => {
      renderCountsObj[name] = count;
    });

    return {
      summary: {
        totalEvents,
        averageDurationMs,
        slowOperationsCount: slowOperations.length,
        authAverageMs,
        navigationAverageMs
      },
      renderCounts: renderCountsObj,
      slowOperations,
      recentMetrics: [...this.metrics].slice(-20)
    };
  }

  /**
   * Reset metrics for fresh test runs
   */
  public clear(): void {
    this.metrics = [];
    this.marks.clear();
    this.renderCounts.clear();
  }
}

export const bctPerformance = new PerformanceMonitorService();

// Attach to window in browser for dev tools inspection
if (typeof window !== 'undefined') {
  (window as any).__bctPerformance = bctPerformance;
}
