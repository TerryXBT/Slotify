import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateServiceView from './CreateServiceView'

export default async function NewServicePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return <CreateServiceView profile={profile} />
}
