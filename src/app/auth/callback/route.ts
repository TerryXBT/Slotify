"use server";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/today";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if profile exists, if not it will be created by database trigger
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Wait for database trigger to create profile
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Verify profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // Profile doesn't exist yet, redirect to complete profile
          return NextResponse.redirect(`${origin}/auth/complete-profile`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate with Google`,
  );
}
