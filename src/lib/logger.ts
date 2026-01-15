/**
 * Simple logger utility for conditional logging based on environment
 * Only logs in development mode to keep production clean
 */

const isDev = process.env.NODE_ENV === 'development'

interface LoggerOptions {
    prefix?: string
    forceLog?: boolean  // Log even in production (for critical errors)
}

export const logger = {
    /**
     * Log informational messages (dev only)
     */
    info: (message: string, data?: unknown, options?: LoggerOptions) => {
        if (isDev || options?.forceLog) {
            const prefix = options?.prefix ? `[${options.prefix}]` : ''
            if (data !== undefined) {
                console.log(`${prefix} ${message}`, data)
            } else {
                console.log(`${prefix} ${message}`)
            }
        }
    },

    /**
     * Log debug messages (dev only)
     */
    debug: (message: string, data?: unknown, options?: LoggerOptions) => {
        if (isDev || options?.forceLog) {
            const prefix = options?.prefix ? `[${options.prefix}]` : '[DEBUG]'
            if (data !== undefined) {
                console.log(`${prefix} ${message}`, data)
            } else {
                console.log(`${prefix} ${message}`)
            }
        }
    },

    /**
     * Log warning messages (always logs but can be filtered in production)
     */
    warn: (message: string, data?: unknown, options?: LoggerOptions) => {
        const prefix = options?.prefix ? `[${options.prefix}]` : '[WARN]'
        if (data !== undefined) {
            console.warn(`${prefix} ${message}`, data)
        } else {
            console.warn(`${prefix} ${message}`)
        }
    },

    /**
     * Log error messages (always logs)
     */
    error: (message: string, error?: unknown, options?: LoggerOptions) => {
        const prefix = options?.prefix ? `[${options.prefix}]` : '[ERROR]'
        console.error(`${prefix} ${message}`, error)
    },

    /**
     * Create a scoped logger with a fixed prefix
     */
    scope: (prefix: string) => ({
        info: (message: string, data?: unknown) =>
            logger.info(message, data, { prefix }),
        debug: (message: string, data?: unknown) =>
            logger.debug(message, data, { prefix }),
        warn: (message: string, data?: unknown) =>
            logger.warn(message, data, { prefix }),
        error: (message: string, error?: unknown) =>
            logger.error(message, error, { prefix }),
    })
}

// Pre-configured loggers for different modules
export const emailLogger = logger.scope('EMAIL')
export const cronLogger = logger.scope('CRON')
export const bookingLogger = logger.scope('BOOKING')
export const authLogger = logger.scope('AUTH')
