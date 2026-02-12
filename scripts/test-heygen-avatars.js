require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

async function testHeyGenAvatars() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TESTING HEYGEN AVATARS API");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    console.log("❌ HEYGEN_API_KEY not found in .env.local");
    console.log("   Add: HEYGEN_API_KEY=your-key-here");
    return;
  }

  console.log("✅ API Key found:", apiKey.substring(0, 25) + "...\n");

  try {
    console.log("📡 Calling HeyGen Avatars API...");
    const response = await fetch("https://api.heygen.com/v2/avatars", {
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

      if (response.status === 401) {
        console.log("\n⚠️  Your API key is INVALID or EXPIRED");
        console.log("   Get new key: https://app.heygen.com/settings/api-keys\n");
      }
      return;
    }

    const data = await response.json();
    console.log("✅ API Response received!\n");

    if (!data.data || !data.data.avatars) {
      console.log("❌ Unexpected response structure");
      console.log("Response:", JSON.stringify(data, null, 2));
      return;
    }

    const allAvatars = data.data.avatars;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 AVATAR STATISTICS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Total avatars:", allAvatars.length);

    const freePublic = allAvatars.filter((a) => a.is_public === true);
    const notPaid = allAvatars.filter((a) => !a.is_paid || a.is_paid === false);
    const both = allAvatars.filter(
      (a) => a.is_public === true && (!a.is_paid || a.is_paid === false)
    );

    console.log("Public avatars (is_public=true):", freePublic.length);
    console.log("Non-paid avatars (is_paid=false):", notPaid.length);
    console.log("Both public AND not paid:", both.length);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("SHOWING FIRST 10 AVATARS:\n");
    allAvatars.slice(0, 10).forEach((avatar, index) => {
      console.log(`${index + 1}. ${avatar.avatar_name}`);
      console.log(`   ID: ${avatar.avatar_id}`);
      console.log(`   Gender: ${avatar.gender || "N/A"}`);
      console.log(`   is_public: ${avatar.is_public}`);
      console.log(`   is_paid: ${avatar.is_paid}`);
      console.log(`   Preview Image: ${avatar.preview_image_url ? "Yes" : "No"}`);
      console.log(`   Preview Video: ${avatar.preview_video_url ? "Yes" : "No"}`);
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ TEST COMPLETE!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    console.log("Full error:", error);
  }
}

testHeyGenAvatars();
