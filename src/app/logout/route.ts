import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Get the origin from the request to ensure correct port
  const requestUrl = new URL(request.url)
  const redirectUrl = new URL('/login', requestUrl.origin)

  return NextResponse.redirect(redirectUrl)
}
