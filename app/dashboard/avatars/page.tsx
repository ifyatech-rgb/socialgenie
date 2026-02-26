"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  Search,
  X,
  Film,
  Mic,
  ChevronRight,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
} from "lucide-react";
import {
  clearScriptVideoContext,
  SCRIPT_ID_STORAGE_KEY,
  SCRIPT_ID_VIDEO_KEY,
  PENDING_SCRIPT_KEY,
  SELECTED_AVATAR_KEY,
  SELECTED_AVATAR_FULL_KEY,
  getActiveVideoFlowIfFresh,
  setActiveVideoFlow,
  syncActiveFlowToLegacyStorage,
} from "@/lib/script-video-context-storage";
import { VoicePreviewButton } from "@/components/VoicePreviewButton";

const AVATARS_FETCH_MIN_INTERVAL_MS = 30_000; // Don't auto-refetch more than once per 30 sec
const AVATARS_CACHE_KEY = "avatars_page_cache";
const AVATARS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours - serve from cache while revalidating
const AVATARS_FETCH_RETRIES = 3;
const AVATARS_FETCH_RETRY_DELAY_MS = 1000;
const AVATARS_PER_PAGE = 25;
const AVATARS_PER_ROW = 5;
const CHARACTER_CARDS_PER_PAGE = 25;

/** Language name → flag emoji for voice list. */
const LANGUAGE_FLAGS: Record<string, string> = {
  english: "🇺🇸",
  "english (us)": "🇺🇸",
  "english (uk)": "🇬🇧",
  spanish: "🇪🇸",
  french: "🇫🇷",
  german: "🇩🇪",
  italian: "🇮🇹",
  portuguese: "🇵🇹",
  "portuguese (brazil)": "🇧🇷",
  dutch: "🇳🇱",
  polish: "🇵🇱",
  japanese: "🇯🇵",
  korean: "🇰🇷",
  chinese: "🇨🇳",
  mandarin: "🇨🇳",
  hindi: "🇮🇳",
  arabic: "🇸🇦",
  turkish: "🇹🇷",
  russian: "🇷🇺",
};
function getLanguageFlag(lang: string | undefined): string {
  if (!lang) return "🌐";
  const key = lang.toLowerCase().trim();
  return LANGUAGE_FLAGS[key] ?? "🌐";
}

const CATEGORY_ICONS: Record<string, string> = {
  Professional: "💼",
  Casual: "👕",
  "Young & Dynamic": "⚡",
  "Mature & Experienced": "🎓",
  Creative: "🎨",
  "Tech & Modern": "💻",
  "Female Avatars": "👩",
  "Male Avatars": "👨",
  "UGC Creators": "✨",
  Custom: "👤",
  Other: "👤",
};

interface AvatarItem {
  id: string;
  name: string;
  thumbnail?: string | null;
  preview?: string | null;
  videoPreview?: string | null;
  isCustom?: boolean;
  avatarType?: "public" | "ugc" | "custom";
  category?: string;
  gender?: string;
  style?: string;
  isPaid?: boolean;
  /** True when avatar is a HeyGen talking_photo (photo avatar); required for video generate. */
  isTalkingPhoto?: boolean;
  isPublic?: boolean;
}

function getCategoryForAvatar(avatar: AvatarItem): string {
  const name = (avatar.name ?? "").toLowerCase();
  const style = (avatar.style ?? "").toLowerCase();
  const type = avatar.avatarType ?? "";
  if (avatar.isCustom || type === "custom") return "Custom";
  if (type === "ugc") return "UGC Creators";
  if (name.includes("professional") || name.includes("business") || name.includes("corporate")) return "Professional";
  if (name.includes("casual") || name.includes("friendly")) return "Casual";
  if (name.includes("young") || name.includes("teen")) return "Young & Dynamic";
  if (name.includes("senior") || name.includes("mature")) return "Mature & Experienced";
  if (name.includes("creative") || name.includes("artistic")) return "Creative";
  if (name.includes("tech") || name.includes("modern")) return "Tech & Modern";
  if (avatar.gender?.toLowerCase() === "female" || name.includes("female") || name.includes("woman")) return "Female Avatars";
  if (avatar.gender?.toLowerCase() === "male" || name.includes("male") || name.includes("man")) return "Male Avatars";
  return "Other";
}

/** Base name (first word) for grouping variants e.g. "Conrad Sofa Front" → "Conrad" */
function getBaseName(avatar: AvatarItem): string {
  const first = (avatar.name ?? "").trim().split(/\s+/)[0];
  return first || "Other";
}

interface AvatarGroup {
  name: string;
  count: number;
  primaryAvatar: AvatarItem;
  avatars: AvatarItem[];
}

interface UserAvatarStats {
  customAvatarsUsed: number;
  customAvatarsLimit: number;
}

interface VoiceItem {
  id: string;
  voice_id?: string;
  name?: string;
  display_name?: string;
  language?: string;
  gender?: string;
  preview?: string;
  accent?: string;
}

function AvatarThumb({
  src,
  alt,
  fallbackChar = "?",
}: {
  src?: string | null;
  alt: string;
  fallbackChar?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showImg = src && !errored;
  return (
    <span className="absolute inset-0 block">
      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-2xl font-bold uppercase text-gray-500">
        {alt?.trim().charAt(0) || fallbackChar}
      </span>
      {showImg && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}

/** Character card for Public/UGC: one card per character with image, name, "X looks", selection state */
function CharacterCard({
  group,
  isSelected,
  onSelect,
}: {
  group: AvatarGroup;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const src = group.primaryAvatar.thumbnail || group.primaryAvatar.preview;
  const looksLabel = group.count === 1 ? "1 look" : `${group.count} looks`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition hover:shadow-md ${
        isSelected
          ? "border-purple-500 ring-2 ring-purple-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="relative aspect-[3/4] w-full bg-gray-100">
        <AvatarThumb
          src={src}
          alt={group.name}
          fallbackChar={group.name.charAt(0)}
        />
      </div>
      <div className="border-t border-gray-100 p-3">
        <p className="truncate font-bold text-gray-900">{group.name}</p>
        <p className="mt-0.5 text-sm text-gray-500">{looksLabel}</p>
      </div>
      {isSelected && (
        <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg">
          <Check className="h-5 w-5" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

export default function AvatarsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const scriptIdFromUrl = searchParams?.get("script") ?? searchParams?.get("scriptId") ?? null;
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [currentScriptInfo, setCurrentScriptInfo] = useState<{ id: string; topic: string; platform?: string } | null>(null);
  const [showScriptSelector, setShowScriptSelector] = useState(false);
  const [showScriptSwitcherModal, setShowScriptSwitcherModal] = useState(false);
  const [recentScripts, setRecentScripts] = useState<Array<{ id: string; topic: string; platform: string }>>([]);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Resolve script: URL wins, then fresh activeVideoFlow (1h). Stale or missing → show script selector.
  useEffect(() => {
    const fromUrl = searchParams?.get("script") ?? searchParams?.get("scriptId");
    const activeFlow = getActiveVideoFlowIfFresh();
    const resolved: string | null = fromUrl ?? activeFlow?.scriptId ?? null;
    if (!resolved) {
      setScriptId(null);
      setCurrentScriptInfo(null);
      setShowScriptSelector(true);
      return;
    }
    setShowScriptSelector(false);

    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/scripts/${resolved}`, { credentials: "include", cache: "no-store" });
      if (cancelled) return;
      if (!res.ok) {
        clearScriptVideoContext();
        setScriptId(null);
        setCurrentScriptInfo(null);
        setShowScriptSelector(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const scriptData = data?.script;
      if (!scriptData?.id || cancelled) {
        if (!cancelled) {
          setScriptId(null);
          setCurrentScriptInfo(null);
          setShowScriptSelector(true);
        }
        return;
      }
      const now = Date.now();
      const flow = {
        scriptId: scriptData.id,
        scriptTitle: scriptData.topic ?? "",
        platform: scriptData.platform ?? "",
        timestamp: now,
      };
      setActiveVideoFlow(flow);
      syncActiveFlowToLegacyStorage(flow, scriptData.content ?? "");
      setScriptId(scriptData.id);
      setCurrentScriptInfo({
        id: scriptData.id,
        topic: scriptData.topic ?? "",
        platform: scriptData.platform ?? undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptIdFromUrl, searchParams]);

  useEffect(() => {
    if (!showScriptSelector && !showScriptSwitcherModal) return;
    setScriptsLoaded(false);
    let cancelled = false;
    fetch("/api/scripts", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data?.scripts ?? []).slice(0, 20).map((s: { id: string; topic: string | null; platform: string }) => ({
          id: s.id,
          topic: s.topic ?? "Untitled",
          platform: s.platform ?? "TikTok",
        }));
        setRecentScripts(list);
        setScriptsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setRecentScripts([]);
          setScriptsLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showScriptSelector, showScriptSwitcherModal]);

  const handleSelectScriptForVideo = useCallback(
    (s: { id: string; topic: string; platform: string }) => {
      const now = Date.now();
      const flow = { scriptId: s.id, scriptTitle: s.topic, platform: s.platform, timestamp: now };
      setActiveVideoFlow(flow);
      syncActiveFlowToLegacyStorage(flow);
      setScriptId(s.id);
      setCurrentScriptInfo({ id: s.id, topic: s.topic, platform: s.platform });
      setShowScriptSelector(false);
      setShowScriptSwitcherModal(false);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/dashboard/avatars?scriptId=${encodeURIComponent(s.id)}`);
      }
    },
    []
  );

  const [stats, setStats] = useState<UserAvatarStats | null>(null);
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [groupedFromApi, setGroupedFromApi] = useState<AvatarGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grouped" | "grid">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"my" | "public" | "ugc">("public");
  const [showFreeOnly, setShowFreeOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [voicesForAvatar, setVoicesForAvatar] = useState<VoiceItem[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceItem | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voicePreviewLoadingId, setVoicePreviewLoadingId] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<string>("all");
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAvatarsFetchRef = useRef<number>(0);

  const fetchAvatars = useCallback(
    async (showRefreshing = false, retriesLeft = AVATARS_FETCH_RETRIES, backgroundRefresh = false) => {
      const now = Date.now();
      if (!showRefreshing && retriesLeft === AVATARS_FETCH_RETRIES && now - lastAvatarsFetchRef.current < AVATARS_FETCH_MIN_INTERVAL_MS) return;
      if (retriesLeft === AVATARS_FETCH_RETRIES) lastAvatarsFetchRef.current = now;

      setError(null);
      if (!backgroundRefresh) setLoading(true);

      const tryRetry = () => {
        if (retriesLeft <= 0) return;
        setTimeout(() => {
          fetchAvatars(showRefreshing, retriesLeft - 1);
        }, AVATARS_FETCH_RETRY_DELAY_MS);
      };

      try {
        const [userRes, avatarsRes] = await Promise.all([
          fetch("/api/user", { credentials: "include" }),
          fetch(
            `/api/heygen/avatars${showFreeOnly ? "?free=true" : "?free=false"}`,
            { credentials: "include", cache: "no-store" }
          ),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          const u = userData.user;
          setStats({
            customAvatarsUsed: u?.customAvatarsUsed ?? 0,
            customAvatarsLimit: u?.customAvatarsLimit ?? 1,
          });
        }
        if (avatarsRes.ok) {
          const data = await avatarsRes.json();
          const list = data.avatars ?? [];
          const groups = data.grouped ?? [];
          const hasAvatars = list.length > 0;
          if (hasAvatars) {
            setAvatars(list);
            setGroupedFromApi(groups);
            try {
              sessionStorage?.setItem(AVATARS_CACHE_KEY, JSON.stringify({
                avatars: list,
                grouped: groups,
                timestamp: Date.now(),
              }));
            } catch { /* ignore */ }
            if (groups.length > 0) {
              setExpandedGroups((prev) => {
                if (prev.size > 0) return prev;
                return new Set(groups.slice(0, 3).map((g: AvatarGroup) => g.name));
              });
            }
            setError(null);
          } else if (data.warning || data.error) {
            if (retriesLeft > 0) {
              tryRetry();
              return;
            }
            if (!backgroundRefresh) setError(data.warning ?? "Unable to load avatars. Please refresh the page or try again later.");
          } else {
            setError(null);
          }
        } else {
          if (retriesLeft > 0) {
            tryRetry();
            return;
          }
          if (!backgroundRefresh) setError("Unable to load avatars. Please refresh the page or try again later.");
        }
      } catch {
        if (retriesLeft > 0) {
          tryRetry();
          return;
        }
        setStats({ customAvatarsUsed: 0, customAvatarsLimit: 1 });
        if (!backgroundRefresh) setError("Unable to load avatars. Please refresh the page or try again later.");
      } finally {
        if (!backgroundRefresh) setLoading(false);
      }
    },
    [showFreeOnly]
  );

  useEffect(() => {
    let cached: { avatars: AvatarItem[]; grouped: AvatarGroup[]; timestamp: number } | null = null;
    try {
      const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AVATARS_CACHE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { avatars?: AvatarItem[]; grouped?: AvatarGroup[]; timestamp?: number };
        if (parsed?.avatars?.length && parsed?.timestamp && Date.now() - parsed.timestamp < AVATARS_CACHE_MAX_AGE_MS) {
          cached = { avatars: parsed.avatars, grouped: parsed.grouped ?? [], timestamp: parsed.timestamp };
        }
      }
    } catch { /* ignore */ }
    if (cached) {
      setAvatars(cached.avatars);
      setGroupedFromApi(cached.grouped);
      setLoading(false);
      fetchAvatars(false, AVATARS_FETCH_RETRIES, true);
    } else {
      fetchAvatars();
    }
  }, [fetchAvatars]);

  useEffect(() => {
    setSelectedCategory("all");
  }, [pathname]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === "public" || activeTab === "ugc") setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastAvatarsFetchRef.current >= AVATARS_FETCH_MIN_INTERVAL_MS) {
        fetchAvatars(true);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAvatars]);

  useEffect(() => {
    if (!selectedAvatar) {
      setVoicesForAvatar([]);
      setSelectedVoice(null);
      setVoiceSearchQuery("");
      setVoiceGenderFilter("all");
      return;
    }
    setVoiceSearchQuery("");
    setVoiceGenderFilter("all");
    setVoicesLoading(true);
    fetch(`/api/heygen/avatar-voices?avatarId=${encodeURIComponent(selectedAvatar.id)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        const voices = data.voices ?? [];
        setVoicesForAvatar(voices);
        const defaultId = data.defaultVoice ?? voices[0]?.id ?? voices[0]?.voice_id;
        if (defaultId && voices.length > 0) {
          const first = voices.find((v: VoiceItem) => v.id === defaultId || v.voice_id === defaultId) ?? voices[0];
          setSelectedVoice(first);
        } else {
          setSelectedVoice(voices[0] ?? null);
        }
      })
      .catch(() => {
        setVoicesForAvatar([]);
        setSelectedVoice(null);
      })
      .finally(() => setVoicesLoading(false));
  }, [selectedAvatar?.id]);

  const handlePlayVoice = useCallback((voice: VoiceItem) => {
    const id = voice.voice_id ?? voice.id;
    const previewUrl = voice.preview;
    if (!previewUrl) return;
    if (playingVoiceId === id) {
      voiceAudioRef.current?.pause();
      setPlayingVoiceId(null);
      setVoicePreviewLoadingId(null);
      return;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
    }
    setVoicePreviewLoadingId(id);
    const audio = new Audio(previewUrl);
    voiceAudioRef.current = audio;
    const onPlaying = () => setVoicePreviewLoadingId(null);
    const onEnded = () => setPlayingVoiceId(null);
    const onError = () => {
      setVoicePreviewLoadingId(null);
      setPlayingVoiceId(null);
    };
    audio.addEventListener("playing", onPlaying, { once: true });
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.play().catch(onError);
    setPlayingVoiceId(id);
  }, [playingVoiceId]);

  useEffect(() => {
    return () => {
      voiceAudioRef.current?.pause();
    };
  }, []);

  const filteredVoices = useMemo(() => {
    let list = voicesForAvatar;
    const q = voiceSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          (v.display_name ?? v.name ?? "").toLowerCase().includes(q) ||
          (v.language ?? "").toLowerCase().includes(q) ||
          (v.gender ?? "").toLowerCase().includes(q) ||
          (v.accent ?? "").toLowerCase().includes(q)
      );
    }
    if (voiceGenderFilter !== "all") {
      list = list.filter((v) => (v.gender ?? "").toLowerCase() === voiceGenderFilter.toLowerCase());
    }
    return list;
  }, [voicesForAvatar, voiceSearchQuery, voiceGenderFilter]);

  const voicesByLanguage = useMemo(() => {
    const map = new Map<string, VoiceItem[]>();
    for (const v of filteredVoices) {
      const lang = (v.language ?? "Other").trim() || "Other";
      if (!map.has(lang)) map.set(lang, []);
      map.get(lang)!.push(v);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredVoices]);

  const tabList = useMemo(() => {
    const my = avatars.filter((a) => a.avatarType === "custom" || a.isCustom);
    const public_ = avatars.filter((a) => a.avatarType === "public");
    const ugc = avatars.filter((a) => a.avatarType === "ugc");
    return { my, public: public_, ugc };
  }, [avatars]);

  const filteredForTab = useMemo(() => {
    const list = activeTab === "my" ? tabList.my : activeTab === "public" ? tabList.public : tabList.ugc;
    return list.filter((a) => {
      const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender =
        genderFilter === "all" ||
        (a.gender?.toLowerCase() ?? "") === genderFilter.toLowerCase();
      return matchesSearch && matchesGender;
    });
  }, [activeTab, tabList, searchQuery, genderFilter]);

  const organizedByCategory = useMemo(() => {
    const map: Record<string, AvatarItem[]> = {};
    filteredForTab.forEach((a) => {
      const cat = getCategoryForAvatar(a);
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });
    return map;
  }, [filteredForTab]);

  const categoryList = useMemo(() => Object.keys(organizedByCategory).sort(), [organizedByCategory]);

  const organizedByBaseName = useMemo(() => {
    const map: Record<string, AvatarItem[]> = {};
    filteredForTab.forEach((a) => {
      const base = getBaseName(a);
      if (!map[base]) map[base] = [];
      map[base].push(a);
    });
    return map;
  }, [filteredForTab]);

  const baseNameList = useMemo(() => Object.keys(organizedByBaseName).sort(), [organizedByBaseName]);

  const filteredForTabIds = useMemo(
    () => new Set(filteredForTab.map((a) => a.id)),
    [filteredForTab]
  );

  const filteredGroups = useMemo(() => {
    return groupedFromApi
      .map((g) => {
        const avatarsInTab = g.avatars.filter((a) => filteredForTabIds.has(a.id));
        if (avatarsInTab.length === 0) return null;
        const primary =
          avatarsInTab.find((a) => a.id === g.primaryAvatar?.id) ?? avatarsInTab[0];
        return {
          name: g.name,
          count: avatarsInTab.length,
          primaryAvatar: primary,
          avatars: avatarsInTab,
        };
      })
      .filter((g): g is AvatarGroup => g !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groupedFromApi, filteredForTabIds]);

  const displayGroups = useMemo(() => {
    if (filteredGroups.length > 0) return filteredGroups;
    return Object.entries(organizedByBaseName)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, avatars]) => ({
        name,
        count: avatars.length,
        primaryAvatar: avatars[0],
        avatars,
      }));
  }, [filteredGroups, organizedByBaseName]);

  const toggleGroup = useCallback((name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const listForDisplay = useMemo(() => {
    if (selectedCategory === "all") return filteredForTab;
    if (baseNameList.includes(selectedCategory)) {
      return filteredForTab.filter((a) => getBaseName(a) === selectedCategory);
    }
    return filteredForTab.filter((a) => getCategoryForAvatar(a) === selectedCategory);
  }, [filteredForTab, selectedCategory, baseNameList]);
  const filteredAvatars = filteredForTab;

  const totalAvatars = listForDisplay.length;
  const totalPages = Math.max(1, Math.ceil(totalAvatars / AVATARS_PER_PAGE));
  const paginatedAvatars = useMemo(() => {
    const start = (currentPage - 1) * AVATARS_PER_PAGE;
    return listForDisplay.slice(start, start + AVATARS_PER_PAGE);
  }, [listForDisplay, currentPage]);

  const groupTotalPages = Math.max(1, Math.ceil(displayGroups.length / CHARACTER_CARDS_PER_PAGE));
  const paginatedDisplayGroups = useMemo(() => {
    const start = (currentPage - 1) * CHARACTER_CARDS_PER_PAGE;
    return displayGroups.slice(start, start + CHARACTER_CARDS_PER_PAGE);
  }, [displayGroups, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if ((activeTab === "public" || activeTab === "ugc") && currentPage > groupTotalPages) {
      setCurrentPage(groupTotalPages);
    }
  }, [activeTab, currentPage, groupTotalPages]);

  const used = stats?.customAvatarsUsed ?? 0;
  const limit = stats?.customAvatarsLimit ?? 1;
  const canCreate = limit < 0 || used < limit;
  const createHref = canCreate ? "/dashboard/avatars/create" : "/checkout";

  const selectedGroup = useMemo(() => {
    if (!selectedAvatar) return null;
    return displayGroups.find((g) =>
      g.avatars.some((a) => a.id === selectedAvatar.id)
    ) ?? null;
  }, [selectedAvatar, displayGroups]);

  const handleUseAvatar = () => {
    if (!selectedAvatar) return;
    const effectiveScriptId =
      scriptId ??
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SCRIPT_ID_VIDEO_KEY) : null) ??
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SCRIPT_ID_STORAGE_KEY) : null) ??
      (typeof localStorage !== "undefined" ? localStorage.getItem(SCRIPT_ID_VIDEO_KEY) : null) ??
      (typeof localStorage !== "undefined" ? localStorage.getItem(SCRIPT_ID_STORAGE_KEY) : null);
    const voiceId = selectedVoice?.voice_id ?? selectedVoice?.id;
    const voiceName = selectedVoice?.display_name ?? selectedVoice?.name ?? (selectedVoice ? `${selectedAvatar.name} Voice` : undefined);
    const avatarPayload = {
      id: selectedAvatar.id,
      avatar_id: selectedAvatar.id,
      name: selectedAvatar.name,
      avatar_name: selectedAvatar.name,
      thumbnail: selectedAvatar.thumbnail,
      preview: selectedAvatar.preview,
      preview_image_url: selectedAvatar.thumbnail ?? selectedAvatar.preview,
      avatarType: selectedAvatar.avatarType,
      gender: selectedAvatar.gender,
      selectedLook: selectedAvatar.name,
      isTalkingPhoto: !!selectedAvatar.isTalkingPhoto,
      ...(voiceId && { voice_id: voiceId }),
      ...(voiceName && { voice_name: voiceName }),
      ...(selectedVoice?.preview && { voice_preview_audio: selectedVoice.preview }),
    };
    try {
      sessionStorage?.setItem(SELECTED_AVATAR_KEY, selectedAvatar.id);
      sessionStorage?.setItem(SELECTED_AVATAR_FULL_KEY, JSON.stringify(avatarPayload));
      localStorage?.setItem(SELECTED_AVATAR_FULL_KEY, JSON.stringify(avatarPayload));
      if (effectiveScriptId) {
        sessionStorage?.setItem(SCRIPT_ID_STORAGE_KEY, effectiveScriptId);
        sessionStorage?.setItem(SCRIPT_ID_VIDEO_KEY, effectiveScriptId);
        localStorage?.setItem(SCRIPT_ID_STORAGE_KEY, effectiveScriptId);
        localStorage?.setItem(SCRIPT_ID_VIDEO_KEY, effectiveScriptId);
      }
    } catch {
      // ignore
    }
    if (!effectiveScriptId) {
      router.push("/dashboard/scripts");
      return;
    }
    router.push(`/dashboard/video-settings?scriptId=${effectiveScriptId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="aspect-[9/16] animate-pulse bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const effectiveScriptId =
    scriptId ??
    (typeof window !== "undefined"
      ? (sessionStorage.getItem(SCRIPT_ID_VIDEO_KEY) ?? sessionStorage.getItem(SCRIPT_ID_STORAGE_KEY) ?? localStorage.getItem(SCRIPT_ID_VIDEO_KEY) ?? localStorage.getItem(SCRIPT_ID_STORAGE_KEY))
      : null);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {showScriptSelector && (
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4">
          <p className="mb-3 text-sm font-semibold text-purple-900">Which script do you want to create a video for?</p>
          {!scriptsLoaded ? (
            <p className="text-sm text-purple-700">Loading your scripts…</p>
          ) : recentScripts.length === 0 ? (
            <Link
              href="/dashboard/scripts"
              className="inline-block text-sm font-semibold text-purple-600 hover:text-purple-800"
            >
              Create a script first →
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentScripts.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectScriptForVideo(s)}
                  className="rounded-lg border-2 border-purple-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-purple-900 shadow-sm transition hover:border-purple-400 hover:bg-purple-50"
                >
                  <span className="font-semibold">{s.topic || "Untitled"}</span>
                  {s.platform && <span className="ml-2 text-xs text-purple-600">— {s.platform}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {currentScriptInfo && !showScriptSelector && (
        <button
          type="button"
          onClick={() => setShowScriptSwitcherModal(true)}
          className="flex w-full items-center justify-between gap-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 text-left transition hover:border-purple-300 hover:bg-purple-100/80"
        >
          <p className="text-sm font-semibold text-purple-900">
            Creating video for: <span className="font-bold">{currentScriptInfo.topic || "Script"}</span>
            {currentScriptInfo.platform && <span className="font-normal text-purple-700"> — {currentScriptInfo.platform}</span>}
          </p>
          <span className="flex shrink-0 items-center gap-1 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50">
            <Pencil className="h-3.5 w-3.5" />
            Change
          </span>
        </button>
      )}
      {showScriptSwitcherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowScriptSwitcherModal(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-bold text-gray-900">Switch script</h3>
              <button type="button" onClick={() => setShowScriptSwitcherModal(false)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {recentScripts.length === 0 ? (
                <p className="text-sm text-gray-500">Loading scripts…</p>
              ) : (
                <ul className="space-y-2">
                  {recentScripts.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectScriptForVideo(s)}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                          currentScriptInfo?.id === s.id
                            ? "border-purple-500 bg-purple-50 font-semibold text-purple-900"
                            : "border-gray-200 bg-gray-50 text-gray-800 hover:border-purple-300 hover:bg-purple-50/50"
                        }`}
                      >
                        <span className="font-medium">{s.topic || "Untitled"}</span>
                        {s.platform && <span className="ml-2 text-xs text-gray-500">— {s.platform}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avatars</h1>
          <p className="mt-1 text-gray-600">
            Browse AI avatars. Preview and pick one for your video.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={createHref}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create custom avatar
          </Link>
          <Link
            href={effectiveScriptId ? `/dashboard/scripts/${effectiveScriptId}` : "/dashboard/generate-script"}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-purple-300 hover:bg-purple-50"
          >
            <Film className="h-4 w-4" />
            Create script!
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchAvatars(true, AVATARS_FETCH_RETRIES)}
            className="rounded-lg bg-amber-200 px-3 py-1.5 font-semibold hover:bg-amber-300"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex gap-2 rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "my"
              ? "bg-purple-100 text-purple-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          My Avatars
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("public")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "public"
              ? "bg-purple-100 text-purple-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Public Avatars {tabList.public.length > 0 ? `${tabList.public.length}+` : ""}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ugc")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "ugc"
              ? "bg-purple-100 text-purple-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          UGC Creators {tabList.ugc.length > 0 ? `${tabList.ugc.length}+` : ""}
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search avatars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
        >
          <option value="all">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {(activeTab === "public" || activeTab === "ugc") && (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-800">
            Step 1 Select Avatar
          </span>
          <span className="text-sm text-gray-500">
            {displayGroups.length} characters · {totalAvatars} variations
            {groupTotalPages > 1
              ? ` · ${CHARACTER_CARDS_PER_PAGE} per page · Page ${currentPage} of ${groupTotalPages}`
              : ""}
          </span>
        </div>
      )}

      {activeTab === "my" && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-800">
              Choose an avatar
            </span>
            <span className="text-sm text-gray-500">
              {viewMode === "grouped"
                ? `${displayGroups.length} characters · ${totalAvatars} variations`
                : `${totalAvatars} avatars · ${AVATARS_PER_PAGE} per page · 5 per row`}
            </span>
          </div>
          <div className="flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "grouped"
                  ? "bg-purple-100 text-purple-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Grouped by character"
            >
              <List className="h-4 w-4" />
              Grouped
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "grid"
                  ? "bg-purple-100 text-purple-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title="Flat grid"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
          </div>
        </div>
      )}

      {activeTab === "my" && categoryList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedCategory === "all"
                ? "bg-purple-600 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:border-purple-300"
            }`}
          >
            All categories
          </button>
          {categoryList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-purple-300"
              }`}
            >
              {CATEGORY_ICONS[cat] ?? "👤"} {cat}
            </button>
          ))}
        </div>
      )}

      {filteredAvatars.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          {activeTab === "my" && (
            <>
              <p className="text-lg font-semibold text-gray-900">No custom avatars yet</p>
              <p className="mt-1 text-gray-600">Create or upload custom avatars to see them here.</p>
            </>
          )}
          {activeTab === "public" && (
            <>
              <p className="text-lg font-semibold text-gray-900">No public avatars available</p>
              <p className="mt-1 text-gray-600">Public avatars will appear here when the video service is available.</p>
            </>
          )}
          {activeTab === "ugc" && (
            <>
              <p className="text-lg font-semibold text-gray-900">No UGC creators available yet</p>
              <p className="mt-1 text-gray-600">UGC-style avatars will appear here when available from your provider.</p>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setGenderFilter("all");
            }}
            className="mt-3 text-sm font-semibold text-purple-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {(activeTab === "public" || activeTab === "ugc") && filteredAvatars.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedDisplayGroups
              .filter((_, index) => index !== 1 && index !== 2)
              .map((group) => {
                const isSelected =
                  selectedAvatar != null &&
                  group.avatars.some((a) => a.id === selectedAvatar.id);
                return (
                  <CharacterCard
                    key={group.name}
                    group={group}
                    isSelected={!!isSelected}
                    onSelect={() => setSelectedAvatar(group.primaryAvatar)}
                  />
                );
              })}
          </div>
          {groupTotalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-gray-600">
                Page {currentPage} of {groupTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(groupTotalPages, p + 1))}
                disabled={currentPage >= groupTotalPages}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "my" && filteredAvatars.length > 0 && viewMode === "grouped" && (
        <div className="space-y-3">
          {displayGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.name);
            return (
              <div
                key={group.name}
                className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.name)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      <AvatarThumb
                        src={group.primaryAvatar.thumbnail || group.primaryAvatar.preview}
                        alt={group.name}
                        fallbackChar={group.name.charAt(0)}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.count} variation{group.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6" />
                    ) : (
                      <ChevronDown className="h-6 w-6" />
                    )}
                  </span>
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {group.avatars.map((avatar) => (
                      <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        isSelected={selectedAvatar?.id === avatar.id}
                        onSelect={() => setSelectedAvatar(avatar)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "my" && filteredAvatars.length > 0 && viewMode === "grid" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {paginatedAvatars.map((avatar) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                isSelected={selectedAvatar?.id === avatar.id}
                onSelect={() => setSelectedAvatar(avatar)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {selectedAvatar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            aria-hidden
            onClick={() => setSelectedAvatar(null)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Avatar details</h2>
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-6 w-full overflow-hidden rounded-xl bg-gray-100 aspect-[9/16]">
                <AvatarThumb
                  src={selectedAvatar.thumbnail || selectedAvatar.preview}
                  alt={selectedAvatar.name}
                  fallbackChar={(selectedAvatar.name ?? "A").trim().charAt(0).toUpperCase() || "A"}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{selectedAvatar.name}</h3>
              {selectedGroup && selectedGroup.avatars.length > 1 && (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Other looks</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          selectedAvatar.id === avatar.id
                            ? "border-purple-500 ring-2 ring-purple-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <AvatarThumb
                          src={avatar.thumbnail || avatar.preview}
                          alt={avatar.name}
                          fallbackChar={(avatar.name ?? "?").trim().charAt(0)}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {selectedAvatar.gender ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Style</dt>
                  <dd className="font-medium text-gray-900">
                    {selectedAvatar.style ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900">
                    {selectedAvatar.isPaid ? "Paid" : "Free"}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">ID</dt>
                  <dd className="truncate font-mono text-xs text-gray-600">
                    {selectedAvatar.id}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Mic className="h-4 w-4" />
                  Choose voice for this avatar ({voicesForAvatar.length})
                </h4>
                <p className="mb-3 text-xs text-gray-500">
                  Only voices compatible with {selectedAvatar.name} are shown. Click ▶ to preview.
                </p>
                {voicesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : voicesForAvatar.length === 0 ? (
                  <p className="text-sm text-gray-500">No voices for this avatar. Default will be used.</p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Search voices..."
                        value={voiceSearchQuery}
                        onChange={(e) => setVoiceSearchQuery(e.target.value)}
                        className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                      <select
                        value={voiceGenderFilter}
                        onChange={(e) => setVoiceGenderFilter(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        <option value="all">All genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <ul className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                      {voicesByLanguage.map(([lang, voices]) => (
                        <li key={lang}>
                          <div className="mb-1.5 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <span aria-hidden>{getLanguageFlag(lang)}</span>
                            <span>{lang}</span>
                          </div>
                          <ul className="space-y-1">
                            {voices.map((v, index) => {
                              const vid = v.voice_id ?? v.id;
                              const displayName = v.display_name ?? v.name ?? `${selectedAvatar?.name ?? "Avatar"} Voice ${index + 1}`;
                              const isSelected = selectedVoice?.id === v.id || selectedVoice?.voice_id === vid;
                              return (
                                <li
                                  key={vid}
                                  className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 transition ${
                                    isSelected ? "border-purple-500 bg-purple-50" : "border-transparent hover:bg-gray-100"
                                  }`}
                                >
                                  <VoicePreviewButton
                                    previewUrl={v.preview}
                                    isPlaying={playingVoiceId === vid}
                                    onPlayPause={() => handlePlayVoice(v)}
                                    loading={voicePreviewLoadingId === vid}
                                    voiceName={displayName}
                                    size="md"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVoice(v)}
                                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                                  >
                                    <span className="font-medium text-gray-900 truncate">{displayName}</span>
                                    <span className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500">
                                      {v.language && (
                                        <span>{getLanguageFlag(v.language)} {v.language}</span>
                                      )}
                                      {v.gender && (
                                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-600 capitalize">
                                          {v.gender}
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                  {isSelected && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                                      <Check className="h-3 w-3" strokeWidth={3} />
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                    {filteredVoices.length === 0 && (voiceSearchQuery || voiceGenderFilter !== "all") && (
                      <p className="mt-2 text-sm text-gray-500">No voices match the filter. Try changing search or gender.</p>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleUseAvatar}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 py-3.5 font-semibold text-white shadow-md hover:opacity-90"
              >
                <Film className="h-5 w-5" />
                Use this avatar
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AvatarCard({
  avatar,
  isSelected,
  onSelect,
}: {
  avatar: AvatarItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const src = avatar.thumbnail || avatar.preview || null;
  const fallbackChar = (avatar.name ?? "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition hover:shadow-md ${
        isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-100 hover:border-purple-200"
      }`}
    >
      <div className="relative aspect-[9/16] bg-gray-100">
        {!imageLoaded && !imageError && src && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" aria-hidden />
        )}
        <span className="absolute inset-0 block">
          <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-4xl font-bold uppercase text-gray-500">
            {fallbackChar}
          </span>
          {src && !imageError && (
            <img
              src={src}
              alt={avatar.name}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
        </span>
        {avatar.isPaid && (
          <div className="absolute right-2 top-2 rounded-lg bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
            Paid
          </div>
        )}
        {!avatar.isPaid && avatar.isPublic !== false && (
          <div className="absolute right-2 top-2 rounded-lg bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
            Free
          </div>
        )}
        {isSelected && (
          <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow">
            ✓
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-semibold text-gray-900">{avatar.name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {avatar.gender && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
              {avatar.gender}
            </span>
          )}
          {avatar.style && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
              {avatar.style}
            </span>
          )}
          {avatar.isCustom && (
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
              Custom
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
