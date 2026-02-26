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

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      include: { subscription_events: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build subscription from user plan fields
    const plan = user.plan ?? "trial";
    const planDetails = getPlanDetails(plan);
    return NextResponse.json({
      subscription: {
        plan,
        status: user.plan_status ?? "trialing",
        plan_start_date: user.plan_start_date,
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

    if (!plan || !["trial", "starter"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Only starter ($19/month) is available." },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate subscription period (1 month from now)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Update user plan
    await prisma.users.update({
      where: { id: user.id },
      data: {
        plan,
        plan_status: "active",
        plan_start_date: now,
        updated_at: now,
      },
    });

    const planDetails = getPlanDetails(plan);

    return NextResponse.json({
      message: `Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`,
      subscription: {
        plan,
        status: "active",
        plan_start_date: now,
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
    trial: {
      name: "7-Day Free Trial",
      price: 0,
      videosPerMonth: 0,
      scriptsPerMonth: 10,
      voiceClones: 0,
      features: [
        "10 viral scripts",
        "All platforms (YouTube, TikTok, Instagram, Twitter)",
        "Viral score analysis",
        "Basic trending topics",
        "1 script variation per script",
      ],
    },
    starter: {
      name: "Starter Plan",
      price: 19,
      videosPerMonth: 0,
      scriptsPerMonth: 50,
      voiceClones: 0,
      features: [
        "50 viral scripts per month",
        "Multi-platform optimization",
        "Viral score predictions",
        "Real-time trending topics (24/7)",
        "Competitor analysis",
        "3 script variations per script",
        "Viral hook templates",
        "Export: TXT, PDF, Notion, Google Docs",
      ],
    },
  };

  return plans[plan] || plans.trial;
}
