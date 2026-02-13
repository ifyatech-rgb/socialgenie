import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const TRIAL_DAYS = 7
const TRIAL_VIDEOS = 3

/**
 * POST /api/stripe/checkout
 * Create Stripe Customer (if needed) and Checkout Session for subscription with 7-day trial.
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Add your card in Settings to start your 7-day free trial.",
        },
        { status: 503 }
      )
    }

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe price not configured. Add your card in Settings to start your 7-day free trial.",
        },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    const email = (body.email as string)?.trim() || session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    const currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          include: { subscriptions: true },
        })
      : null

    // Duplicate prevention: email must not be registered to a different user
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { subscriptions: true },
    })

    if (existingUserByEmail && (!currentUser || existingUserByEmail.id !== currentUser.id)) {
      return NextResponse.json(
        {
          error: "This email is already registered. Please sign in instead.",
          code: "EMAIL_EXISTS",
        },
        { status: 400 }
      )
    }

    // Before creating Stripe customer: if Stripe already has this email, ensure that customer belongs to current user
    const stripeCustomers = await stripe.customers.list({ email: normalizedEmail, limit: 1 })
    if (stripeCustomers.data.length > 0) {
      const existingStripeCustomerId = stripeCustomers.data[0].id
      const subscriptionWithCustomer = await prisma.subscription.findFirst({
        where: { stripeCustomerId: existingStripeCustomerId },
        include: { user: true },
      })
      if (subscriptionWithCustomer && (!currentUser || subscriptionWithCustomer.userId !== currentUser.id)) {
        return NextResponse.json(
          {
            error: "This email is already registered. Please sign in instead.",
            code: "EMAIL_EXISTS",
          },
          { status: 400 }
        )
      }
    }

    // Use request origin when available (works on live domain); fallback to env
    const host = request.headers.get("host")
    const proto = request.headers.get("x-forwarded-proto") || "https"
    const requestOrigin = host ? `${proto}://${host}` : null
    const baseUrl = requestOrigin || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const origin = baseUrl.replace(/\/$/, "")

    // Find or create Stripe Customer (link to Prisma User if logged in)
    let customerId: string | undefined
    const user = currentUser ?? existingUserByEmail

    if (user?.subscriptions?.stripeCustomerId) {
      customerId = user.subscriptions.stripeCustomerId
    } else if (stripeCustomers.data.length > 0) {
      customerId = stripeCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({ email: normalizedEmail })
      customerId = customer.id
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
      },
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/checkout-required`,
      metadata: {
        trial_days: String(TRIAL_DAYS),
        trial_videos: String(TRIAL_VIDEOS),
        ...(user?.id && { userId: user.id }),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[Stripe checkout]", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 }
    )
  }
}
