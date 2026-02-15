import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const expectedName = (formData.get("expectedName") as string)?.trim() ?? "";

    if (!videoFile || !expectedName) {
      return NextResponse.json(
        { error: "Missing video or expected name", verified: false },
        { status: 400 }
      );
    }

    // TODO: Implement actual speech-to-text verification (e.g. OpenAI Whisper, Deepgram).
    // For now: placeholder that accepts when we have a name to check.
    const verified = true;

    return NextResponse.json({
      verified,
      expectedName,
      message: verified
        ? `Name "${expectedName}" verified successfully`
        : `Name "${expectedName}" not found in recording`,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed", verified: false },
      { status: 500 }
    );
  }
}
