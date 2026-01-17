import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AppLayoutWrapper } from "@/components/layouts/AppLayoutWrapper";

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

  // Fetch user profile for desktop layout
  const { data: profile } = await supabase
    .from("providers")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AppLayoutWrapper
      userEmail={user.email}
      displayName={profile?.display_name}
      avatarUrl={profile?.avatar_url}
    >
      {children}
    </AppLayoutWrapper>
  );
}
