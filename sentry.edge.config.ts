import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - lower for edge (cost-sensitive)
  tracesSampleRate: 0.05, // 5% of transactions

  // Environment
  environment: process.env.NODE_ENV,

  // Filter out sensitive information
  beforeSend(event) {
    // Remove sensitive data from extra
    if (event.extra) {
      const { email, phone, client_email, client_phone, ...rest } = event.extra as any
      event.extra = rest
    }

    return event
  },
})
