require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

async function checkAvatarCategories() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏷️  CHECKING AVATAR CATEGORIES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    console.log("❌ HEYGEN_API_KEY not found");
    return;
  }

  try {
    const response = await fetch("https://api.heygen.com/v2/avatars", {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("❌ API error:", response.status, data?.message ?? data);
      return;
    }

    if (!data.data || !data.data.avatars) {
      console.log("❌ No avatars found");
      return;
    }

    const avatars = data.data.avatars;
    console.log(`Total avatars: ${avatars.length}\n`);

    const categories = {};
    const resolutions = {};

    avatars.forEach((avatar) => {
      const category = avatar.category || avatar.avatar_type || "unknown";
      const resolution = avatar.resolution || avatar.dimension;

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(avatar.avatar_name || avatar.avatar_id);

      if (resolution) {
        const w = resolution.width ?? 0;
        const h = resolution.height ?? 0;
        const resKey = `${w}x${h}`;
        if (!resolutions[resKey]) {
          resolutions[resKey] = [];
        }
        resolutions[resKey].push(avatar.avatar_name || avatar.avatar_id);
      }
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 AVATARS BY CATEGORY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    Object.entries(categories).forEach(([category, names]) => {
      console.log(`${category.toUpperCase()}: ${names.length} avatars`);
      names.slice(0, 5).forEach((name) => {
        console.log(`  - ${name}`);
      });
      if (names.length > 5) {
        console.log(`  ... and ${names.length - 5} more`);
      }
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📐 AVATARS BY RESOLUTION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    Object.entries(resolutions).forEach(([res, names]) => {
      console.log(`${res}: ${names.length} avatars`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💡 RECOMMENDATION");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const targetCategories = ["lifestyle", "ugc", "community"];
    let targetCount = 0;

    targetCategories.forEach((cat) => {
      const count = categories[cat]?.length || 0;
      targetCount += count;
      console.log(`${cat}: ${count} avatars`);
    });

    console.log(`\nTotal avatars in target categories: ${targetCount}`);
    console.log(`Percentage of total: ${((targetCount / avatars.length) * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkAvatarCategories();
