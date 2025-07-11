// Centralized logging service for production-ready error handling
import * as Sentry from '@sentry/nextjs'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  userId?: string
  projectId?: string
  action?: string
  metadata?: Record<string, any>
  [key: string]: any // Allow additional properties
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && { error: error.message, stack: error.stack })
    }

    // In development, use console
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.log(`[${timestamp}] DEBUG:`, message, context)
          break
        case LogLevel.INFO:
          console.info(`[${timestamp}] INFO:`, message, context)
          break
        case LogLevel.WARN:
          console.warn(`[${timestamp}] WARN:`, message, context, error)
          break
        case LogLevel.ERROR:
          console.error(`[${timestamp}] ERROR:`, message, context, error)
          break
      }
    }

    // In production, send to Sentry or other logging service
    if (this.isProduction) {
      switch (level) {
        case LogLevel.WARN:
          Sentry.captureMessage(message, 'warning')
          break
        case LogLevel.ERROR:
          if (error) {
            Sentry.captureException(error, {
              contexts: {
                custom: context
              }
            })
          } else {
            Sentry.captureMessage(message, 'error')
          }
          break
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.WARN, message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  // Specific methods for common scenarios
  apiError(endpoint: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      action: 'api_call',
      endpoint
    }, error)
  }

  dbError(operation: string, error: Error, context?: LogContext) {
    this.error(`Database Error: ${operation}`, {
      ...context,
      action: 'db_operation',
      operation
    }, error)
  }

  authError(message: string, context?: LogContext) {
    this.warn(`Auth Error: ${message}`, {
      ...context,
      action: 'authentication'
    })
  }

  performance(metric: string, duration: number, context?: LogContext) {
    if (duration > 1000) { // Log slow operations over 1 second
      this.warn(`Slow operation: ${metric} took ${duration}ms`, {
        ...context,
        metric,
        duration
      })
    }
  }
}

export const logger = new Logger() 