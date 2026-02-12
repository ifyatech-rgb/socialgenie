"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Video,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Search,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { cleanScript, hasVisualDirections } from "@/lib/scriptCleaner";
import { extractSections, validateScriptStructure } from "@/lib/scriptFormatter";

const PENDING_SCRIPT_KEY = "pendingScript";

function StructuredScriptContent({ content }: { content: string }) {
  const validation = validateScriptStructure(content);
  const sections = extractSections(content);
  const hasSections = sections.hook || sections.content || sections.cta;

  if (!validation.isValid || !hasSections) {
    return (
      <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.hook && (
        <div>
          <div className="mb-2 inline-block rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white">
            🎣 HOOK
          </div>
          <div className="text-sm leading-relaxed text-gray-800">{sections.hook}</div>
        </div>
      )}
      {sections.content && (
        <div>
          <div className="mb-2 inline-block rounded-lg bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-1.5 text-xs font-bold text-white">
            📝 CONTENT
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-gray-800">
            {sections.content.split(/\n\n+/).map((para, idx) => (
              <p key={idx} className="border-l-2 border-gray-300 pl-4">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}
      {sections.cta && (
        <div>
          <div className="mb-2 inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1.5 text-xs font-bold text-white">
            📢 CTA
          </div>
          <div className="text-sm leading-relaxed text-gray-800">{sections.cta}</div>
        </div>
      )}
    </div>
  );
}

const platforms = [
  { id: "TikTok" as const, label: "TikTok", icon: "🎵" },
  { id: "Instagram" as const, label: "Instagram", icon: "📸" },
  { id: "YouTube" as const, label: "YouTube", icon: "▶️" },
];

const tones = [
  { id: "Educational" as const, label: "Educational" },
  { id: "Entertaining" as const, label: "Entertaining" },
  { id: "Motivational" as const, label: "Motivational" },
  { id: "Controversial" as const, label: "Controversial" },
];

const hookTypes = [
  { id: "shocking" as const, label: "Shocking Statement" },
  { id: "question" as const, label: "Question" },
  { id: "contrarian" as const, label: "Contrarian" },
  { id: "warning" as const, label: "Warning" },
  { id: "secret" as const, label: "Secret/Insider" },
];

const brandVoices = [
  { id: "casual", label: "Casual & Friendly" },
  { id: "professional", label: "Professional" },
  { id: "energetic", label: "Energetic & Hype" },
  { id: "calm", label: "Calm & Soothing" },
  { id: "humorous", label: "Humorous" },
];

const ctaOptions = [
  { id: "follow", label: "Follow for more" },
  { id: "comment", label: "Comment below" },
  { id: "share", label: "Share this" },
  { id: "save", label: "Save for later" },
  { id: "link", label: "Link in bio" },
  { id: "dm", label: "DM me" },
];

type ScriptItem = {
  id: string;
  topic: string | null;
  platform: string;
  tone: string | null;
  length: number | null;
  content: string;
  status: string | null;
  createdAt: string;
};

export default function ScriptsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"TikTok" | "Instagram" | "YouTube">("TikTok");
  const [tone, setTone] = useState<"Educational" | "Entertaining" | "Motivational" | "Controversial">("Educational");
  const [audience, setAudience] = useState("");
  const [enableResearch, setEnableResearch] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [niche, setNiche] = useState("");
  const [uniqueAngle, setUniqueAngle] = useState("");
  const [hookType, setHookType] = useState<"shocking" | "question" | "contrarian" | "warning" | "secret">("shocking");
  const [brandVoice, setBrandVoice] = useState("casual");
  const [ctaPreference, setCtaPreference] = useState("follow");
  const [keyPoints, setKeyPoints] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [currentScript, setCurrentScript] = useState<string | null>(null);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [researchUsed, setResearchUsed] = useState(false);
  const [scriptMeta, setScriptMeta] = useState<{
    optimalLength?: string;
    actualWordCount?: number;
    lengthReasoning?: string;
    lengthOptimized?: boolean;
  } | null>(null);

  const [allScripts, setAllScripts] = useState<ScriptItem[]>([]);
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [viewModalScript, setViewModalScript] = useState<ScriptItem | null>(null);
  const [editingScript, setEditingScript] = useState<ScriptItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const scriptDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserCredits();
    loadSavedScripts();
  }, []);

  async function loadUserCredits() {
    try {
      const res = await fetch("/api/user", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data.user?.credits ?? 0);
      }
    } catch (e) {
      console.error("Error loading credits:", e);
    }
  }

  async function loadSavedScripts() {
    try {
      const res = await fetch("/api/scripts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllScripts(data.scripts ?? []);
      }
    } catch (e) {
      console.error("Error loading scripts:", e);
    }
  }

  async function handleGenerate() {
    const creditsNeeded = enableResearch ? 3 : 1;
    const credits = userCredits ?? 0;

    if (credits < creditsNeeded) {
      setError(`Not enough credits. Need ${creditsNeeded}, have ${credits}`);
      toast.error(`Need ${creditsNeeded} credits`);
      return;
    }

    if (!topic.trim() || topic.length < 10) {
      setError("Please provide more details about your topic (at least 10 characters)");
      toast.error("Add more details to your topic");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCurrentScript(null);
    setCurrentScriptId(null);
    setResearchUsed(false);
    setScriptMeta(null);

    try {
      const body: Record<string, unknown> = {
        topic: topic.trim(),
        platform,
        tone,
        enableResearch,
        targetAudience: audience.trim() || undefined,
        storyContext: uniqueAngle.trim() || undefined,
        specificPoints: keyPoints.trim() || undefined,
        hookStyle: hookType,
        niche: enableResearch ? (niche.trim() || topic.trim().split(/\s+/).slice(0, 3).join(" ")) : undefined,
        brandVoice: brandVoices.find((v) => v.id === brandVoice)?.label || undefined,
        ctaPreference: ctaOptions.find((c) => c.id === ctaPreference)?.label || undefined,
      };

      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate script");
      }

      let scriptContent =
        typeof data.script?.content === "string"
          ? data.script.content
          : typeof data.script === "string"
          ? data.script
          : "";
      scriptContent = cleanScript(scriptContent);
      const scriptId = data.script?.id ?? null;

      setCurrentScript(scriptContent);
      setCurrentScriptId(scriptId);
      setResearchUsed(data.research?.used ?? false);
      setScriptMeta(data.metadata ?? null);
      setUserCredits(data.creditsRemaining ?? credits - 1);
      loadSavedScripts();
      toast.success("Script generated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate script";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleMakeVideo(scriptContent?: string, scriptId?: string | null, scriptTopic?: string, scriptPlatform?: string) {
    const s = scriptContent ?? currentScript;
    const id = scriptId ?? currentScriptId;
    const t = scriptTopic ?? topic.trim();
    const p = scriptPlatform ?? platform;
    if (!s) return;
    try {
      sessionStorage.setItem(
        PENDING_SCRIPT_KEY,
        JSON.stringify({
          scriptId: id ?? undefined,
          script: s,
          topic: t,
          platform: p,
        })
      );
      router.push("/dashboard/avatars");
    } catch {
      toast.error("Could not save script");
    }
  }

  async function handleCopy() {
    if (!currentScript) return;
    try {
      await navigator.clipboard.writeText(currentScript);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  function openEditModal(script: ScriptItem) {
    setEditingScript(script);
    setEditContent(script.content);
    setEditTopic(script.topic ?? "");
  }

  function closeEditModal() {
    setEditingScript(null);
    setEditContent("");
    setEditTopic("");
    setSaving(false);
  }

  async function handleCleanScript(scriptId: string, originalContent: string) {
    const cleaned = cleanScript(originalContent);
    if (cleaned === originalContent) {
      toast.success("Script is already clean");
      return;
    }
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to clean script");
      setAllScripts((prev) =>
        prev.map((s) =>
          s.id === scriptId ? { ...s, content: cleaned } : s
        )
      );
      if (viewModalScript?.id === scriptId) {
        setViewModalScript((prev) => (prev ? { ...prev, content: cleaned } : null));
      }
      if (editingScript?.id === scriptId) {
        setEditContent(cleaned);
      }
      loadSavedScripts();
      toast.success("Script cleaned: removed visual directions and em dashes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clean script");
    }
  }

  async function saveEdit() {
    if (!editingScript || !editContent.trim()) {
      toast.error("Script content cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/scripts/${editingScript.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: editContent.trim(),
          topic: editTopic.trim() || editingScript.topic || editContent.trim().substring(0, 50) + "...",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setAllScripts((prev) =>
        prev.map((s) =>
          s.id === editingScript.id
            ? { ...s, content: editContent.trim(), topic: editTopic.trim() || s.topic }
            : s
        )
      );
      closeEditModal();
      toast.success("Script updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save script");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    const hasData = topic || audience || niche || uniqueAngle || keyPoints;
    if (hasData && typeof window !== "undefined" && !window.confirm("Clear all form fields?")) return;

    setTopic("");
    setPlatform("TikTok");
    setTone("Educational");
    setAudience("");
    setNiche("");
    setUniqueAngle("");
    setHookType("shocking");
    setBrandVoice("casual");
    setCtaPreference("follow");
    setKeyPoints("");
    setEnableResearch(false);
    setCurrentScript(null);
    setCurrentScriptId(null);
    setError("");
    toast.success("Form cleared");
  }

  const creditsNeeded = enableResearch ? 3 : 1;
  const credits = userCredits ?? 0;
  const canGenerate = credits >= creditsNeeded && topic.trim().length >= 10;

  if (!session) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
          <div className="mb-6 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
        <div className="flex gap-4">
          <span className="text-3xl">✨</span>
          <div>
            <h4 className="font-bold text-emerald-800">Smart Script Length</h4>
            <p className="mt-1 text-sm text-emerald-700">
              Our AI analyzes your topic and automatically determines the perfect script length — whether it needs a
              quick 30-second tip or a detailed 2-minute explanation. No manual timing needed!
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Scripts</h1>
          <p className="mt-1 text-gray-500">Generate viral scripts and view all your scripts in one place</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center gap-2 self-start rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
        >
          <RotateCcw className="h-4 w-4" />
          Clear Form
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b-2 border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">✨ Generate New Script</h2>
            <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-bold text-amber-800">
              💎 {credits ?? "…"} credits
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">What&apos;s your content about? *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Example: How to gain 5kg muscle in 90 days using proven workout strategies and nutrition tips"
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{topic.length}/500</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">Platform *</label>
                <div className="flex gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                        platform === p.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                      }`}
                    >
                      <span>{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900">Content Style</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as typeof tone)}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {tones.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-900">Target Audience (Optional)</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Fitness enthusiasts, Beginners, Entrepreneurs"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white p-4 transition-all">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <label className="group flex flex-1 cursor-pointer items-start gap-4">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={enableResearch}
                      onChange={(e) => setEnableResearch(e.target.checked)}
                      className="sr-only"
                    />
                    <div className="h-8 w-14 rounded-full bg-gray-200 transition-colors group-has-[:checked]:bg-indigo-600">
                      <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform group-has-[:checked]:translate-x-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-indigo-600" />
                      <span className="font-bold text-gray-900">Enable AI Research</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Analyzes trending content and viral patterns before writing</p>
                    {enableResearch && (
                      <ul className="mt-3 space-y-2 border-t border-indigo-100 pt-3">
                        {["Finds current trending topics", "Incorporates proven viral hooks", "Uses real data"].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
                <div className="flex shrink-0 items-center">
                  <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 text-center">
                    <span className="text-2xl font-bold text-amber-700">{creditsNeeded}</span>
                    <span className="ml-1 text-xs font-bold uppercase text-amber-600">credits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border-2 border-gray-200">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                {showAdvanced ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-indigo-600" />}
                <span className="font-bold text-gray-900">Advanced Settings</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold uppercase text-gray-500">Optional</span>
              </button>
              {showAdvanced && (
                <div className="space-y-4 border-t-2 border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-900">Niche</label>
                    <input
                      type="text"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., Fitness, Finance, Tech"
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-900">Unique Angle</label>
                    <input
                      type="text"
                      value={uniqueAngle}
                      onChange={(e) => setUniqueAngle(e.target.value)}
                      placeholder="e.g., For beginners, On a budget"
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-gray-900">Hook Type</label>
                      <select value={hookType} onChange={(e) => setHookType(e.target.value as typeof hookType)} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500">
                        {hookTypes.map((h) => (
                          <option key={h.id} value={h.id}>{h.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-bold text-gray-900">Brand Voice</label>
                      <select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500">
                        {brandVoices.map((v) => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-900">Call-to-Action</label>
                    <select value={ctaPreference} onChange={(e) => setCtaPreference(e.target.value)} className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500">
                      {ctaOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-900">Key Points</label>
                    <textarea
                      value={keyPoints}
                      onChange={(e) => setKeyPoints(e.target.value)}
                      placeholder="• Point 1\n• Point 2\n• Point 3"
                      rows={3}
                      className="w-full resize-none rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <span className="text-xl">⚠️</span>
                <span className="text-sm font-semibold text-amber-800">{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 font-bold text-white shadow-lg shadow-indigo-200/50 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {enableResearch ? "Researching & Generating…" : "Generating Script…"}
                </>
              ) : !canGenerate ? (
                credits < creditsNeeded ? <>⚠️ Need {creditsNeeded} Credits</> : <>⚠️ Add More Details</>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Script ({creditsNeeded} {creditsNeeded === 1 ? "Credit" : "Credits"})
                </>
              )}
            </button>
          </div>

          {currentScript && (
            <div ref={scriptDisplayRef} className="mt-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <h3 className="text-lg font-bold text-emerald-800">Your Script is Ready!</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-2 rounded-lg border-2 border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMakeVideo()}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Video className="h-4 w-4" />
                    Generate Video
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/80 p-5">
                <StructuredScriptContent content={currentScript} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-700">
                <span>📱 {platform}</span>
                <span>•</span>
                <span>⏱️ {scriptMeta?.optimalLength ?? "~60 sec"}</span>
                <span>•</span>
                <span>📝 {scriptMeta?.actualWordCount ?? currentScript.split(/\s+/).filter(Boolean).length} words</span>
                {researchUsed && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 rounded-md border-2 border-emerald-600 bg-white px-2 py-1">
                      <Search className="h-3 w-3" /> Research-powered
                    </span>
                  </>
                )}
                {scriptMeta?.lengthOptimized && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 rounded-md border-2 border-emerald-600 bg-white px-2 py-1">
                      ✨ Length optimized
                    </span>
                  </>
                )}
              </div>
              {scriptMeta?.lengthReasoning && (
                <div className="mt-3 flex gap-2 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/80 p-3">
                  <span className="text-lg">💡</span>
                  <span className="text-sm text-emerald-800">
                    Script length ({scriptMeta.optimalLength}): {scriptMeta.lengthReasoning}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm lg:order-2">
          <div className="mb-4 flex items-center justify-between border-b-2 border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">📚 Recent Scripts</h2>
            <button
              type="button"
              onClick={() => setShowAllScripts(!showAllScripts)}
              className="rounded-lg border-2 border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-700"
            >
              {showAllScripts ? "Show Less" : "View All"}
            </button>
          </div>

          {allScripts.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-5xl opacity-40">📝</span>
              <p className="mt-4 font-semibold text-gray-600">No scripts yet</p>
              <p className="mt-1 text-sm text-gray-500">Generate your first script to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllScripts ? allScripts : allScripts.slice(0, 3)).map((s) => (
                <div key={s.id} className="rounded-xl border-2 border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-indigo-300 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold capitalize ${
                        s.platform === "TikTok" ? "bg-black text-white" : s.platform === "Instagram" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-red-600 text-white"
                      }`}
                    >
                      {s.platform === "TikTok" ? "🎵" : s.platform === "Instagram" ? "📸" : "▶️"}
                      {s.platform}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">{s.content.substring(0, 120)}…</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewModalScript(s)}
                      className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-700"
                    >
                      👁️ View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="flex items-center justify-center gap-1 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {hasVisualDirections(s.content) && (
                      <button
                        type="button"
                        onClick={() => handleCleanScript(s.id, s.content)}
                        className="rounded-lg border-2 border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        title="Remove visual directions and em dashes"
                      >
                        🧹 Clean
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleMakeVideo(s.content, s.id, s.topic ?? "", s.platform)}
                      className="flex-1 rounded-lg border-2 border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      🎬 Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Script Modal */}
      {viewModalScript && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewModalScript(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {viewModalScript.topic || "Script"}
              </h2>
              <button
                type="button"
                onClick={() => setViewModalScript(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-6" style={{ maxHeight: "calc(85vh - 180px)" }}>
              <div className="flex flex-wrap gap-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
                <span className="font-medium text-gray-600">
                  Platform: <span className="text-gray-900">{viewModalScript.platform}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-medium text-gray-600">
                  {new Date(viewModalScript.createdAt).toLocaleString()}
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-medium text-gray-600">
                  {viewModalScript.content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div className="rounded-xl border-2 border-gray-100 bg-gray-50/80 p-5">
                <StructuredScriptContent content={viewModalScript.content} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setViewModalScript(null)}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 min-w-[100px]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  openEditModal(viewModalScript);
                  setViewModalScript(null);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 px-4 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50 min-w-[100px]"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              {hasVisualDirections(viewModalScript.content) && (
                <button
                  type="button"
                  onClick={() => handleCleanScript(viewModalScript.id, viewModalScript.content)}
                  className="rounded-xl border-2 border-amber-400 px-4 py-2.5 font-semibold text-amber-700 hover:bg-amber-100"
                  title="Remove visual directions and em dashes"
                >
                  🧹 Clean
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setViewModalScript(null);
                  handleMakeVideo(viewModalScript.content, viewModalScript.id, viewModalScript.topic ?? "", viewModalScript.platform);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 font-semibold text-white hover:from-indigo-700 hover:to-purple-700 min-w-[100px]"
              >
                <Video className="h-4 w-4" />
                Create Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Script Modal */}
      {editingScript && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeEditModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Script</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-900">Topic / Title</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  placeholder="Script topic or title..."
                  disabled={saving}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-sm font-bold text-gray-900">
                  Script Content
                  <span className="font-medium text-indigo-600">{editContent.length} chars</span>
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter your script..."
                  rows={14}
                  disabled={saving}
                  className="w-full resize-y rounded-xl border-2 border-gray-200 px-4 py-3 text-sm leading-relaxed focus:border-indigo-500 disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3">
                <span className="text-lg">📱</span>
                <span className="text-sm font-medium text-indigo-800">
                  Platform: <strong>{editingScript.platform}</strong>
                </span>
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving || !editContent.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 font-semibold text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
