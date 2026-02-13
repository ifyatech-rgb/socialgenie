import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";
import { prisma } from "@/lib/prisma";
import { syncVideoToSupabase } from "@/lib/supabase-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const videoId = new URL(request.url).searchParams.get("videoId")?.trim();
    if (!videoId) return NextResponse.json({ error: "Video ID required" }, { status: 400 });

    console.log(`[HeyGen Status] Checking videoId=${videoId}`);
    const heygen = getHeyGenClient();
    const status = await heygen.getVideoStatus(videoId);
    const normalizedStatus = (status.status ?? "").toLowerCase();
    const isCompleted = normalizedStatus === "completed" || normalizedStatus === "complete";
    const isFailed = normalizedStatus === "failed" || normalizedStatus === "error";
    console.log(`[HeyGen Status] HeyGen says: status=${status.status} progress=${status.progress}% videoUrl=${status.video_url ? "yes" : "no"}`);

    try {
      const generatedVideo = await prisma.generatedVideo.findFirst({ where: { generatedVideoId: videoId } });
      if (generatedVideo) {
      if (isCompleted && status.video_url) {
        await prisma.generatedVideo.update({
          where: { id: generatedVideo.id },
          data: {
            generatedVideoUrl: status.video_url,
            videoStatus: "completed",
            videoProgress: 100,
            thumbnailUrl: status.thumbnail_url ?? undefined,
            duration: status.duration ?? undefined,
          },
        });
        syncVideoToSupabase({
          id: videoId,
          user_id: generatedVideo.userId,
          script_id: generatedVideo.scriptId,
          url: status.video_url,
          thumbnail_url: status.thumbnail_url ?? undefined,
          duration: status.duration ?? undefined,
          status: "uploaded",
        }).catch(() => {});
      } else if (isFailed && status.error) {
        await prisma.generatedVideo.update({
          where: { id: generatedVideo.id },
          data: {
            videoStatus: "failed",
            videoProgress: 0,
            videoError: status.error,
          },
        });
      } else {
        await prisma.generatedVideo.update({
          where: { id: generatedVideo.id },
          data: {
            videoStatus: status.status,
            videoProgress: status.progress ?? (status.status === "processing" ? 50 : 10),
          },
        });
      }
      } else {
        const script = await prisma.script.findFirst({ where: { generatedVideoId: videoId } });
        if (script) {
          if (isCompleted && status.video_url) {
            await prisma.script.update({
            where: { id: script.id },
            data: {
              generatedVideoUrl: status.video_url,
              videoStatus: "completed",
              videoProgress: 100,
              status: "video_ready",
              thumbnailUrl: status.thumbnail_url ?? undefined,
              duration: status.duration ?? undefined,
            },
          });
          syncVideoToSupabase({
            id: videoId,
            user_id: script.userId,
            script_id: script.id,
            url: status.video_url,
            thumbnail_url: status.thumbnail_url ?? undefined,
            duration: status.duration ?? undefined,
            status: "uploaded",
          }).catch(() => {});
        } else if (isFailed && status.error) {
            await prisma.script.update({
              where: { id: script.id },
              data: {
                videoStatus: "failed",
                videoProgress: 0,
                videoError: status.error,
                status: "error",
              },
            });
          } else {
            await prisma.script.update({
              where: { id: script.id },
              data: {
                videoStatus: isCompleted ? "completed" : status.status,
                videoProgress: status.progress ?? (isCompleted ? 100 : 50),
              },
            });
          }
        }
      }
    } catch (dbError) {
      console.error("[HeyGen Status] DB update failed (returning HeyGen status anyway):", dbError);
    }

    return NextResponse.json({
      success: true,
      status: isCompleted ? "completed" : isFailed ? "failed" : status.status,
      videoUrl: status.video_url,
      video_url: status.video_url,
      thumbnail_url: status.thumbnail_url,
      progress: isCompleted ? 100 : status.progress,
      error: status.error,
      duration: status.duration,
    });
  } catch (error) {
    console.error("[HeyGen Status] Failed:", error);
    return NextResponse.json({ error: "status_check_failed", message: String(error) }, { status: 500 });
  }
}
