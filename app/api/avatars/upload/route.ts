import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const mainVideo = formData.get("mainVideo") as File | null;
    const consentVideo = formData.get("consentVideo") as File | null;
    const userName = (formData.get("userName") as string) ?? "";

    if (!mainVideo || !consentVideo) {
      return NextResponse.json(
        { error: "Both main video and consent video are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HEYGEN_API_KEY is not configured" },
        { status: 500 }
      );
    }

    console.log("[avatars/upload] Starting avatar creation for user:", session.user.id);

    const getUploadUrl = async (): Promise<{ upload_url: string; asset_id: string }> => {
      const res = await fetch("https://api.heygen.com/v1/asset.upload_url", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ type: "video" }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[avatars/upload] asset.upload_url error:", res.status, text);
        throw new Error(`HeyGen upload URL error: ${res.status} ${text}`);
      }

      const data = (await res.json()) as { data?: { upload_url?: string; asset_id?: string; video_id?: string } };
      const upload_url = data?.data?.upload_url;
      const asset_id = data?.data?.asset_id ?? data?.data?.video_id;
      if (!upload_url || !asset_id) {
        throw new Error("HeyGen did not return upload_url or asset_id");
      }
      return { upload_url, asset_id };
    };

    const uploadFile = async (url: string, file: File) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "video/mp4" },
        body: buffer,
      });
      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`Upload failed: ${putRes.status} ${text}`);
      }
    };

    const { upload_url: mainUploadUrl, asset_id: mainAssetId } = await getUploadUrl();
    await uploadFile(mainUploadUrl, mainVideo);
    console.log("[avatars/upload] Main video uploaded, asset_id:", mainAssetId);

    const { upload_url: consentUploadUrl, asset_id: consentAssetId } = await getUploadUrl();
    await uploadFile(consentUploadUrl, consentVideo);
    console.log("[avatars/upload] Consent video uploaded, asset_id:", consentAssetId);

    const createRes = await fetch("https://api.heygen.com/v2/avatars", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        avatar_name: `${userName || "User"} Avatar`,
        avatar_type: "UGC",
        video_id: mainAssetId,
        consent_video_id: consentAssetId,
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      console.error("[avatars/upload] Create avatar error:", createRes.status, text);
      return NextResponse.json(
        { error: `Failed to create avatar: ${text}` },
        { status: createRes.status }
      );
    }

    const createData = (await createRes.json()) as { data?: { avatar_id?: string } };
    const avatarId = createData?.data?.avatar_id;
    if (!avatarId) {
      return NextResponse.json(
        { error: "HeyGen did not return avatar_id" },
        { status: 500 }
      );
    }

    console.log("[avatars/upload] Avatar created:", avatarId);

    await prisma.avatar.create({
      data: {
        userId: session.user.id,
        name: `${userName || "Custom"} Avatar`,
        type: "ugc",
        status: "processing",
        heygenAvatarId: avatarId,
        videoId: mainAssetId,
        consentVideoId: consentAssetId,
      },
    });

    return NextResponse.json({
      success: true,
      avatarId,
      message: "Avatar is being processed. This usually takes 5-10 minutes.",
    });
  } catch (error) {
    console.error("[avatars/upload] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
