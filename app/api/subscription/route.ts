import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If no subscription exists, return free plan
    if (!user.subscriptions) {
      return NextResponse.json({
        subscription: {
          plan: "free",
          status: "active",
          videosPerMonth: 5,
          scriptsPerMonth: 10,
        },
      });
    }

    // Get plan details
    const planDetails = getPlanDetails(user.subscriptions.plan);

    return NextResponse.json({
      subscription: {
        ...user.subscriptions,
        ...planDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST - Update subscription (upgrade/downgrade)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !["free", "starter", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose from: free, starter, pro, enterprise" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate subscription period (1 month from now)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Upsert subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: plan,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
      create: {
        userId: user.id,
        plan: plan,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    const planDetails = getPlanDetails(plan);

    return NextResponse.json({
      message: `Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`,
      subscription: {
        ...subscription,
        ...planDetails,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

function getPlanDetails(plan: string) {
  const plans: Record<string, { 
    name: string; 
    price: number; 
    videosPerMonth: number; 
    scriptsPerMonth: number;
    voiceClones: number;
    features: string[];
  }> = {
    free: {
      name: "Free Trial",
      price: 0,
      videosPerMonth: 5,
      scriptsPerMonth: 10,
      voiceClones: 1,
      features: [
        "5 videos FREE",
        "Basic AI script generation",
        "1 voice clone",
        "Standard video quality",
        "Watermarked videos",
        "Email support",
      ],
    },
    starter: {
      name: "Starter",
      price: 39,
      videosPerMonth: 20,
      scriptsPerMonth: 50,
      voiceClones: 3,
      features: [
        "20 videos per month",
        "Advanced AI scripts",
        "Full lip-sync function",
        "3 voice clones",
        "No watermark",
        "HD video quality",
        "Priority email support",
      ],
    },
    pro: {
      name: "Pro",
      price: 99,
      videosPerMonth: 50,
      scriptsPerMonth: 150,
      voiceClones: 10,
      features: [
        "50 videos per month",
        "Everything in Starter +",
        "Full body movement & gestures",
        "Advanced lip-sync",
        "10 voice clones",
        "Custom backgrounds",
        "Multiple languages",
        "API access",
        "Priority support (24/7)",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: 299,
      videosPerMonth: 150,
      scriptsPerMonth: 500,
      voiceClones: -1, // Unlimited
      features: [
        "150 videos per month",
        "Everything in Pro +",
        "Advanced body animations",
        "Custom avatar creation",
        "Multi-scene videos",
        "Team collaboration (5 seats)",
        "White-label branding",
        "Unlimited voice clones",
        "Custom integrations",
        "Dedicated account manager",
        "Training & onboarding",
      ],
    },
  };

  return plans[plan] || plans.free;
}
