/**
 * Video Generation Service - D-ID Clips API
 * Generates AI avatar videos from scripts
 */

import { getDIDAuthHeader } from "./did-auth";

const DID_BASE = "https://api.d-id.com";

export interface VideoGenerationRequest {
  script: string;
  scriptId: string;
  provider?: "did" | "heygen";
  voiceId?: string;
  /** When true, do not send voice provider — D-ID uses the presenter's cloned voice. */
  useClonedVoice?: boolean;
  avatarId?: string;
  avatarUrl?: string;
  expressVoiceId?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  backgroundType?: "default" | "color" | "green_screen" | "image";
  backgroundValue?: string;
  captionsEnabled?: boolean;
  openCaption?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
  provider: "did" | "heygen";
  error?: string;
  estimatedDuration?: number;
}

export interface VideoStatus {
  id: string;
  status: "created" | "started" | "done" | "error";
  resultUrl?: string;
  error?: string;
}

const DEFAULT_VOICE = "en-US-JennyNeural";

/**
 * Generate video using D-ID Clips or HeyGen
 */
export async function generateVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  if (request.provider === "heygen") {
    try {
      const { getHeyGenClient } = await import("./heygenClient");
      if (!process.env.HEYGEN_API_KEY) {
        return {
          success: false,
          status: "failed",
          provider: "heygen",
          error: "HeyGen API key not configured. Add HEYGEN_API_KEY to .env.",
        };
      }
      const avatarId = request.avatarId;
      if (!avatarId) {
        return {
          success: false,
          status: "failed",
          provider: "heygen",
          error: "Avatar ID is required for HeyGen.",
        };
      }
      const heygen = getHeyGenClient();
      let voiceId = request.voiceId;
      if (!voiceId) {
        const details = await heygen.getAvatarDetails(avatarId);
        voiceId = details?.defaultVoice ?? undefined;
      }
      if (!voiceId) {
        const voices = await heygen.getVoices();
        voiceId = voices[0]?.voice_id;
      }
      if (!voiceId) {
        return {
          success: false,
          status: "failed",
          provider: "heygen",
          error: "No voice available. Provide voiceId or use an avatar with a default voice.",
        };
      }
      const result = await heygen.generateVideo(
        request.script,
        avatarId,
        voiceId,
        { aspectRatio: request.aspectRatio ?? "9:16" }
      );
      return {
        success: true,
        videoId: result.videoId,
        status: "processing",
        provider: "heygen",
        estimatedDuration: Math.ceil(request.script.length / 12),
      };
    } catch (error) {
      return {
        success: false,
        status: "failed",
        provider: "heygen",
        error: error instanceof Error ? error.message : "HeyGen video generation failed",
      };
    }
  }

  const authHeader = getDIDAuthHeader();
  if (!authHeader) {
    console.error("[D-ID] DID_API_KEY is not set or invalid. Add DID_API_KEY to .env");
    return {
      success: false,
      status: "failed",
      provider: "did",
      error: "D-ID API key not configured. Add DID_API_KEY to .env.",
    };
  }

  const presenterId = request.avatarId;
  if (!presenterId) {
    return {
      success: false,
      status: "failed",
      provider: "did",
      error: "Avatar ID (presenter) is required for D-ID.",
    };
  }

  const useClonedVoice = !!request.useClonedVoice;
  const voiceId = request.voiceId || DEFAULT_VOICE;
  const bgType = request.backgroundType || "default";
  const bgValue = request.backgroundValue;
  const background =
    bgType === "image" && bgValue
      ? { type: "image" as const, url: bgValue }
      : { type: "color" as const, value: typeof bgValue === "string" && bgValue.startsWith("#") ? bgValue : "#ffffff" };

  const scriptPayload: { type: "text"; input: string; provider?: { type: "microsoft"; voice_id: string } } = {
    type: "text",
    input: request.script,
  };
  if (!useClonedVoice) {
    scriptPayload.provider = { type: "microsoft", voice_id: voiceId };
  }

  try {
    const res = await fetch(`${DID_BASE}/clips`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script: scriptPayload,
        presenter_id: presenterId,
        background,
        config: { stitch: true, result_format: "mp4" },
      }),
    });

    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; description?: string };
    const errMsg = body?.message ?? body?.description ?? `D-ID error ${res.status}`;

    if (!res.ok) {
      if (res.status === 401) {
        console.error("[D-ID] 401 Unauthorized. Check DID_API_KEY in .env. Use the exact key from D-ID dashboard (one string) or email:password.");
        return {
          success: false,
          status: "failed",
          provider: "did",
          error: "D-ID API key was rejected. Check DID_API_KEY in .env — use the key from your D-ID dashboard (one string, or email:password).",
        };
      }
      console.error("[D-ID] API error", res.status, body);
      throw new Error(errMsg);
    }

    const clipId = body.id;
    if (!clipId) throw new Error("D-ID did not return clip id");

    return {
      success: true,
      videoId: clipId,
      status: "processing",
      provider: "did",
      estimatedDuration: Math.ceil(request.script.length / 12),
    };
  } catch (error) {
    console.error("[D-ID] Generation error:", error);
    return {
      success: false,
      status: "failed",
      provider: "did",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check video status (D-ID Clips)
 */
export async function checkVideoStatus(
  videoId: string,
  _provider?: "did"
): Promise<VideoStatus> {
  const authHeader = getDIDAuthHeader();
  if (!authHeader) {
    return { id: videoId, status: "error", error: "D-ID API key not configured." };
  }

  try {
    const res = await fetch(`${DID_BASE}/clips/${videoId}`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) {
      return { id: videoId, status: "error", error: `D-ID error ${res.status}` };
    }
    const data = (await res.json()) as { status?: string; result_url?: string; error?: string };
    const s = data.status ?? "";
    const statusMap: Record<string, VideoStatus["status"]> = {
      created: "created",
      started: "started",
      done: "done",
      error: "error",
    };
    return {
      id: videoId,
      status: statusMap[s] ?? "started",
      resultUrl: data.result_url,
      error: data.error,
    };
  } catch (error) {
    return {
      id: videoId,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get available D-ID Clips actors (avatars)
 */
export async function getAvailableAvatars(_provider?: "did") {
  const authHeader = getDIDAuthHeader();
  if (!authHeader) return [];
  try {
    const res = await fetch(`${DID_BASE}/clips/actors`, {
      headers: { Authorization: authHeader },
      ...(typeof fetch !== "undefined" ? {} : {}),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { actors?: Array<{ id: string; presenter_name?: string; gender?: string; image_url?: string }> };
    const actors = data.actors ?? [];
    return actors.map((a) => ({
      id: a.id,
      name: a.presenter_name ?? a.id,
      gender: a.gender ?? "unknown",
      style: "default",
      image_url: a.image_url,
    }));
  } catch {
    return [];
  }
}

/**
 * Get available D-ID voices (Microsoft Neural)
 */
export function getAvailableVoices(_provider?: "did") {
  return [
    { id: "en-US-JennyNeural", name: "Jenny", language: "English (US)", gender: "female" },
    { id: "en-US-GuyNeural", name: "Guy", language: "English (US)", gender: "male" },
    { id: "en-US-AriaNeural", name: "Aria", language: "English (US)", gender: "female" },
    { id: "en-US-DavisNeural", name: "Davis", language: "English (US)", gender: "male" },
    { id: "en-GB-SoniaNeural", name: "Sonia", language: "English (UK)", gender: "female" },
    { id: "en-GB-RyanNeural", name: "Ryan", language: "English (UK)", gender: "male" },
  ];
}
