import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";

interface OnboardingPageProps {
  searchParams: Promise<{ preview?: string }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const isPreviewMode = params.preview === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // If already completed onboarding, redirect to dashboard
  // Unless in preview mode for testing
  if (profile.onboarding_completed && !isPreviewMode) {
    redirect("/app/today");
  }

  // Check if user has any services (for step calculation)
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .eq("provider_id", user.id)
    .is("deleted_at", null)
    .limit(1);

  // Check if user has availability rules set
  const { data: availabilityRules } = await supabase
    .from("availability_rules")
    .select("id")
    .eq("provider_id", user.id)
    .limit(1);

  const hasServices = (services?.length ?? 0) > 0;
  const hasAvailability = (availabilityRules?.length ?? 0) > 0;

  // Get base URL from environment variable for production
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null;

  return (
    <OnboardingFlow
      profile={profile}
      initialStep={isPreviewMode ? 0 : profile.onboarding_step || 0}
      hasServices={hasServices}
      hasAvailability={hasAvailability}
      isPreviewMode={isPreviewMode}
      baseUrl={baseUrl}
    />
  );
}
