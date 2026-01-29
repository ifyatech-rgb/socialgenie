import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scripts = await prisma.script.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        topic: true,
        platform: true,
        tone: true,
        length: true,
        content: true,
        status: true,
        generatedVideoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
