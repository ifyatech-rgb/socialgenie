"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export interface HeyGenAvatarItem {
  id: string;
  name: string;
  preview?: string;
  thumbnail?: string;
  gender?: string;
  style?: string;
}

interface AvatarSelectorProps {
  onSelect: (avatarId: string) => void;
  selected: string;
}

export default function AvatarSelector({ onSelect, selected }: AvatarSelectorProps) {
  const [avatars, setAvatars] = useState<HeyGenAvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/heygen/avatars")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.avatars)) setAvatars(d.avatars);
        else throw new Error(d.message ?? "Failed to load avatars");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="my-6 flex items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="ml-4 text-gray-600">Loading avatars...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-gray-700">Failed to load avatars: {error}</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Select Avatar</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
              selected === avatar.id ? "border-indigo-500 shadow ring-2 ring-indigo-500/30" : "border-gray-200 hover:border-indigo-300"
            }`}
          >
            <div className="aspect-[3/4] w-full bg-gray-100">
              {avatar.preview ? (
                <img src={avatar.preview} alt={avatar.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-gray-400">👤</div>
              )}
            </div>
            <div className="border-t border-gray-100 bg-white p-3">
              <div className="truncate text-sm font-semibold text-gray-900">{avatar.name}</div>
              {avatar.gender && (
                <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                  {avatar.gender}
                </span>
              )}
            </div>
            {selected === avatar.id && (
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
