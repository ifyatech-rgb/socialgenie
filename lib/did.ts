/**
 * D-ID API integration
 * - Express Avatars: create avatar from video (face + voice clone)
 * - Scenes: generate video from avatar + script (cloned voice)
 * Docs: https://docs.d-id.com/reference/express-avatars-overview
 */

export const DID_API_KEY = process.env.DID_API_KEY;
export const DID_BASE_URL = "https://api.d-id.com";

const authHeader = () =>
  DID_API_KEY ? { Authorization: `Basic ${DID_API_KEY}` } : {};

// --- Consent (required before Express Avatar) ---

export interface ConsentResponse {
  id: string;
  text: string;
  created_at: string;
  created_by: string;
}

export async function createConsent(
  language: string = "english"
): Promise<ConsentResponse | null> {
  if (!DID_API_KEY) return null;
  try {
    const res = await fetch(`${DID_BASE_URL}/consents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[D-ID] createConsent error:", res.status, err);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("[D-ID] createConsent error:", e);
    return null;
  }
}

export async function uploadConsentVideo(
  consentId: string,
  name: string,
  sourceUrl: string,
  webhook?: string
): Promise<boolean> {
  if (!DID_API_KEY) return false;
  try {
    const body: Record<string, string> = { name, source_url: sourceUrl };
    if (webhook) body.webhook = webhook;
    const res = await fetch(`${DID_BASE_URL}/consents/${consentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[D-ID] uploadConsentVideo error:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[D-ID] uploadConsentVideo error:", e);
    return false;
  }
}

export async function getConsentStatus(
  consentId: string
): Promise<{ status: string } | null> {
  if (!DID_API_KEY) return null;
  try {
    const res = await fetch(`${DID_BASE_URL}/consents/${consentId}`, {
      headers: authHeader(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { status: data.status ?? "pending" };
  } catch (e) {
    console.error("[D-ID] getConsentStatus error:", e);
    return null;
  }
}

// --- Express Avatar (create from video, face + voice clone) ---

export interface CreateExpressAvatarResponse {
  id: string;
  object: string;
  created_at: string;
  status: string;
}

export async function createExpressAvatar(
  name: string,
  consentId: string,
  sourceUrl: string,
  options?: { webhook?: string; thumbnail_url?: string }
): Promise<CreateExpressAvatarResponse | null> {
  if (!DID_API_KEY) return null;
  try {
    const body: Record<string, string> = {
      name,
      consent_id: consentId,
      show: "true",
      persist: "true",
      source_url: sourceUrl,
    };
    if (options?.webhook) body.webhook = options.webhook;
    if (options?.thumbnail_url) body.thumbnail_url = options.thumbnail_url;
    const res = await fetch(`${DID_BASE_URL}/scenes/avatars`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[D-ID] createExpressAvatar error:", res.status, err);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("[D-ID] createExpressAvatar error:", e);
    return null;
  }
}

export interface ExpressAvatarStatus {
  id: string;
  status: string;
  voice_id?: string;
  thumbnail_url?: string;
  image_url?: string;
}

export async function getExpressAvatarStatus(
  avatarId: string
): Promise<ExpressAvatarStatus | null> {
  if (!DID_API_KEY) return null;
  try {
    const res = await fetch(`${DID_BASE_URL}/scenes/avatars/${avatarId}`, {
      headers: authHeader(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      status: data.status ?? "pending",
      voice_id: data.voice_id,
      thumbnail_url: data.thumbnail_url,
      image_url: data.image_url,
    };
  } catch (e) {
    console.error("[D-ID] getExpressAvatarStatus error:", e);
    return null;
  }
}

// --- Scenes (generate video from Express Avatar + script, with cloned voice) ---

export interface CreateSceneResponse {
  id: string;
  object: string;
  created_at: string;
  status: string;
}

export async function createScene(
  avatarId: string,
  script: string,
  voiceId: string,
  webhook?: string
): Promise<CreateSceneResponse | null> {
  if (!DID_API_KEY) return null;
  try {
    const body: Record<string, unknown> = {
      avatar_id: avatarId,
      script: {
        type: "text",
        input: script,
        provider: {
          type: "elevenlabs",
          voice_id: voiceId,
        },
      },
    };
    if (webhook) (body as Record<string, string>).webhook = webhook;
    const res = await fetch(`${DID_BASE_URL}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[D-ID] createScene error:", res.status, err);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("[D-ID] createScene error:", e);
    return null;
  }
}

export interface SceneStatus {
  id: string;
  status: string;
  result_url?: string;
}

export async function getSceneStatus(
  sceneId: string
): Promise<SceneStatus | null> {
  if (!DID_API_KEY) return null;
  try {
    const res = await fetch(`${DID_BASE_URL}/scenes/${sceneId}`, {
      headers: authHeader(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      status: data.status ?? "created",
      result_url: data.result_url,
    };
  } catch (e) {
    console.error("[D-ID] getSceneStatus error:", e);
    return null;
  }
}
