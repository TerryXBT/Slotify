import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Health check endpoint for monitoring and load balancers
 * Returns status of the application and database connectivity
 */
export async function GET() {
    const startTime = Date.now()

    // Check database connectivity
    let dbStatus = 'ok'
    let dbLatency = 0

    try {
        const supabase = createAdminClient()
        const dbStart = Date.now()

        // Simple query to verify DB connection
        const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)

        dbLatency = Date.now() - dbStart

        if (error) {
            dbStatus = 'error'
            console.error('[HEALTH] Database check failed:', error.message)
        }
    } catch (error) {
        dbStatus = 'error'
        console.error('[HEALTH] Database connection failed:', error)
    }

    const totalLatency = Date.now() - startTime
    const isHealthy = dbStatus === 'ok'

    const response = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        checks: {
            database: {
                status: dbStatus,
                latencyMs: dbLatency
            }
        },
        totalLatencyMs: totalLatency
    }

    return NextResponse.json(
        response,
        { status: isHealthy ? 200 : 503 }
    )
}
