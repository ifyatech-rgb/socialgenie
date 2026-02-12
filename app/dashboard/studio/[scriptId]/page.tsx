"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Studio page for a specific script: redirect to Avatars with scriptId so user can pick avatar and generate video.
 */
export default function StudioScriptPage() {
  const router = useRouter();
  const params = useParams();
  const scriptId = params?.scriptId as string | undefined;

  useEffect(() => {
    if (scriptId) {
      router.replace(`/dashboard/avatars?scriptId=${encodeURIComponent(scriptId)}`);
    } else {
      router.replace("/dashboard/avatars");
    }
  }, [router, scriptId]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-[var(--text-secondary)]">Redirecting...</p>
    </div>
  );
}
