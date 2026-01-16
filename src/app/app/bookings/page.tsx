import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import Link from "next/link";

// Booking with partial service for list display
interface BookingListItem {
  id: string;
  client_name: string;
  start_at: string;
  status: string;
  services: { name: string } | null;
}

export default async function BookingsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, services(name)")
    .eq("provider_id", user?.id)
    .order("start_at", { ascending: false }); // Newest first

  return (
    <div className="min-h-screen bg-neutral-900 font-sans pb-24">
      <header className="sticky top-0 z-30 bg-[#1C1C1E]/90 backdrop-blur-md px-5 pt-12 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">All Bookings</h1>
      </header>

      <div className="p-4 space-y-3">
        {bookings?.map((booking: BookingListItem) => (
          <Link
            key={booking.id}
            href={`/app/bookings/${booking.id}`}
            className="block bg-[#1C1C1E] p-4 rounded-xl border border-gray-800 shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-lg">{booking.client_name}</div>
                <div className="text-sm text-gray-500">
                  {booking.services?.name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {format(new Date(booking.start_at), "MMM d, h:mm a")}
                </div>
                <div
                  className={`text-xs uppercase font-bold mt-1 ${
                    booking.status === "confirmed"
                      ? "text-green-600"
                      : booking.status === "cancelled"
                        ? "text-red-600"
                        : "text-orange-600"
                  }`}
                >
                  {booking.status}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!bookings || bookings.length === 0) && (
          <div className="text-center text-gray-500 py-10">
            No bookings found.
          </div>
        )}
      </div>
    </div>
  );
}
