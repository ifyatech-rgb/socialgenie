import { NextRequest, NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContent, getDefaultModel, handleClaudeError } from "@/lib/claude";
import { cleanScript } from "@/lib/scriptCleaner";
import { canUseGenie } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scriptId, userMessage, currentScript } = body as {
      scriptId: string;
      userMessage: string;
      currentScript: string;
    };

    if (!scriptId || !userMessage || !currentScript) {
      return NextResponse.json(
        { error: "Missing scriptId, userMessage, or currentScript" },
        { status: 400 }
      );
    }

    const [script, user] = await Promise.all([
      prisma.scripts.findUnique({ where: { id: scriptId } }),
      prisma.users.findUnique({
        where: { id: session.user.id },
        select: { id: true, genie_edits: true, genie_edits_used_this_month: true },
      }),
    ]);

    if (!script || script.user_id !== session.user.id) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (script.lifecycle_status === "finalized") {
      return NextResponse.json(
        { error: "This script is finalized. Create a new draft to make changes." },
        { status: 400 }
      );
    }

    if (!user || !canUseGenie({ genieEdits: user.genie_edits })) {
      return NextResponse.json(
        {
          error: "No Genie edits remaining",
          code: "genie_limit_reached",
          genieEdits: user?.genie_edits ?? 0,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const chatHistory = (script.chat_history as Array<{ role: string; content: string }>) ?? [];

    const refinementPrompt = `You are Genie 🧞‍♂️, a magical script refinement assistant with personality and charm!

GENIE'S PERSONALITY:
- Helpful, enthusiastic, and encouraging
- Uses emojis to add flair ✨
- Speaks in a friendly, supportive tone
- Makes users feel confident about their content

CURRENT SCRIPT:
${currentScript}

USER'S WISH:
${userMessage}

YOUR MAGICAL TASK:
1. Understand exactly what the user wants to improve
2. Keep the parts they love untouched
3. Enhance ONLY what they mentioned with Genie's magic ✨
4. Maintain structure: Hook → Content → CTA
5. Keep emojis and viral-worthy formatting
6. Make it engaging and scroll-stopping

GENIE'S RULES:
- If user says "make hook better" → only refine the hook
- If user says "improve CTA" → only enhance the CTA
- If general feedback → improve entire script
- Always maintain clear sections with emojis (🎣 HOOK, 📝 CONTENT, 📢 CTA)
- Keep under 60 seconds when read aloud
- Add energy and engagement
- NO [bracketed] visual directions, NO em dashes (—)

Respond with ONLY the refined script - no explanations, just pure magic! ✨`;

    const result = await generateContent({
      system: `You are Genie 🧞‍♂️, a magical script editor. Output ONLY the improved script text. No explanations, no labels - just the refined script.`,
      userMessage: refinementPrompt,
      model: getDefaultModel(),
      max_tokens: 2000,
      temperature: 0.7,
      userId: session.user.id,
      context: "scriptRefinement",
    });

    let refinedScript = cleanScript(result.text.trim());

    const updatedChatHistory = [
      ...chatHistory,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content: refinedScript },
    ];

    const [updatedScript] = await prisma.$transaction([
      prisma.scripts.update({
        where: { id: scriptId },
        data: {
          script_text: refinedScript,
          chat_history: updatedChatHistory,
          genie_edits_count: (script.genie_edits_count ?? 0) + 1,
        },
      }),
      prisma.users.update({
        where: { id: session.user.id },
        data: {
          genie_edits: Math.max(0, (user.genie_edits ?? 0) - 1),
          genie_edits_used_this_month: (user.genie_edits_used_this_month ?? 0) + 1,
        },
      }),
    ]);

    const newGenieEdits = Math.max(0, (user.genie_edits ?? 0) - 1);
    return NextResponse.json({
      success: true,
      script: {
        id: updatedScript.id,
        content: updatedScript.script_text,
        refinementCount: updatedScript.genie_edits_count,
        lifecycleStatus: updatedScript.lifecycle_status,
        chatHistory: updatedScript.chat_history,
      },
      refinedContent: refinedScript,
      refinementCount: updatedScript.genie_edits_count,
      genieEditsRemaining: newGenieEdits,
    });
  } catch (error) {
    console.error("[Refine] Error:", error);
    const { message, status } = handleClaudeError(error, "Script refinement");
    return NextResponse.json({ error: message }, { status });
  }
}
