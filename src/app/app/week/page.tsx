import { createClient } from "@/utils/supabase/server";
import CalendarView from "./CalendarView";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams; // Next.js 15: await searchParams
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const selectedDate = date ? new Date(date) : new Date(); // Default to today

  // Get Pro's profile with avatar
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, display_name")
    .eq("id", user.id)
    .single();

  // Fetch active services for manual booking
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", user.id)
    .eq("is_active", true)
    .order("name");

  // Pass control to client component for interactivity
  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans">
      <CalendarView
        initialDate={selectedDate}
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        services={services || []}
      />
    </div>
  );
}
