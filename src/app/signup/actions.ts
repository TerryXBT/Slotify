'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string

    if (!email || !password || !fullName) {
        return redirect('/signup?error=Please fill in all required fields')
    }

    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
            }
        }
    })

    if (signUpError) {
        return redirect(`/signup?error=${encodeURIComponent(signUpError.message)}`)
    }

    // Get the user ID
    const userId = authData.user?.id

    if (!userId) {
        return redirect('/signup?error=Failed to create user account')
    }

    // Note: Profile is automatically created by database trigger
    // Wait a moment to ensure trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

    if (profileError || !profile) {
        console.error('Profile verification error:', profileError)
        // Profile creation failed - this shouldn't happen with the trigger
        return redirect('/signup?error=Failed to create user profile. Please try again.')
    }

    revalidatePath('/', 'layout')
    redirect('/app/today')
}
