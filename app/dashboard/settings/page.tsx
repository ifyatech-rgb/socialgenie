"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  Shield,
  Camera,
  Loader2,
  Check,
  Coins,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Tab definitions
const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Credits", icon: CreditCard },
  { id: "account", label: "Account", icon: Shield },
];

interface UserData {
  name: string;
  email: string;
  credits: number;
  plan: string;
  niche: string | null;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUserData({
            name: data.user?.name || "",
            email: data.user?.email || session?.user?.email || "",
            credits: data.user?.credits ?? 0,
            plan: data.user?.plan || "free",
            niche: data.user?.niche || null,
            avatarUrl: data.user?.avatarUrl || null,
          });
          setName(data.user?.name || "");
          setNiche(data.user?.niche || "");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, niche }),
      });

      if (res.ok) {
        await update({ name });
        toast.success("Profile saved!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // User initials
  const userInitials = (userData?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-500">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all",
                  activeTab === tab.id
                    ? "bg-white text-violet-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {userData?.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-white text-2xl font-bold">
                  {userInitials}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{userData?.name || "Your Name"}</p>
                <p className="text-sm text-gray-500">{userData?.email}</p>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder="Your full name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userData?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Niche */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Content Niche
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder="E.g., Fitness, Business, Tech..."
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Save Changes
            </button>
          </div>
        )}

        {/* Billing/Credits Tab */}
        {activeTab === "billing" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Credits Display */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-6 border border-violet-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-violet-200 rounded-2xl flex items-center justify-center">
                  <Coins className="h-7 w-7 text-violet-700" />
                </div>
                <div>
                  <p className="text-sm text-violet-700 font-medium">Credits Remaining</p>
                  <p className="text-4xl font-bold text-violet-900">{userData?.credits ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Plan Info */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {(userData?.plan === "starter" ? "Starter" : userData?.plan === "trial" ? "7-Day Trial" : "Starter")} Plan
                  </p>
                  <p className="text-sm text-gray-500">
                    {userData?.plan === "starter" ? "$19/month • 50 scripts/month" : "Try free for 7 days, then $19/month"}
                  </p>
                </div>
                <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
            </div>

            {/* Credit Costs Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Credit Costs</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Generate Viral Script</span>
                  <span className="font-semibold text-gray-900">1 credit</span>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <Link href="/checkout">
              <button
                className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                Upgrade to $19/month
              </button>
            </Link>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">
            {/* Logout */}
            <div className="p-4 border border-gray-200 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-1">Log Out</h3>
              <p className="text-sm text-gray-500 mb-4">
                Sign out of your account on this device
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>

            {/* Danger Zone */}
            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
              <h3 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all data. This cannot be undone.
              </p>
              
              {showDeleteConfirm ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => toast.error("Account deletion not implemented")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Yes, Delete My Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
