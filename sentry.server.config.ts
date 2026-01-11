import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Environment
  environment: process.env.NODE_ENV,

  // Filter out sensitive information
  beforeSend(event) {
    // Remove sensitive data from extra
    if (event.extra) {
      const extra = event.extra as Record<string, unknown>
      const { email, phone, client_email, client_phone, ...rest } = extra
      void email; void phone; void client_email; void client_phone; // Intentionally unused
      event.extra = rest
    }

    // Remove sensitive data from request
    if (event.request) {
      if (event.request.data) {
        const data = typeof event.request.data === 'string'
          ? JSON.parse(event.request.data)
          : event.request.data

        // Remove sensitive fields
        delete data.email
        delete data.phone
        delete data.client_email
        delete data.client_phone

        event.request.data = JSON.stringify(data)
      }
    }

    return event
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],
})
