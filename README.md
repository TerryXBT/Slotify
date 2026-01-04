# Slotify

A modern, full-stack booking management platform built with Next.js 16, React 19, and Supabase. Slotify enables service providers to manage their schedules, availability, and client bookings with an intuitive interface.

## Features

### For Service Providers
- **Profile Management** - Customize your public booking page with bio, avatar, location, and cancellation policies
- **Service Management** - Create and manage multiple services with custom durations and pricing
- **Availability Control** - Set weekly availability schedules with buffer times and minimum notice periods
- **Busy Time Blocking** - Block out specific time slots for personal commitments
- **Booking Dashboard** - View and manage all bookings with status tracking
- **Weekly Calendar** - Visual calendar view of all appointments
- **Reschedule Requests** - Send reschedule proposals to clients with multiple time options

### For Clients
- **Public Booking Pages** - Clean, user-friendly booking interface
- **Real-time Availability** - See available time slots instantly
- **Timezone Support** - Automatic timezone handling for accurate scheduling
- **Email Notifications** - Booking confirmations and updates
- **Easy Rescheduling** - One-click reschedule with token-based authentication
- **Simple Cancellation** - Cancel bookings via secure links

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Sonner** - Toast notifications

### Backend
- **Supabase** - PostgreSQL database with built-in authentication
- **Supabase RLS** - Row-Level Security for data protection
- **Server Actions** - Next.js server-side mutations
- **Edge Runtime** - Fast, globally distributed

### Date & Time
- **date-fns** - Modern date utility library
- **date-fns-tz** - Timezone handling

### Media
- **react-easy-crop** - Image cropping for avatars

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account ([sign up free](https://supabase.com))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TerryXBT/Slotify.git
   cd Slotify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Set up the database**

   Run the SQL files in the `supabase/` directory in order:
   ```bash
   # In Supabase SQL Editor, run these files in order:
   # 1. schema.sql (main database schema)
   # 2. seed.sql (sample data - optional)
   # 3. Migration files as needed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
Slotify/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── app/                 # Protected app routes
│   │   │   ├── today/           # Dashboard
│   │   │   ├── week/            # Calendar view
│   │   │   ├── bookings/        # Booking management
│   │   │   ├── settings/        # User settings
│   │   │   ├── availability/    # Availability management
│   │   │   ├── busy/            # Busy blocks
│   │   │   └── share/           # Share booking page
│   │   ├── book/                # Public booking flow
│   │   ├── reschedule/          # Reschedule workflow
│   │   ├── cancel/              # Cancellation workflow
│   │   ├── api/                 # API routes
│   │   └── [username]/          # Public booking pages
│   │
│   ├── components/              # Reusable React components
│   │   ├── BookingFlow.tsx
│   │   ├── BottomNav.tsx
│   │   ├── ServiceCard.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── lib/                     # Business logic
│   │   ├── availability.ts      # Availability calculation engine
│   │   └── email/               # Email service
│   │
│   ├── utils/                   # Utility functions
│   │   ├── supabase/            # Supabase clients
│   │   └── cropImage.ts         # Image utilities
│   │
│   └── types/                   # TypeScript types
│       └── supabase.ts          # Database types
│
├── supabase/                    # Database configuration
│   ├── schema.sql               # Database schema
│   ├── seed.sql                 # Sample data
│   └── migrations/              # Database migrations
│
└── public/                      # Static assets
```

## Database Schema

### Core Tables
- **profiles** - User profiles with settings and public info
- **services** - Service offerings with duration and pricing
- **availability_settings** - Global availability preferences
- **availability_rules** - Weekly availability schedule
- **busy_blocks** - Time blocks marked as unavailable
- **bookings** - All booking records
- **reschedule_proposals** - Reschedule requests
- **action_tokens** - One-time tokens for cancellation/reschedule

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |

## Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub** (already done!)

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your `Slotify` repository
   - Configure environment variables
   - Deploy!

3. **Set up production database**
   - Create a production Supabase project
   - Run all migration scripts
   - Update environment variables in Vercel

### Deploy to Other Platforms

Slotify can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted with Docker

Refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for platform-specific instructions.

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type checking
- Prettier-compatible formatting (via ESLint)

## Key Features Deep Dive

### Availability Calculation
The heart of Slotify is the availability calculation engine (`lib/availability.ts`). It:
- Generates 15-minute time slots based on provider's weekly schedule
- Accounts for timezone differences
- Respects minimum notice periods
- Handles buffer times before/after appointments
- Checks for conflicts with existing bookings and busy blocks

### Security
- **Row-Level Security (RLS)** - All database tables are protected with RLS policies
- **Token-based actions** - Reschedule and cancellation use one-time secure tokens
- **Server-side validation** - All mutations validated on the server
- **Environment variable protection** - Sensitive keys never exposed to client

### Timezone Handling
- Providers set their timezone in settings
- All times stored in UTC in the database
- Converted to provider's local time for display and scheduling
- Client bookings automatically adjusted for timezone differences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Email notifications (booking confirmations, reminders)
- [ ] SMS notifications via Twilio
- [ ] Payment integration (Stripe)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Multi-language support (i18n)
- [ ] Team/multi-provider support
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Recurring bookings
- [ ] Waitlist functionality

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database and auth by [Supabase](https://supabase.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For support, please open an issue in the GitHub repository or contact the maintainer.

---

**Made with ❤️ by [TerryXBT](https://github.com/TerryXBT)**
