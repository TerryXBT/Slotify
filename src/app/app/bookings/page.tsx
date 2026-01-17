import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BookingsView from "./BookingsView";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch pending bookings for the attention banner
  const { data: pendingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("provider_id", user.id)
    .in("status", ["pending_reschedule", "pending"]);

  // Fetch active services for manual booking
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", user.id)
    .eq("is_active", true)
    .order("name");

  return (
    <BookingsView
      pendingBookings={pendingBookings || []}
      services={services || []}
    />
  );
}
