/**
 * Single $19/month plan with 7-day trial (credit card required)
 */

export const PRICING_CONFIG = {
  TRIAL: {
    name: "7-Day Free Trial",
    duration: 7,
    price: 0,
    requireCreditCard: true,

    features: {
      videosAllowed: 3,
      maxVideoDuration: 60, // 1 minute
      videoQuality: "720p",
      hasWatermark: true,
      processingSpeed: "standard",
      customAvatars: 1,
      stockAvatars: 500,
      basicScripts: -1, // unlimited basic
      researchedScripts: 5, // 5 researched viral scripts
      scriptsPerMonth: 5, // alias for researchedScripts
      viralScoreAnalysis: true,
      languages: 30,
      exportFormats: ["mp4", "mov"],
    },

    displayFeatures: {
      videoGeneration: [
        "Create 3 videos (up to 1 min each)",
        "Access 500+ stock avatars",
        "Generate unlimited scripts",
        "Export in 720p",
        "Watermark included",
      ],
      featuresYouLove: [
        "1 Custom Video Avatar",
        "500+ Stock Video Avatars",
        "5 Researched viral script generation",
        "30+ languages",
        "Share & download videos",
      ],
    },
  },

  PAID: {
    name: "Starter Plan",
    price: 19,
    currency: "USD",
    billing: "month",

    features: {
      videosPerMonth: 10,
      maxVideoDuration: 120, // 2 minutes
      videoQuality: "1080p",
      hasWatermark: false,
      processingSpeed: "standard",
      customAvatars: 1,
      stockAvatars: 700,
      basicScripts: -1, // unlimited basic
      researchedScripts: -1, // unlimited researched viral scripts
      scriptsPerMonth: -1, // alias
      viralScoreAnalysis: true,
      trendAnalysis: true,
      languages: 30,
      exportFormats: ["mp4", "mov", "webm"],
    },

    displayFeatures: {
      videoGeneration: [
        "10 videos per month",
        "Videos up to 2 mins",
        "1080p video export",
        "Standard video processing",
        "No watermark",
      ],
      featuresYouLove: [
        "1 Custom Video Avatar",
        "700+ Stock Video Avatars",
        "Unlimited Researched viral script generation",
        "30+ languages",
        "Share & download videos",
      ],
    },
  },
} as const;

export interface PricingUser {
  trialEndDate?: string | null;
  trialEndsAt?: string | null;
  videosUsedThisMonth?: number;
  scriptsUsedThisMonth?: number;
  customAvatarsCreated?: number;
  hasCustomAvatar?: boolean;
  isPaid?: boolean;
  nextBillingDate?: string | null;
  lastFourDigits?: string;
}

export function getUserPlanLimits(user: PricingUser) {
  const trialEnd = user.trialEndDate || user.trialEndsAt;
  const isTrialActive =
    trialEnd && new Date() < new Date(trialEnd);
  return isTrialActive ? PRICING_CONFIG.TRIAL.features : PRICING_CONFIG.PAID.features;
}

export function canCreateVideo(user: PricingUser): boolean {
  const limits = getUserPlanLimits(user);
  const total =
    "videosPerMonth" in limits ? limits.videosPerMonth : limits.videosAllowed ?? 0;
  const used = user.videosUsedThisMonth ?? 0;
  return used < total;
}

export function getVideosRemaining(user: PricingUser): number {
  const limits = getUserPlanLimits(user);
  const total =
    "videosPerMonth" in limits ? limits.videosPerMonth : limits.videosAllowed ?? 0;
  const used = user.videosUsedThisMonth ?? 0;
  return Math.max(0, total - used);
}

export function canCreateCustomAvatar(user: PricingUser): boolean {
  const limits = getUserPlanLimits(user);
  const created = user.customAvatarsCreated ?? (user.hasCustomAvatar ? 1 : 0);
  return created < limits.customAvatars;
}

export function getScriptsRemaining(user: PricingUser): number | "Unlimited" {
  const limits = getUserPlanLimits(user);
  if (limits.scriptsPerMonth === -1) return "Unlimited";
  const used = user.scriptsUsedThisMonth ?? 0;
  return Math.max(0, limits.scriptsPerMonth - used);
}

export function getMaxVideoDuration(user: PricingUser): number {
  const limits = getUserPlanLimits(user);
  return limits.maxVideoDuration;
}

export function getVideoQuality(user: PricingUser): string {
  const limits = getUserPlanLimits(user);
  return limits.videoQuality;
}

export function hasWatermark(user: PricingUser): boolean {
  const limits = getUserPlanLimits(user);
  return limits.hasWatermark;
}

export function getDaysLeftInTrial(user: PricingUser): number {
  const trialEnd = user.trialEndDate || user.trialEndsAt;
  if (!trialEnd) return 0;
  const endDate = new Date(trialEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}
