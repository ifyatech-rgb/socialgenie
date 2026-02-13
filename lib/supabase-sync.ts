// @ts-nocheck
/**
 * Sync user data to Supabase users table.
 * Uses getSupabaseAdmin() for service role access.
 * Never throws - logs errors and allows auth to continue.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";

type SyncUserPayload = {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
};

function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
  );
}

export async function syncUserToSupabase(payload: SyncUserPayload): Promise<void> {
  const { id, email, name, avatar_url } = payload;
  if (!hasSupabaseConfig()) {
    return;
  }
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("users")
        .update({
          name: name ?? null,
          avatar_url: avatar_url ?? null,
          updated_at: now,
        } as any)
        .eq("email", email.trim().toLowerCase());

      if (error) {
        console.error("Supabase users UPDATE error:", error);
        return;
      }
      console.log("✅ User synced to Supabase (updated):", email);
    } else {
      const { error } = await supabase.from("users").insert({
        id,
        email: email.trim().toLowerCase(),
        name: name ?? null,
        avatar_url: avatar_url ?? null,
        created_at: now,
        updated_at: now,
      } as any);

      if (error) {
        console.error("Supabase users INSERT error:", error);
        return;
      }
      console.log("✅ User synced to Supabase (created):", email);
    }
  } catch (err) {
    console.error("Supabase sync error:", err);
  }
}

type SyncVideoPayload = {
  id: string;
  user_id: string;
  script_id?: string | null;
  filename?: string | null;
  url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  status?: string;
};

/**
 * Sync video to Supabase videos table.
 * Call after creating a video in Prisma. Never throws.
 */
export async function syncVideoToSupabase(payload: SyncVideoPayload): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await supabase.from("videos").insert({
      id: payload.id,
      user_id: payload.user_id,
      script_id: payload.script_id ?? null,
      filename: payload.filename ?? payload.id,
      url: payload.url,
      thumbnail_url: payload.thumbnail_url ?? null,
      duration: payload.duration ?? null,
      status: payload.status ?? "uploaded",
      created_at: now,
      updated_at: now,
    });
    if (error) console.error("Supabase videos INSERT error:", error);
  } catch (err) {
    console.error("Supabase video sync error:", err);
  }
}
