"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Redirects old Generate Video route to Projects. Script ID is passed to Avatars for video creation flow. */
export default function GenerateVideoRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scriptId = searchParams?.get("script");
    const url = scriptId ? `/dashboard/avatars?script=${scriptId}` : "/dashboard/projects";
    router.replace(url);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
