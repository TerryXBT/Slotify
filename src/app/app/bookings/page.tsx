import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BookingsView from "./BookingsView";

export default async function BookingsListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; view?: string }>;
}) {
  const { tab, search, view } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();

  // Fetch all bookings with service info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, services(name, duration_minutes, location_type)")
    .eq("provider_id", user.id)
    .order("start_at", { ascending: true });

  // Categorize bookings
  const allBookings = bookings || [];

  // Upcoming: confirmed bookings in the future
  const upcomingBookings = allBookings.filter(
    (b) => b.start_at >= now && b.status === "confirmed",
  );

  // Past: confirmed/completed bookings in the past
  const pastBookings = allBookings
    .filter(
      (b) =>
        b.start_at < now &&
        (b.status === "confirmed" || b.status === "completed"),
    )
    .reverse(); // Most recent first

  // Cancelled bookings
  const cancelledBookings = allBookings
    .filter((b) => b.status === "cancelled")
    .reverse();

  // Pending/needs action bookings
  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending_reschedule" || b.status === "pending",
  );

  // Fetch active services for manual booking (calendar view)
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", user.id)
    .eq("is_active", true)
    .order("name");

  return (
    <BookingsView
      upcomingBookings={upcomingBookings}
      pastBookings={pastBookings}
      cancelledBookings={cancelledBookings}
      pendingBookings={pendingBookings}
      services={services || []}
      initialTab={tab || "upcoming"}
      initialSearch={search || ""}
      initialView={(view as "list" | "calendar") || "list"}
    />
  );
}
