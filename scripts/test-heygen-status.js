require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

async function testHeyGenStatus() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TESTING HEYGEN VIDEO STATUS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.log("❌ HEYGEN_API_KEY not found");
    return;
  }

  const videoId = process.argv[2];
  if (!videoId) {
    console.log("❌ Please provide a video ID");
    console.log("Usage: node scripts/test-heygen-status.js YOUR_VIDEO_ID");
    console.log("\nExample: node scripts/test-heygen-status.js abc123def456\n");
    return;
  }

  console.log("Video ID:", videoId);
  console.log("API Key:", apiKey.substring(0, 25) + "...\n");

  try {
    console.log("📡 Calling HeyGen Video Status API (v1)...\n");

    // HeyGen video status: v1 endpoint works for both v1 and v2-created videos
    const url = `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log("Response Status:", response.status, response.statusText, "\n");

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ API ERROR:", errorText);
      return;
    }

    const data = await response.json();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 FULL HEYGEN RESPONSE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(data, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (data.data) {
      const d = data.data;
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📈 EXTRACTED STATUS INFO:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Status:", d.status);
      console.log("Progress:", d.progress ?? "N/A");
      console.log("Percent:", d.percent ?? "N/A");
      console.log("Video URL:", d.video_url ?? "Not ready");
      console.log("Thumbnail:", d.thumbnail_url ?? "N/A");
      console.log("Duration:", d.duration ?? "N/A");
      console.log("Error:", d.error ?? "None");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      let calculatedProgress = 0;
      if (d.status === "pending") {
        calculatedProgress = 5;
      } else if (d.status === "processing" || d.status === "waiting") {
        const rawProgress = d.progress ?? d.percent ?? 0.5;
        calculatedProgress =
          typeof rawProgress === "number" && rawProgress < 1
            ? Math.round(rawProgress * 100)
            : Math.round(rawProgress);
        calculatedProgress = Math.max(10, Math.min(99, calculatedProgress));
      } else if (d.status === "completed") {
        calculatedProgress = 100;
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 PROGRESS CALCULATION:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Raw progress from API:", d.progress ?? d.percent ?? "N/A");
      console.log("Calculated progress:", calculatedProgress + "%");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }

    console.log("✅ TEST COMPLETE!\n");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  }
}

testHeyGenStatus();
