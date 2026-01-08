import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Audit log utilities for tracking all changes to critical entities
 * All audit writes use admin client to bypass RLS
 */

export type AuditEntityType = 'booking' | 'service' | 'profile' | 'availability'
export type AuditAction = 'create' | 'update' | 'delete' | 'cancel' | 'reschedule' | 'confirm'

interface AuditLogParams {
    entityType: AuditEntityType
    entityId: string
    action: AuditAction
    userId?: string
    userEmail?: string
    changes?: {
        old?: Record<string, any>
        new?: Record<string, any>
    }
    metadata?: Record<string, any>
}

/**
 * Write an audit log entry
 * This function uses the admin client to bypass RLS
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
    const supabase = createAdminClient()

    try {
        // audit_logs table exists but may not be in generated types yet
        const { error } = await (supabase as any)
            .from('audit_logs')
            .insert({
                entity_type: params.entityType,
                entity_id: params.entityId,
                action: params.action,
                user_id: params.userId || null,
                user_email: params.userEmail || null,
                changes: params.changes || null,
                metadata: params.metadata || null
            })

        if (error) {
            console.error('[AUDIT] Failed to write audit log:', error)
            // Don't throw - audit logging should never break the main flow
        }
    } catch (error) {
        console.error('[AUDIT] Exception writing audit log:', error)
        // Silent fail - audit is important but not critical to user experience
    }
}

/**
 * Helper to create audit log from booking changes
 */
export async function auditBookingChange(
    bookingId: string,
    action: AuditAction,
    oldData?: any,
    newData?: any,
    userId?: string,
    userEmail?: string
): Promise<void> {
    await writeAuditLog({
        entityType: 'booking',
        entityId: bookingId,
        action,
        userId,
        userEmail,
        changes: {
            old: oldData,
            new: newData
        }
    })
}

/**
 * Helper to create audit log from service changes
 */
export async function auditServiceChange(
    serviceId: string,
    action: AuditAction,
    oldData?: any,
    newData?: any,
    userId?: string
): Promise<void> {
    await writeAuditLog({
        entityType: 'service',
        entityId: serviceId,
        action,
        userId,
        changes: {
            old: oldData,
            new: newData
        }
    })
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 50
) {
    const supabase = createAdminClient()

    // audit_logs table exists but may not be in generated types yet
    const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('[AUDIT] Failed to fetch audit logs:', error)
        return { logs: [], error }
    }

    return { logs: data, error: null }
}
