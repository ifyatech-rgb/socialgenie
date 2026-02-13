/**
 * Payment status check for gating access.
 * Use in API routes and server components.
 */

import { prisma } from "@/lib/prisma";

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  TRIAL: "trial",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Returns true if user is allowed to access paid features (dashboard, generate, etc.) */
export function canAccessApp(status: string | null | undefined): boolean {
  return status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.TRIAL;
}

/**
 * Get payment_status for a user by id. Returns null if user not found.
 */
export async function getPaymentStatusByUserId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { payment_status: true },
  });
  return user?.payment_status ?? null;
}

/**
 * Get payment_status for a user by email. Returns null if user not found.
 */
export async function getPaymentStatusByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { payment_status: true },
  });
  return user?.payment_status ?? null;
}
