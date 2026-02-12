import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const TRIAL_CREDITS = 15 // 3 videos @ 5 credits each for trial
const MONTHLY_CREDITS = 50 // 10 videos @ 5 credits each for $19/month plan

export async function POST(request: NextRequest) {
  if (!stripeClient) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[Stripe webhook] Signature verification failed:", message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        let email =
          session.customer_email ||
          (session.customer_details as { email?: string } | null)?.email

        if (!email && customerId) {
          const customer = await stripeClient!.customers.retrieve(customerId)
          email = (customer as Stripe.Customer).email ?? undefined
        }

        if (!email) {
          console.error("[Stripe webhook] checkout.session.completed: no email")
          break
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { subscriptions: true },
        })

        if (!user) {
          console.error("[Stripe webhook] User not found for email:", email)
          break
        }

        const stripeSubscription = await stripeClient!.subscriptions.retrieve(subscriptionId)
        const trialEnd = stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null
        const now = new Date()
        const periodEnd = trialEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        // Get payment method fingerprint for duplicate-card detection
        let paymentMethodFingerprint: string | null = null
        let duplicatePaymentMethod = false
        const defaultPmId =
          stripeSubscription.default_payment_method as string | null ||
          (typeof stripeSubscription.default_source === "string" ? stripeSubscription.default_source : null)
        if (defaultPmId) {
          try {
            const pm = await stripeClient!.paymentMethods.retrieve(defaultPmId)
            if (pm.card?.fingerprint) {
              paymentMethodFingerprint = pm.card.fingerprint
              const other = await prisma.subscription.findFirst({
                where: {
                  paymentMethodFingerprint: pm.card.fingerprint,
                  userId: { not: user.id },
                },
              })
              if (other) duplicatePaymentMethod = true
            }
          } catch (e) {
            console.warn("[Stripe webhook] Could not retrieve payment method fingerprint:", e)
          }
        }

        await prisma.$transaction([
          prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan: "starter",
              status: "trialing",
              trialEndsAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethodFingerprint: paymentMethodFingerprint ?? undefined,
              duplicatePaymentMethod,
              updatedAt: now,
            },
            create: {
              userId: user.id,
              plan: "starter",
              status: "trialing",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              trialEndsAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              paymentMethodFingerprint: paymentMethodFingerprint ?? undefined,
              duplicatePaymentMethod,
            },
          }),
          // Only add credits if this card is not already used by another account
          ...(duplicatePaymentMethod
            ? []
            : [
                prisma.user.update({
                  where: { id: user.id },
                  data: {
                    credits: TRIAL_CREDITS,
                    plan: "starter",
                  },
                }),
              ]),
        ])

        if (duplicatePaymentMethod) {
          console.log("[Stripe webhook] checkout.session.completed: duplicate payment method for", email)
        } else {
          console.log("[Stripe webhook] checkout.session.completed: subscription saved for", email)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const subId = subscription.id

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        })

        if (!existing) break

        const status =
          subscription.status === "active"
            ? subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)
              ? "trialing"
              : "active"
            : subscription.status === "canceled" || subscription.status === "unpaid"
              ? "cancelled"
              : subscription.status === "past_due"
                ? "past_due"
                : existing.status

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date(),
          },
        })

        console.log("[Stripe webhook] customer.subscription.updated:", subId)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subId = subscription.id

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        })

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "cancelled", updatedAt: new Date() },
          })
          console.log("[Stripe webhook] customer.subscription.deleted:", subId)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null

        if (!subscriptionId) break

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          include: { user: true },
        })

        if (existing) {
          await prisma.user.update({
            where: { id: existing.userId },
            data: {
              credits: { increment: MONTHLY_CREDITS },
            },
          })
          console.log("[Stripe webhook] invoice.payment_succeeded: added credits for user", existing.userId)
        }
        break
      }

      default:
        // Unhandled event type
        break
    }
  } catch (error) {
    console.error("[Stripe webhook] Handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
