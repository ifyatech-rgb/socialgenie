import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createConsent } from "@/lib/did";

/**
 * GET /api/avatar/consent
 * Create a D-ID consent challenge and return the text the user must read in their video.
 * Consent is required before creating an Express Avatar (face + voice clone).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consent = await createConsent("english");
    if (!consent) {
      return NextResponse.json(
        { error: "D-ID consent could not be created. Check API key and try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      consentId: consent.id,
      text: consent.text,
      expiresIn: "30 minutes",
    });
  } catch (error) {
    console.error("[Avatar] Consent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
