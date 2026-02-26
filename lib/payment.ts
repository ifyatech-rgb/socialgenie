/**
 * Payment status and credit/trial checks for gating access.
 * Free trial users (trialing) get full access; upgrade prompt only when credits = 0 or trial expired.
 */

import { prisma } from "@/lib/prisma";

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  TRIAL: "trial",
  TRIALING: "trialing",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Returns true if user is allowed to access the app (paid, trial, or trialing). */
export function canAccessApp(status: string | null | undefined): boolean {
  return (
    status === PAYMENT_STATUS.PAID ||
    status === PAYMENT_STATUS.TRIAL ||
    status === PAYMENT_STATUS.TRIALING
  );
}

const TRIAL_DAYS = 14;

export function getTrialStatus(createdAt: Date | string): {
  isExpired: boolean;
  daysRemaining: number;
} {
  const signup = new Date(createdAt).getTime();
  const now = Date.now();
  const daysSince = Math.floor((now - signup) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, TRIAL_DAYS - daysSince);
  return { isExpired: daysSince > TRIAL_DAYS, daysRemaining };
}

export type CanUseFeatureResult =
  | { allowed: true }
  | { allowed: false; code: "out_of_credits" | "trial_expired"; error: string };

/**
 * Use for feature APIs: allow if user has credits and (not trial or trial not expired).
 * Replaces payment wall with credit + trial expiry gate.
 */
export function canUseFeature(user: {
  plan: string | null;
  videoCredits?: number | null;
  credits?: number | null;
  createdAt: Date | string;
}): CanUseFeatureResult {
  const credits = user.videoCredits ?? user.credits ?? 0;
  if (credits <= 0) {
    return {
      allowed: false,
      code: "out_of_credits",
      error: "No credits remaining. Upgrade to continue creating.",
    };
  }
  if (user.plan === "trial") {
    const { isExpired } = getTrialStatus(user.createdAt);
    if (isExpired) {
      return {
        allowed: false,
        code: "trial_expired",
        error: "Free trial expired. Upgrade to continue creating.",
      };
    }
  }
  return { allowed: true };
}

/**
 * Get payment_status for a user by id. Returns null if user not found.
 */
export async function getPaymentStatusByUserId(userId: string): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { payment_status: true },
  });
  return user?.payment_status ?? null;
}

/**
 * Get payment_status for a user by email. Returns null if user not found.
 */
export async function getPaymentStatusByEmail(email: string): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
    select: { payment_status: true },
  });
  return user?.payment_status ?? null;
}
