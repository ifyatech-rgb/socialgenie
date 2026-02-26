import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch a single script (schema: scripts, users)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });
    if (!row) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const script = {
      id: row.id,
      topic: row.topic,
      platform: row.platform,
      content: row.script_text ?? "",
      tone: row.content_style ?? undefined,
      length: row.estimated_duration ?? undefined,
      status: row.status ?? "draft",
      lifecycleStatus: row.lifecycle_status ?? "draft",
      cta: row.cta ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      video: null,
      generatedVideoUrl: row.generated_video_url ?? undefined,
      videoStatus: row.video_status ?? undefined,
    };
    return NextResponse.json({ script });
  } catch (error: unknown) {
    console.error("Error fetching script:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch script" },
      { status: 500 }
    );
  }
}

// PUT - Update a script (schema: scripts, users)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingScript = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });
    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, topic, platform, tone, length } = body;

    const updated = await prisma.scripts.update({
      where: { id },
      data: {
        ...(content !== undefined && { script_text: content }),
        ...(topic !== undefined && { topic }),
        ...(platform !== undefined && { platform }),
        ...(tone !== undefined && { content_style: tone }),
        ...(length !== undefined && { estimated_duration: length }),
        updated_at: new Date(),
      },
    });

    const script = {
      id: updated.id,
      topic: updated.topic,
      platform: updated.platform,
      content: updated.script_text ?? "",
      tone: updated.content_style ?? undefined,
      length: updated.estimated_duration ?? undefined,
      status: updated.status,
      lifecycleStatus: updated.lifecycle_status ?? "draft",
      createdAt: updated.created_at ? new Date(updated.created_at).toISOString() : null,
      updatedAt: updated.updated_at ? new Date(updated.updated_at).toISOString() : null,
    };
    return NextResponse.json({ success: true, script });
  } catch (error: unknown) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update script" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a script (schema: scripts, users)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingScript = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });
    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    await prisma.scripts.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Script deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete script" },
      { status: 500 }
    );
  }
}
