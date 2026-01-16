"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  if (!data.email || !data.password) {
    redirect("/login?error=Please enter your email and password");
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=Invalid email or password");
  }

  revalidatePath("/", "layout");
  redirect("/app/today");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    headersList.get("x-forwarded-host") ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect("/login?error=Could not connect to Google");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithApple() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    headersList.get("x-forwarded-host") ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=Could not connect to Apple");
  }

  if (data.url) {
    redirect(data.url);
  }
}
