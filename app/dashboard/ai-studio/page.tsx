"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect to Avatars page for backwards compatibility. */
export default function AIStudioRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/avatars");
  }, [router]);
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-gray-500">Redirecting to Avatars...</p>
    </div>
  );
}
