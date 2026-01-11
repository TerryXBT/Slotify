import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Skip middleware for static files and specific paths
    const path = request.nextUrl.pathname
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path === '/manifest.json' ||
        path === '/favicon.ico' ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(path)
    ) {
        return NextResponse.next()
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
    ],
}
