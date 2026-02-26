import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/scripts/[id]/clear-video
 * Clears video generation data so script no longer appears in Projects.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailNorm = email.trim().toLowerCase();
    const user = await prisma.users.findUnique({ where: { email: emailNorm }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await context.params;
    const script = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });

    if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

    await prisma.scripts.update({
      where: { id },
      data: { video_status: null, generated_video_id: null, generated_video_url: null, video_error: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Clear video] Failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
