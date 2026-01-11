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
      const extra = event.extra as Record<string, unknown>
      const { email, phone, client_email, client_phone, ...rest } = extra
      void email; void phone; void client_email; void client_phone; // Intentionally unused
      event.extra = rest
    }

    return event
  },
})
