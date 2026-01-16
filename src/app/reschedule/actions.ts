"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { emailService } from "@/lib/email/service";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function confirmReschedule(formData: FormData) {
  const supabase = await createClient();
  const token = formData.get("token") as string;
  const optionId = formData.get("optionId") as string;

  if (!token || !optionId) return { error: "Missing data" };

  // Call the RPC to perform the atomic reschedule
  const { data: _data, error } = await supabase.rpc("confirm_reschedule", {
    p_token: token,
    p_option_id: optionId,
  });

  if (error) {
    console.error(error);
    return { error: "Failed to reschedule. The link may be expired." };
  }

  // Send confirmation email
  try {
    const adminClient = createAdminClient();

    // Get proposal and booking details
    const { data: proposal } = await adminClient
      .from("reschedule_proposals")
      .select("booking_id")
      .eq("token", token)
      .single();

    if (proposal?.booking_id) {
      const { data: booking } = await adminClient
        .from("bookings")
        .select(
          "client_email, client_name, start_at, services(name), profiles(full_name, timezone)",
        )
        .eq("id", proposal.booking_id)
        .single();

      if (booking && booking.client_email) {
        const servicesData = booking.services as any;
        const serviceName =
          (Array.isArray(servicesData)
            ? servicesData[0]?.name
            : servicesData?.name) || "Your Appointment";
        const profilesData = booking.profiles as any;
        const providerName =
          (Array.isArray(profilesData)
            ? profilesData[0]?.full_name
            : profilesData?.full_name) || "Provider";
        const timezone =
          (Array.isArray(profilesData)
            ? profilesData[0]?.timezone
            : profilesData?.timezone) || "UTC";

        // Format date in provider's timezone
        const zonedDate = toZonedTime(new Date(booking.start_at), timezone);
        const formattedDate = format(
          zonedDate,
          "EEEE, MMMM d, yyyy 'at' h:mm a zzz",
        );

        await emailService.sendRescheduleConfirmation(
          booking.client_email,
          booking.client_name,
          serviceName,
          formattedDate,
          providerName,
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send reschedule confirmation email:", emailError);
    // Don't fail the operation if email fails
  }

  return { success: true };
}
