/**
 * Centralized keys and helpers for script/video creation context.
 * Ensures we can clear all user-specific context on logout and avoid
 * cross-account or stale data (e.g. "Creating video for" banner).
 */

export const SCRIPT_ID_STORAGE_KEY = "scriptIdForAvatar";
export const SCRIPT_ID_VIDEO_KEY = "scriptIdForVideo";
export const CURRENT_SCRIPT_KEY = "currentScript";
export const PENDING_SCRIPT_KEY = "pendingScript";
export const SELECTED_AVATAR_KEY = "selectedAvatarId";
export const SELECTED_AVATAR_FULL_KEY = "selectedAvatarFull";
export const VIDEO_SIZE_KEY = "videoSize";
/** Single source of truth for "which script we're creating a video for" — prevents stale banner. */
export const ACTIVE_VIDEO_FLOW_KEY = "activeVideoFlow";

const ALL_KEYS = [
  SCRIPT_ID_STORAGE_KEY,
  SCRIPT_ID_VIDEO_KEY,
  CURRENT_SCRIPT_KEY,
  PENDING_SCRIPT_KEY,
  SELECTED_AVATAR_KEY,
  SELECTED_AVATAR_FULL_KEY,
  VIDEO_SIZE_KEY,
  ACTIVE_VIDEO_FLOW_KEY,
] as const;

export interface ActiveVideoFlow {
  scriptId: string;
  scriptTitle: string;
  platform: string;
  timestamp: number;
}

export function setActiveVideoFlow(flow: ActiveVideoFlow): void {
  if (typeof localStorage === "undefined" && typeof sessionStorage === "undefined") return;
  const raw = JSON.stringify(flow);
  try {
    localStorage?.setItem(ACTIVE_VIDEO_FLOW_KEY, raw);
    sessionStorage?.setItem(ACTIVE_VIDEO_FLOW_KEY, raw);
  } catch {
    // ignore
  }
}

export function getActiveVideoFlow(): ActiveVideoFlow | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_VIDEO_FLOW_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveVideoFlow;
  } catch {
    return null;
  }
}

/** Returns flow only if it's still within the allowed age (e.g. 1 hour). */
export function getActiveVideoFlowIfFresh(): ActiveVideoFlow | null {
  const flow = getActiveVideoFlow();
  if (!flow?.scriptId || !flow.timestamp) return null;
  if (!isScriptContextFresh(flow.timestamp)) {
    clearActiveVideoFlow();
    return null;
  }
  return flow;
}

export function clearActiveVideoFlow(): void {
  try {
    localStorage?.removeItem(ACTIVE_VIDEO_FLOW_KEY);
    sessionStorage?.removeItem(ACTIVE_VIDEO_FLOW_KEY);
  } catch {
    // ignore
  }
}

/**
 * Clear all script/video context from localStorage and sessionStorage.
 * Call on logout and anywhere we need to ensure no cross-account or stale data.
 */
export function clearScriptVideoContext(): void {
  if (typeof localStorage === "undefined" && typeof sessionStorage === "undefined") return;
  for (const key of ALL_KEYS) {
    try {
      localStorage?.removeItem(key);
      sessionStorage?.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/** Max age for "current script" context: 60 minutes. Older = treat as stale and don't show banner. */
export const SCRIPT_CONTEXT_MAX_AGE_MS = 60 * 60 * 1000;

export interface CurrentScriptStored {
  id?: string;
  topic?: string;
  platform?: string;
  scriptText?: string;
  cta?: string;
  selectedAt?: number;
}

export function getCurrentScriptFromStorage(): CurrentScriptStored | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_SCRIPT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentScriptStored;
  } catch {
    return null;
  }
}

/** Sync activeVideoFlow into CURRENT_SCRIPT_KEY and script ID keys for backward compat. */
export function syncActiveFlowToLegacyStorage(flow: ActiveVideoFlow, scriptText?: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SCRIPT_ID_STORAGE_KEY, flow.scriptId);
    localStorage.setItem(SCRIPT_ID_VIDEO_KEY, flow.scriptId);
    localStorage.setItem(
      CURRENT_SCRIPT_KEY,
      JSON.stringify({
        id: flow.scriptId,
        topic: flow.scriptTitle,
        platform: flow.platform,
        scriptText: scriptText ?? "",
        selectedAt: flow.timestamp,
      })
    );
    sessionStorage?.setItem(SCRIPT_ID_STORAGE_KEY, flow.scriptId);
    sessionStorage?.setItem(SCRIPT_ID_VIDEO_KEY, flow.scriptId);
  } catch {
    // ignore
  }
}

/** Returns true if stored script context is still within the allowed age. */
export function isScriptContextFresh(selectedAt?: number): boolean {
  if (selectedAt == null) return true;
  return Date.now() - selectedAt <= SCRIPT_CONTEXT_MAX_AGE_MS;
}
