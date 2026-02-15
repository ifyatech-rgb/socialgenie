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

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script || script.userId !== session.user.id) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (script.lifecycleStatus === "finalized") {
      return NextResponse.json(
        { error: "Script already finalized" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: "No credits remaining. Need 1 credit to finalize.", creditsRemaining: user?.credits ?? 0 },
        { status: 402 }
      );
    }

    const [updatedScript, updatedUser] = await prisma.$transaction([
      prisma.script.update({
        where: { id: scriptId },
        data: {
          lifecycleStatus: "finalized",
          creditCharged: true,
          finalizedAt: new Date(),
        },
      }),
      prisma.user.update({
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
      balance_after: updatedUser.credits,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Script finalized successfully",
      creditsRemaining: updatedUser.credits,
      script: {
        id: updatedScript.id,
        lifecycleStatus: updatedScript.lifecycleStatus,
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
