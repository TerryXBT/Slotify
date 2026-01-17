import { redirect } from "next/navigation";

// Redirect to the unified availability settings page
export default function AvailabilityPage() {
  redirect("/app/settings/availability");
}
