/**
 * Emergency sync: Check HeyGen for all processing videos and update Scripts in DB.
 * Run: node scripts/sync-heygen-videos.js
 */
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function syncAllProcessingVideos() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚨 EMERGENCY HEYGEN VIDEO SYNC");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.log("❌ HEYGEN_API_KEY not found in .env");
    return;
  }

  try {
    const scripts = await prisma.script.findMany({
      where: {
        generatedVideoId: { not: null },
        videoStatus: { in: ["processing", "video_processing", "waiting", "pending"] },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (scripts.length === 0) {
      console.log("✅ No processing videos found. All synced!\n");
      return;
    }

    console.log(`Found ${scripts.length} processing video(s):\n`);

    for (const script of scripts) {
      const videoId = script.generatedVideoId;
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📹 Video ID: ${videoId}`);
      console.log(`   Script: ${script.topic?.substring(0, 50)}...`);
      console.log(`   DB Status: ${script.videoStatus}`);
      console.log(`   DB Progress: ${script.videoProgress ?? 0}%`);

      try {
        // HeyGen video status uses V1 endpoint (v2 returns 404)
        const response = await fetch(
          `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
          {
            method: "GET",
            headers: {
              "X-Api-Key": apiKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.log(`❌ HeyGen API Error: ${response.status} ${response.statusText}`);
          continue;
        }

        const json = await response.json();
        const d = json?.data;

        if (!d) {
          console.log("❌ Invalid response from HeyGen");
          continue;
        }

        const apiStatus = d.status || "unknown";
        console.log(`\n✅ HeyGen Response: status=${apiStatus}, video_url=${d.video_url ? "yes" : "no"}`);

        let progress = 0;
        let videoStatus = apiStatus;
        let status = script.status;

        if (apiStatus === "completed") {
          progress = 100;
          videoStatus = "completed";
          status = "video_ready";
          await prisma.script.update({
            where: { id: script.id },
            data: {
              generatedVideoUrl: d.video_url ?? script.generatedVideoUrl,
              videoStatus: "completed",
              videoProgress: 100,
              status: "video_ready",
              thumbnailUrl: d.thumbnail_url ?? script.thumbnailUrl,
              duration: d.duration ?? script.duration,
              videoError: null,
            },
          });
          console.log(`✅ Updated to COMPLETED (100%)`);
        } else if (apiStatus === "failed") {
          progress = 0;
          videoStatus = "failed";
          status = "error";
          await prisma.script.update({
            where: { id: script.id },
            data: {
              videoStatus: "failed",
              videoProgress: 0,
              videoError: d.error ?? "Video generation failed",
              status: "error",
            },
          });
          console.log(`❌ Marked as FAILED`);
        } else {
          const rawProgress = d.progress ?? d.percent;
          if (rawProgress != null && typeof rawProgress === "number") {
            progress = rawProgress < 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
            progress = Math.max(10, Math.min(99, progress));
          } else {
            progress = 50;
          }
          await prisma.script.update({
            where: { id: script.id },
            data: {
              videoStatus: apiStatus,
              videoProgress: progress,
            },
          });
          console.log(`✅ Updated to ${progress}% (${apiStatus})`);
        }

        console.log("");
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`❌ Error: ${err.message}\n`);
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SYNC COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllProcessingVideos();
