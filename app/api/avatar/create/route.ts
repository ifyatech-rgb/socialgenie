import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadConsentVideo,
  getConsentStatus,
  createExpressAvatar,
  getExpressAvatarStatus,
} from "@/lib/did";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const POLL_CONSENT_MS = 3000;
const CONSENT_TIMEOUT_MS = 120000; // 2 min

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
}

/**
 * POST /api/avatar/create
 * Upload video → submit consent → create D-ID Express Avatar (face + voice clone).
 * Body: FormData with consentId (string), video (file). Video must be publicly accessible; user should read consent script in the video, then 1+ min of footage.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const consentId = formData.get("consentId") as string | null;
    const file = formData.get("video") as File | null;

    if (!consentId) {
      return NextResponse.json(
        { error: "Consent ID is required. Get one from GET /api/avatar/consent first." },
        { status: 400 }
      );
    }
    if (!file) {
      return NextResponse.json(
        { error: "Video file is required (field: video)" },
        { status: 400 }
      );
    }

    const fileType = file.type;
    if (!fileType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Please upload a video (MP4, MOV, WebM)" },
        { status: 400 }
      );
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be less than 100MB" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});

    const ext = file.name.split(".").pop() || "mp4";
    const filename = `avatar_${user.id}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const baseUrl = getBaseUrl(request);
    const videoUrl = `${baseUrl}/uploads/avatars/${filename}`;
    const avatarName = user.name || "Avatar";

    // 1) Upload consent video to D-ID (same video: user should read consent then 1+ min)
    const consentOk = await uploadConsentVideo(
      consentId,
      avatarName,
      videoUrl
    );
    if (!consentOk) {
      return NextResponse.json(
        {
          error:
            "Consent video could not be submitted. Ensure your video is publicly accessible and you read the consent script at the start.",
        },
        { status: 500 }
      );
    }

    // 2) Poll consent until done (or timeout)
    const consentDeadline = Date.now() + CONSENT_TIMEOUT_MS;
    let consentDone = false;
    while (Date.now() < consentDeadline) {
      const status = await getConsentStatus(consentId);
      if (status?.status === "done") {
        consentDone = true;
        break;
      }
      await new Promise((r) => setTimeout(r, POLL_CONSENT_MS));
    }
    if (!consentDone) {
      return NextResponse.json(
        {
          error:
            "Consent verification is taking longer than usual. Please try again with a video where you clearly read the consent script at the start.",
        },
        { status: 504 }
      );
    }

    // 3) Create Express Avatar with same video (1+ min of you speaking)
    const avatar = await createExpressAvatar(
      avatarName,
      consentId,
      videoUrl,
      { thumbnail_url: videoUrl }
    );
    if (!avatar) {
      return NextResponse.json(
        {
          error:
            "Avatar creation failed. Use a video of at least 1 minute where you speak clearly and your face is visible.",
        },
        { status: 500 }
      );
    }

    // 4) Save to TrainingVideo and set User to processing
    await prisma.trainingVideo.create({
      data: {
        userId: user.id,
        videoUrl,
        didAvatarId: avatar.id,
        processingStatus: "processing",
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatarId: avatar.id,
        avatarUrl: videoUrl,
        avatarStatus: "processing",
      },
    });

    prisma.activity
      .create({
        data: {
          userId: user.id,
          action: "avatar.creation_started",
          details: JSON.stringify({ didAvatarId: avatar.id }),
        },
      })
      .catch((err) => console.error("Failed to log activity:", err));

    return NextResponse.json({
      success: true,
      agentId: avatar.id,
      status: "processing",
      message:
        "Your avatar is being created. This usually takes 2–3 minutes. Keep this page open.",
    });
  } catch (error) {
    console.error("[Avatar] Create error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Avatar creation failed",
      },
      { status: 500 }
    );
  }
}
