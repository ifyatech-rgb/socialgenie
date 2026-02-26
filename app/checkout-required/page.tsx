"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { CreditCard, LogOut } from "lucide-react";
import { LogoIcon } from "@/components/logo";
import { clearScriptVideoContext } from "@/lib/script-video-context-storage";

export default function CheckoutRequiredPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleCompletePayment = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      alert(data.error || "Could not start checkout. Please try again.");
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.replace("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <LogoIcon size={56} />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Complete your payment to access your account
        </h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          Add a payment method to start your 7-day free trial and use the app. You won’t be charged until the trial ends.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleCompletePayment}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </button>
          <button
            onClick={() => {
              clearScriptVideoContext();
              signOut({ callbackUrl: "/" });
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>

        <p className="mt-6 text-center text-gray-500 text-xs">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
