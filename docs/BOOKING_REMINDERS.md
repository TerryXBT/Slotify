# Booking Reminders

This document explains how to set up automatic booking reminders that are sent 24 hours before appointments.

## How It Works

The reminder system:
1. Checks for confirmed bookings happening in 24 hours
2. Sends an email reminder to clients who have provided an email address
3. Formats the date/time in the provider's timezone
4. Includes the service name, provider name, and location (if applicable)

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployment)

1. Create `vercel.json` in your project root:
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

This will run the reminder job at 9:00 AM UTC every day.

2. Add a secret to your environment variables:
```bash
# Add to .env.local and Vercel environment variables
CRON_SECRET=your_random_secret_here
```

3. Deploy to Vercel - the cron will start automatically

### Option 2: External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Uptime Robot](https://uptimerobot.com)

Setup:
1. Configure the service to call: `https://yourdomain.com/api/cron/reminders`
2. Set schedule to run daily (e.g., 9:00 AM)
3. Add authorization header: `Authorization: Bearer your_secret_here`

### Option 3: Manual Testing

You can manually trigger reminders for testing:

```bash
# With secret
curl -X GET https://yourdomain.com/api/cron/reminders \
  -H "Authorization: Bearer your_secret_here"

# Without secret (if CRON_SECRET not set)
curl -X GET http://localhost:3000/api/cron/reminders
```

## Configuration

### Reminder Window

Currently set to 24 hours before appointments. To change:

Edit `src/app/actions/reminders.ts`:
```typescript
// Change these values:
const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000) // 23 hours
const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000) // 25 hours
```

### Email Content

To customize the reminder email, edit the HTML template in `src/lib/email/service.ts`:
- Look for the `createBookingReminderHTML` function
- Modify the HTML to match your branding

## Monitoring

Check your logs for reminder job execution:
- Vercel: View logs in the Vercel dashboard
- External cron: Check the response from the API endpoint

Sample successful response:
```json
{
  "success": true,
  "sent": 5,
  "failed": 0,
  "total": 5,
  "timestamp": "2024-01-08T09:00:00.000Z"
}
```

## Best Practices

1. **Run daily**: Set the cron to run once per day
2. **Choose a good time**: Run during business hours in your timezone
3. **Monitor failures**: Set up alerts if the job fails
4. **Test first**: Test locally before enabling in production
5. **Check logs**: Review logs regularly to ensure reminders are being sent

## Troubleshooting

### No reminders being sent

1. Check if there are bookings in the next 24 hours:
   ```sql
   SELECT * FROM bookings
   WHERE status = 'confirmed'
   AND client_email IS NOT NULL
   AND start_at BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours';
   ```

2. Verify email service is configured (check console logs)

3. Check cron job is actually running (check provider logs)

### Reminders sent multiple times

- Ensure cron job runs only once per day
- Check if multiple cron services are configured

### Wrong timezone in emails

- Verify provider's timezone is set correctly in their profile
- Check the `date-fns-tz` package is installed

## Future Enhancements

Potential improvements:
- Multiple reminder times (e.g., 1 week before, 1 day before, 1 hour before)
- SMS reminders via Twilio
- Customizable reminder templates per provider
- Option for clients to disable reminders
- Reminder history tracking in database
