import { NextRequest, NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackCreditsUsage } from "@/lib/tracking";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scriptId } = body as { scriptId: string };

    if (!scriptId) {
      return NextResponse.json({ error: "Missing scriptId" }, { status: 400 });
    }

    const script = await prisma.scripts.findUnique({
      where: { id: scriptId },
    });

    if (!script || script.user_id !== session.user.id) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (script.lifecycle_status === "finalized") {
      return NextResponse.json(
        { error: "Script already finalized" },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || (user.credits ?? 0) < 1) {
      return NextResponse.json(
        { error: "No credits remaining. Need 1 credit to finalize.", creditsRemaining: user?.credits ?? 0 },
        { status: 402 }
      );
    }

    const [updatedScript, updatedUser] = await prisma.$transaction([
      prisma.scripts.update({
        where: { id: scriptId },
        data: {
          lifecycle_status: "finalized",
          credit_charged: true,
          finalized_at: new Date(),
        },
      }),
      prisma.users.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 1 } },
        select: { credits: true },
      }),
    ]);

    trackCreditsUsage({
      user_id: session.user.id,
      amount: -1,
      reason: "script_finalized",
      reference_type: "script",
      reference_id: scriptId,
      balance_after: updatedUser.credits ?? 0,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Script finalized successfully",
      creditsRemaining: updatedUser.credits ?? 0,
      script: {
        id: updatedScript.id,
        lifecycleStatus: updatedScript.lifecycle_status,
      },
    });
  } catch (error) {
    console.error("[Finalize] Error:", error);
    return NextResponse.json(
      { error: "Failed to finalize script" },
      { status: 500 }
    );
  }
}
