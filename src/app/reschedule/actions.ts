'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function confirmReschedule(formData: FormData) {
    const supabase = await createClient() // Anon client is fine here as we use RPC or just public access logic?
    // Check schema: confirm_reschedule RPC is security definer. Anon can call it IF granted?
    // Or we need to use service role?
    // Schema says: `alter table ... enable row level security`.
    // RPC `confirm_reschedule` is `security definer`.
    // So anyone can call it, and it switches to owner permissions internally?
    // BUT: "security definer" runs with privileges of the creator (likely postgres or admin).
    // We need to ensure the logic checks the token validly. The RPC logic does `select ... where token = p_token`.
    // So it is safe to call from Anon.

    const token = formData.get('token') as string
    const optionId = formData.get('optionId') as string

    if (!token || !optionId) return { error: 'Missing data' }

    const { data, error } = await supabase.rpc('confirm_reschedule', {
        p_token: token,
        p_option_id: optionId
    })

    if (error) {
        console.error(error)
        return { error: 'Failed to reschedule. The link may be expired.' }
    }

    return { success: true }
}
