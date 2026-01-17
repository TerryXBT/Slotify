import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if we're on the onboarding page to hide BottomNav
  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isOnboarding = pathname.includes("/onboarding");

  // If onboarding, render minimal layout without BottomNav
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-24 text-gray-100 font-sans">
      {/* Main Content */}
      <main>{children}</main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
