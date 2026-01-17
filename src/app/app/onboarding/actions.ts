"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Update onboarding step
export async function updateOnboardingStep(step: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_step: step })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/onboarding");
  return { success: true };
}

// Complete onboarding
export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_step: 4,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  return { success: true };
}

// Upload avatar during onboarding
export async function uploadAvatarOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const fileExt = "jpg";
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile with avatar URL
  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  return { url: publicUrl };
}

// Update profile during onboarding
export async function updateProfileOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fullName = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;
  const avatarUrl = formData.get("avatar_url") as string;

  const updateData: Record<string, unknown> = {
    full_name: fullName || null,
    bio: bio || null,
    onboarding_step: 1,
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/onboarding");
  return { success: true };
}

// Create service during onboarding
export async function createServiceOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const durationMinutes =
    parseInt(formData.get("duration_minutes") as string) || 60;
  const priceValue = parseFloat((formData.get("price") as string) || "0");

  // Ensure price is not negative
  if (priceValue < 0) {
    return { error: "Price cannot be negative" };
  }

  const priceCents = Math.round(priceValue * 100);
  const description = formData.get("description") as string;
  const locationType = (formData.get("location_type") as string) || "in_person";
  const bufferBefore = parseInt(formData.get("buffer_before") as string) || 0;
  const bufferAfter = parseInt(formData.get("buffer_after") as string) || 0;
  const cancelPolicy = (formData.get("cancel_policy") as string) || "flexible";

  if (!name?.trim()) {
    return { error: "Service name is required" };
  }

  const { error } = await supabase.from("services").insert({
    provider_id: user.id,
    name: name.trim(),
    duration_minutes: durationMinutes,
    price_cents: priceCents,
    description: description || null,
    location_type: locationType,
    buffer_before_minutes: bufferBefore,
    buffer_after_minutes: bufferAfter,
    cancel_policy: cancelPolicy,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  // Update onboarding step
  await supabase
    .from("profiles")
    .update({ onboarding_step: 2 })
    .eq("id", user.id);

  revalidatePath("/app/onboarding");
  return { success: true };
}

// Set availability during onboarding (using preset templates)
export async function setAvailabilityOnboarding(template: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Define templates
  const templates: Record<
    string,
    { days: number[]; start: string; end: string }
  > = {
    weekdays_9_5: {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      start: "09:00:00",
      end: "17:00:00",
    },
    weekdays_10_6: {
      days: [1, 2, 3, 4, 5],
      start: "10:00:00",
      end: "18:00:00",
    },
    all_week: {
      days: [0, 1, 2, 3, 4, 5, 6], // Sun-Sat
      start: "09:00:00",
      end: "17:00:00",
    },
    flexible: {
      days: [1, 2, 3, 4, 5, 6], // Mon-Sat
      start: "08:00:00",
      end: "20:00:00",
    },
  };

  const selected = templates[template];
  if (!selected) {
    return { error: "Invalid template" };
  }

  // Clear existing rules
  await supabase.from("availability_rules").delete().eq("provider_id", user.id);

  // Insert new rules
  const rules = selected.days.map((day) => ({
    provider_id: user.id,
    day_of_week: day,
    start_time_local: selected.start,
    end_time_local: selected.end,
  }));

  const { error } = await supabase.from("availability_rules").insert(rules);

  if (error) {
    return { error: error.message };
  }

  // Ensure availability_settings exists
  const { data: existingSettings } = await supabase
    .from("availability_settings")
    .select("provider_id")
    .eq("provider_id", user.id)
    .single();

  if (!existingSettings) {
    await supabase.from("availability_settings").insert({
      provider_id: user.id,
      min_notice_minutes: 120,
      horizon_days: 30,
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
    });
  }

  // Update onboarding step
  await supabase
    .from("profiles")
    .update({ onboarding_step: 3 })
    .eq("id", user.id);

  revalidatePath("/app/onboarding");
  return { success: true };
}

// Skip onboarding entirely
export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_step: 4,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  return { success: true };
}
