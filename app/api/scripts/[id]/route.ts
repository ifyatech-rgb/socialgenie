import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch a single script
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const script = await prisma.script.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        video: true,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json({ script });
  } catch (error: any) {
    console.error("Error fetching script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch script" },
      { status: 500 }
    );
  }
}

// PUT - Update a script
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if script exists and belongs to user
    const existingScript = await prisma.script.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { content, topic, platform, tone, length } = body;

    // Update the script
    const updatedScript = await prisma.script.update({
      where: { id: params.id },
      data: {
        ...(content !== undefined && { content }),
        ...(topic !== undefined && { topic }),
        ...(platform !== undefined && { platform }),
        ...(tone !== undefined && { tone }),
        ...(length !== undefined && { length }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      script: updatedScript 
    });
  } catch (error: any) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update script" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a script
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if script exists and belongs to user
    const existingScript = await prisma.script.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Delete associated video first if script was linked to one
    if (existingScript.videoId) {
      await prisma.video.deleteMany({
        where: { id: existingScript.videoId },
      });
    }

    // Delete the script
    await prisma.script.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Script deleted successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete script" },
      { status: 500 }
    );
  }
}
