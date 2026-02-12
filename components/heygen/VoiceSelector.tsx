"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export interface HeyGenVoiceItem {
  id: string;
  name: string;
  language?: string;
  gender?: string;
  preview?: string;
  accent?: string;
}

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
  selected: string;
}

export default function VoiceSelector({ onSelect, selected }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<HeyGenVoiceItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, HeyGenVoiceItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  useEffect(() => {
    fetch("/api/heygen/voices")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setVoices(d.voices ?? []);
          setGrouped(d.grouped ?? {});
          const langs = Object.keys(d.grouped ?? {});
          if (langs.length && !langs.includes(selectedLanguage)) setSelectedLanguage(langs[0] ?? "English");
        } else throw new Error(d.message ?? "Failed to load voices");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="my-6 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading voices...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-gray-700">Failed to load voices: {error}</p>
      </div>
    );
  }

  const languages = Object.keys(grouped);
  const currentVoices = grouped[selectedLanguage] ?? voices;

  return (
    <div className="my-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Select Voice</h3>
      {languages.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                selectedLanguage === lang ? "border-indigo-500 bg-indigo-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {currentVoices.map((voice) => (
          <div
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 p-3 transition-all ${
              selected === voice.id ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-indigo-300"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900">{voice.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {voice.gender && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">{voice.gender}</span>
                )}
                {voice.accent && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{voice.accent}</span>
                )}
              </div>
            </div>
            {voice.preview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  new Audio(voice.preview).play();
                }}
                className="shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
              >
                🔊 Preview
              </button>
            )}
            {selected === voice.id && <span className="text-xl font-bold text-indigo-600">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
