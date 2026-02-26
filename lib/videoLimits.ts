/**
 * Video length limits, script limits, and HeyGen cost tracking.
 * Aligns with 2-plan structure: Creator (1 custom avatar, 90s), Professional (5 custom avatars, 120s).
 */

/** Any-length pricing: no hard cap for trial/creator/professional; 1h cap for display. */
const NO_LIMIT_SECONDS = 3600;

export const VIDEO_LENGTH_LIMITS: Record<
  string,
  { maxSeconds: number; maxMinutes: number; displayName: string; credits: number; customAvatars?: number }
> = {
  trial: {
    maxSeconds: NO_LIMIT_SECONDS,
    maxMinutes: 60,
    displayName: "Free Trial",
    credits: 10,
    customAvatars: 0,
  },
  creator: {
    maxSeconds: NO_LIMIT_SECONDS,
    maxMinutes: 60,
    displayName: "Creator",
    credits: 20,
    customAvatars: 1,
  },
  professional: {
    maxSeconds: NO_LIMIT_SECONDS,
    maxMinutes: 60,
    displayName: "Professional",
    credits: 50,
    customAvatars: 5,
  },
  enterprise: {
    maxSeconds: 300,
    maxMinutes: 5,
    displayName: "Enterprise",
    credits: 150,
    customAvatars: 999,
  },
};

export const SCRIPT_LIMITS = {
  maxCharacters: 5000,
  recommendedCharacters: 1000,

  estimateDuration(text: string): number {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 150;
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60);
  },
};

export const FILE_LIMITS = {
  video: {
    maxSize: 100 * 1024 * 1024,
    formats: ["video/mp4", "video/quicktime"],
    acceptString: "video/mp4,video/quicktime",
  },
  image: {
    maxSize: 10 * 1024 * 1024,
    formats: ["image/jpeg", "image/png"],
    acceptString: "image/jpeg,image/png",
  },
};

export function validateVideoLength(
  durationSeconds: number,
  userPlan: string
): { valid: boolean; message?: string } {
  const planKey = (userPlan ?? "trial").toLowerCase();
  const limit = VIDEO_LENGTH_LIMITS[planKey] ?? VIDEO_LENGTH_LIMITS.trial;
  if (durationSeconds > limit.maxSeconds) {
    return {
      valid: false,
      message: `Video too long. Maximum ${limit.maxMinutes} minute(s) for ${limit.displayName} plan.`,
    };
  }
  return { valid: true };
}

export function validateScript(script: string): {
  valid: boolean;
  message?: string;
  estimatedDuration?: number;
  estimatedMinutes?: number;
} {
  if (!script || script.trim().length === 0) {
    return { valid: false, message: "Script cannot be empty" };
  }
  if (script.length > SCRIPT_LIMITS.maxCharacters) {
    return {
      valid: false,
      message: `Script too long. Maximum ${SCRIPT_LIMITS.maxCharacters} characters.`,
    };
  }
  const estimatedDuration = SCRIPT_LIMITS.estimateDuration(script);
  return {
    valid: true,
    estimatedDuration,
    estimatedMinutes: Math.ceil(estimatedDuration / 60),
  };
}

/** Credits by duration: 0–60s=1, 61–120s=2, 121–180s=3, 181–240s=4, 241–300s=5, 5+ min=ceil(sec/60). */
export function calculateVideoCredits(durationSeconds: number): number {
  if (durationSeconds <= 60) return 1;
  if (durationSeconds <= 120) return 2;
  if (durationSeconds <= 180) return 3;
  if (durationSeconds <= 240) return 4;
  if (durationSeconds <= 300) return 5;
  return Math.ceil(durationSeconds / 60);
}

export const HEYGEN_COSTS = {
  publicAvatar_engineIII: 1.0,
  customAvatar_engineIII: 2.0,
  photoAvatar_engineIII: 1.0,
  photoAvatarCreation: 7.0,
};

export function calculateHeyGenCost(durationSeconds: number, avatarType: string): number {
  const minutes = Math.ceil(durationSeconds / 60);
  const costPerMinute =
    (avatarType ?? "public").toLowerCase() === "custom"
      ? HEYGEN_COSTS.customAvatar_engineIII
      : HEYGEN_COSTS.publicAvatar_engineIII;
  return minutes * costPerMinute;
}

export function canCreateCustomAvatar(
  userPlan: string,
  existingAvatarsCount: number
): {
  canCreate: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
} {
  const planKey = (userPlan ?? "trial").toLowerCase();
  const limits = VIDEO_LENGTH_LIMITS[planKey] ?? VIDEO_LENGTH_LIMITS.trial;
  const customAvatars = limits.customAvatars ?? 1;
  if (existingAvatarsCount >= customAvatars) {
    return {
      canCreate: false,
      message: `Maximum ${customAvatars} custom avatar(s) for ${limits.displayName} plan.`,
      limit: customAvatars,
    };
  }
  return {
    canCreate: true,
    remaining: customAvatars - existingAvatarsCount,
    limit: customAvatars,
  };
}
