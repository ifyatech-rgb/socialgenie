"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect to unified Scripts page for backwards compatibility. */
export default function GenerateScriptRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/scripts");
  }, [router]);
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-gray-500">Redirecting to Scripts...</p>
    </div>
  );
}
