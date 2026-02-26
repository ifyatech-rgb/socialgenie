/**
 * White-label video API errors. Never expose HeyGen, Claude, Anthropic, or other provider names to users.
 */

export const USER_FRIENDLY_VIDEO_ERRORS = {
  API_KEY_INVALID: "Video service is temporarily unavailable. Please try again later.",
  QUOTA_EXCEEDED: "Video generation limit reached. Please contact support.",
  INVALID_AVATAR: "Selected avatar is not available. Please choose another.",
  SCRIPT_TOO_LONG: "Your script is too long. Please shorten it and try again.",
  NETWORK_ERROR: "Connection error. Please check your internet and try again.",
  GENERATION_FAILED: "Video generation failed. Your credits have been refunded.",
  UNKNOWN_ERROR: "Something went wrong. Please try again or contact support.",
} as const;

export function sanitizeVideoError(error: unknown): string {
  const errorStr = (error instanceof Error ? error.message : String(error)).toLowerCase();

  if (errorStr.includes("heygen") || errorStr.includes("claude") || errorStr.includes("anthropic")) {
    return USER_FRIENDLY_VIDEO_ERRORS.UNKNOWN_ERROR;
  }
  if (errorStr.includes("quota") || errorStr.includes("limit")) {
    return USER_FRIENDLY_VIDEO_ERRORS.QUOTA_EXCEEDED;
  }
  if (errorStr.includes("api key") || errorStr.includes("authentication")) {
    return USER_FRIENDLY_VIDEO_ERRORS.API_KEY_INVALID;
  }
  // Do NOT replace errors that mention "avatar" with a generic message — show the real
  // error so we can fix root cause (e.g. voice_id, avatar_id format, API key).
  // if (errorStr.includes("avatar")) return USER_FRIENDLY_VIDEO_ERRORS.INVALID_AVATAR;
  if (errorStr.includes("too long") || errorStr.includes("length")) {
    return USER_FRIENDLY_VIDEO_ERRORS.SCRIPT_TOO_LONG;
  }
  if (errorStr.includes("network") || errorStr.includes("timeout")) {
    return USER_FRIENDLY_VIDEO_ERRORS.NETWORK_ERROR;
  }

  return USER_FRIENDLY_VIDEO_ERRORS.UNKNOWN_ERROR;
}
