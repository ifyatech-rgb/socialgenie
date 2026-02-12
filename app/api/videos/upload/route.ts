import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Vercel serverless has a read-only filesystem (except /tmp). Writing to public/uploads will fail.
const isVercel = process.env.VERCEL === "1";

export async function POST(request: NextRequest) {
  try {
    if (isVercel) {
      return NextResponse.json(
        {
          error:
            "Video upload to server is not available on this deployment. Use Supabase Storage or S3 for production uploads.",
        },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid file type. Please upload a video file." }, { status: 400 });
    }

    // Validate file size (100MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "104857600");
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 100MB." }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "videos");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${user.id}-${timestamp}-${safeFilename}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create video record in database
    try {
      const video = await prisma.video.create({
        data: {
          userId: user.id,
          filename: filename,
          url: `/uploads/videos/${filename}`,
          status: "uploaded",
        },
      });

      return NextResponse.json({ 
        video, 
        success: true,
        message: "Video uploaded successfully!" 
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      // Clean up uploaded file if database save fails
      try {
        const fs = require("fs");
        if (existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
      return NextResponse.json(
        { error: "Failed to save video record to database" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload video" },
      { status: 500 }
    );
  }
}
