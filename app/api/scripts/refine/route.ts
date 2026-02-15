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
      prisma.script.findUnique({ where: { id: scriptId } }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, genieEdits: true, genieEditsUsed: true },
      }),
    ]);

    if (!script || script.userId !== session.user.id) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (script.lifecycleStatus === "finalized") {
      return NextResponse.json(
        { error: "This script is finalized. Create a new draft to make changes." },
        { status: 400 }
      );
    }

    if (!user || !canUseGenie(user)) {
      return NextResponse.json(
        {
          error: "No Genie edits remaining",
          code: "genie_limit_reached",
          genieEdits: user?.genieEdits ?? 0,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const chatHistory = (script.chatHistory as Array<{ role: string; content: string }>) ?? [];

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
      prisma.script.update({
        where: { id: scriptId },
        data: {
          content: refinedScript,
          chatHistory: updatedChatHistory,
          refinementCount: (script.refinementCount ?? 0) + 1,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          genieEdits: Math.max(0, (user.genieEdits ?? 0) - 1),
          genieEditsUsed: (user.genieEditsUsed ?? 0) + 1,
        },
      }),
    ]);

    const newGenieEdits = Math.max(0, (user.genieEdits ?? 0) - 1);
    return NextResponse.json({
      success: true,
      script: {
        id: updatedScript.id,
        content: updatedScript.content,
        refinementCount: updatedScript.refinementCount,
        lifecycleStatus: updatedScript.lifecycleStatus,
        chatHistory: updatedScript.chatHistory,
      },
      refinedContent: refinedScript,
      refinementCount: updatedScript.refinementCount,
      genieEditsRemaining: newGenieEdits,
    });
  } catch (error) {
    console.error("[Refine] Error:", error);
    const { message, status } = handleClaudeError(error, "Script refinement");
    return NextResponse.json({ error: message }, { status });
  }
}
