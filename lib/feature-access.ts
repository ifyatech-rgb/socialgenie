/**
 * Feature access checks for single $19/month plan with 7-day trial
 */

import {
  getUserPlanLimits,
  canCreateVideo,
  getMaxVideoDuration,
  hasWatermark,
} from "@/config/pricing"
import type { PricingUser } from "@/config/pricing"

export interface VideoCreationResult {
  allowed: boolean
  reason?: string
  maxDuration?: number
}

export function checkVideoCreationAccess(user: PricingUser): VideoCreationResult {
  if (!canCreateVideo(user)) {
    const isPaid = user.isPaid
    return {
      allowed: false,
      reason: isPaid
        ? "You've used all 10 videos this month. Resets on your next billing date."
        : "You've used all 3 trial videos. Upgrade to $19/month for 10 videos/month.",
    }
  }
  return { allowed: true }
}

export function checkVideoDuration(
  user: PricingUser,
  requestedDuration: number
): VideoCreationResult {
  const maxDuration = getMaxVideoDuration(user)
  if (requestedDuration > maxDuration) {
    const isPaid = user.isPaid
    return {
      allowed: false,
      reason: isPaid
        ? `Videos are limited to ${maxDuration / 60} minutes on your plan.`
        : "Trial videos are limited to 1 minute. Upgrade to $19/month for 2-minute videos.",
      maxDuration,
    }
  }
  return { allowed: true, maxDuration }
}

export function applyWatermark(user: PricingUser): boolean {
  return hasWatermark(user)
}

export function getVideoQualityOptions(user: PricingUser): string[] {
  const limits = getUserPlanLimits(user)
  if (limits.videoQuality === "1080p") {
    return ["1080p", "720p", "480p"]
  }
  return ["720p", "480p"]
}
