// Performance monitoring utilities

import { logger } from './logger'
import React, { useEffect } from 'react'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private thresholds: Map<string, number> = new Map([
    ['api_call', 1000], // 1 second
    ['db_query', 500], // 500ms
    ['image_generation', 10000], // 10 seconds
    ['video_processing', 30000], // 30 seconds
    ['page_load', 3000], // 3 seconds
    ['component_render', 100] // 100ms
  ])

  // Start tracking a metric
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    })
  }

  // End tracking and log if slow
  end(name: string): number {
    const metric = this.metrics.get(name)
    if (!metric) {
      logger.warn(`Performance metric '${name}' was not started`)
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    metric.endTime = endTime
    metric.duration = duration

    // Check against threshold
    const threshold = this.getThreshold(name)
    if (duration > threshold) {
      logger.performance(name, duration, {
        metadata: metric.metadata,
        threshold
      })
    }

    this.metrics.delete(name)
    return duration
  }

  // Get threshold for a metric type
  private getThreshold(name: string): number {
    // Check for exact match
    if (this.thresholds.has(name)) {
      return this.thresholds.get(name)!
    }

    // Check for prefix match
    for (const [key, value] of this.thresholds) {
      if (name.startsWith(key)) {
        return value
      }
    }

    // Default threshold
    return 1000 // 1 second
  }

  // Set custom threshold
  setThreshold(name: string, milliseconds: number): void {
    this.thresholds.set(name, milliseconds)
  }

  // Measure async function
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata)
    try {
      const result = await fn()
      return result
    } finally {
      this.end(name)
    }
  }

  // Measure sync function
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(name, metadata)
    try {
      const result = fn()
      return result
    } finally {
      this.end(name)
    }
  }

  // React component render tracking
  measureRender(componentName: string): () => void {
    const metricName = `component_render_${componentName}`
    this.start(metricName, { component: componentName })
    
    return () => {
      this.end(metricName)
    }
  }

  // API call tracking
  async measureAPI<T>(
    endpoint: string,
    request: () => Promise<T>
  ): Promise<T> {
    return this.measure(`api_call_${endpoint}`, request, { endpoint })
  }

  // Database query tracking
  async measureDB<T>(
    operation: string,
    query: () => Promise<T>
  ): Promise<T> {
    return this.measure(`db_query_${operation}`, query, { operation })
  }

  // Get current metrics (for debugging)
  getCurrentMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const cleanup = performanceMonitor.measureRender(componentName)
    return cleanup
  }, [componentName])
}

// HOC for component performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component'
  
  const WrappedComponent: React.FC<P> = (props) => {
    usePerformanceTracking(displayName)
    return React.createElement(Component, props)
  }
  
  WrappedComponent.displayName = `WithPerformanceTracking(${displayName})`
  
  return WrappedComponent
}

// Utility to debounce performance tracking
export function debouncePerformance<T extends (...args: any[]) => any>(
  fn: T,
  metricName: string,
  wait: number = 100
): T {
  let timeout: NodeJS.Timeout | null = null
  let lastArgs: any[] | null = null

  return ((...args: Parameters<T>) => {
    lastArgs = args
    
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      if (lastArgs) {
        performanceMonitor.measureSync(metricName, () => fn(...(lastArgs as Parameters<T>)))
      }
      timeout = null
      lastArgs = null
    }, wait)
  }) as T
}

// Web Vitals integration
export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // First Contentful Paint (FCP)
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        logger.info('Web Vital: FCP', {
          metric: 'FCP',
          value: entry.startTime,
          rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor'
        })
      }
    }
  })
  paintObserver.observe({ entryTypes: ['paint'] })

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    logger.info('Web Vital: LCP', {
      metric: 'LCP',
      value: lastEntry.startTime,
      rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
    })
  })
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-input') {
        const fidEntry = entry as any // Type definition not available for PerformanceEventTiming
        const fid = fidEntry.processingStart - fidEntry.startTime
        logger.info('Web Vital: FID', {
          metric: 'FID',
          value: fid,
          rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
        })
      }
    }
  })
  fidObserver.observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as any // Type definition not available for LayoutShift
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value
        logger.info('Web Vital: CLS', {
          metric: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        })
      }
    }
  })
  clsObserver.observe({ entryTypes: ['layout-shift'] })
} 