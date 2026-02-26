// @ts-nocheck
/**
 * Sync Prisma data to Supabase (users, scripts, avatars, videos, generated_videos, activity).
 * Uses getSupabaseAdmin() for service role access.
 * Never throws - logs errors and allows app to continue.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
  );
}

// ─── USER ─────────────────────────────────────────────────────────────────────
type SyncUserPayload = {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
  video_credits?: number | null;
  genie_edits?: number | null;
  custom_avatars_used?: number | null;
  custom_avatars_limit?: number | null;
};

export async function syncUserToSupabase(payload: SyncUserPayload): Promise<void> {
  const { id, email, name, avatar_url, plan, video_credits, genie_edits, custom_avatars_used, custom_avatars_limit } = payload;
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const emailNorm = email.trim().toLowerCase();

    const { data: existing } = await supabase.from("users").select("id").eq("email", emailNorm).maybeSingle();

    const row = {
      name: name ?? null,
      avatar_url: avatar_url ?? null,
      updated_at: now,
      ...(plan != null && { plan }),
      ...(video_credits != null && { video_credits: video_credits }),
      ...(genie_edits != null && { genie_edits: genie_edits }),
      ...(custom_avatars_used != null && { custom_avatars_used: custom_avatars_used }),
      ...(custom_avatars_limit != null && { custom_avatars_limit: custom_avatars_limit }),
    };

    if (existing) {
      const { error } = await supabase.from("users").update(row as any).eq("email", emailNorm);
      if (error) {
        console.error("Supabase users UPDATE error:", error);
        return;
      }
      console.log("✅ User synced to Supabase (updated):", email);
    } else {
      const { error } = await supabase.from("users").insert({
        id,
        email: emailNorm,
        name: name ?? null,
        avatar_url: avatar_url ?? null,
        plan: plan ?? "trial",
        video_credits: video_credits ?? 10,
        genie_edits: genie_edits ?? 0,
        custom_avatars_used: custom_avatars_used ?? 0,
        custom_avatars_limit: custom_avatars_limit ?? 1,
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

// ─── SCRIPT ───────────────────────────────────────────────────────────────────
type SyncScriptPayload = {
  id: string;
  user_id: string;
  topic: string;
  platform: string;
  content: string;
  tone?: string | null;
  length?: number | null;
  status?: string | null;
  lifecycle_status?: string | null;
  generated_video_id?: string | null;
  video_provider?: string | null;
  video_status?: string | null;
  video_progress?: number | null;
  generated_video_url?: string | null;
  project_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function syncScriptToSupabase(payload: SyncScriptPayload): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: existing } = await supabase.from("scripts").select("id").eq("id", payload.id).maybeSingle();
    const row = {
      user_id: payload.user_id,
      topic: payload.topic,
      platform: payload.platform,
      content: payload.content,
      tone: payload.tone ?? null,
      length: payload.length ?? null,
      status: payload.status ?? "draft",
      lifecycle_status: payload.lifecycle_status ?? "draft",
      generated_video_id: payload.generated_video_id ?? null,
      video_provider: payload.video_provider ?? null,
      video_status: payload.video_status ?? null,
      video_progress: payload.video_progress ?? null,
      generated_video_url: payload.generated_video_url ?? null,
      project_name: payload.project_name ?? null,
      updated_at: now,
    };
    if (existing) {
      const { error } = await supabase.from("scripts").update(row as any).eq("id", payload.id);
      if (error) console.error("Supabase scripts UPDATE error:", error);
      else console.log("✅ Script synced to Supabase (updated):", payload.id);
    } else {
      const { error } = await supabase.from("scripts").insert({
        id: payload.id,
        ...row,
        created_at: payload.created_at ?? now,
      } as any);
      if (error) console.error("Supabase scripts INSERT error:", error);
      else console.log("✅ Script synced to Supabase (created):", payload.id);
    }
  } catch (err) {
    console.error("Supabase script sync error:", err);
  }
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
type SyncAvatarPayload = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  provider_avatar_id: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function syncAvatarToSupabase(payload: SyncAvatarPayload): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await supabase.from("avatars").upsert(
      {
        id: payload.id,
        user_id: payload.user_id,
        name: payload.name,
        type: payload.type,
        provider_avatar_id: payload.provider_avatar_id,
        status: payload.status,
        created_at: payload.created_at ?? now,
        updated_at: now,
      } as any,
      { onConflict: "id" }
    );
    if (error) console.error("Supabase avatars UPSERT error:", error);
    else console.log("✅ Avatar synced to Supabase:", payload.id);
  } catch (err) {
    console.error("Supabase avatar sync error:", err);
  }
}

// ─── GENERATED VIDEO ─────────────────────────────────────────────────────────
type SyncGeneratedVideoPayload = {
  id: string;
  user_id: string;
  script_id?: string | null;
  generated_video_id: string;
  video_provider: string;
  video_status: string;
  video_progress?: number | null;
  generated_video_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  video_error?: string | null;
  project_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function syncGeneratedVideoToSupabase(payload: SyncGeneratedVideoPayload): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: existing } = await supabase.from("generated_videos").select("id").eq("id", payload.id).maybeSingle();
    const row = {
      user_id: payload.user_id,
      script_id: payload.script_id ?? null,
      generated_video_id: payload.generated_video_id,
      video_provider: payload.video_provider,
      video_status: payload.video_status,
      video_progress: payload.video_progress ?? 0,
      generated_video_url: payload.generated_video_url ?? null,
      thumbnail_url: payload.thumbnail_url ?? null,
      duration: payload.duration ?? null,
      video_error: payload.video_error ?? null,
      project_name: payload.project_name ?? null,
      updated_at: now,
    };
    if (existing) {
      const { error } = await supabase.from("generated_videos").update(row as any).eq("id", payload.id);
      if (error) console.error("Supabase generated_videos UPDATE error:", error);
      else console.log("✅ Generated video synced to Supabase (updated):", payload.id);
    } else {
      const { error } = await supabase.from("generated_videos").insert({
        id: payload.id,
        ...row,
        created_at: payload.created_at ?? now,
      } as any);
      if (error) console.error("Supabase generated_videos INSERT error:", error);
      else console.log("✅ Generated video synced to Supabase (created):", payload.id);
    }
  } catch (err) {
    console.error("Supabase generated_video sync error:", err);
  }
}

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────
type SyncActivityPayload = {
  id?: string;
  user_id: string;
  action: string;
  details: string | Record<string, unknown>;
  created_at?: string | null;
};

export async function syncActivityToSupabase(payload: SyncActivityPayload): Promise<void> {
  if (!hasSupabaseConfig()) return;
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const details = typeof payload.details === "string" ? (payload.details ? JSON.parse(payload.details) : {}) : payload.details;
    const row: Record<string, unknown> = {
      user_id: payload.user_id,
      action: payload.action,
      details,
      created_at: payload.created_at ?? now,
    };
    if (payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
      row.id = payload.id;
    }
    const { error } = await supabase.from("activity_logs").insert(row as any);
    if (error) console.error("Supabase activity_logs INSERT error:", error);
    else console.log("✅ Activity synced to Supabase:", payload.action);
  } catch (err) {
    console.error("Supabase activity sync error:", err);
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
