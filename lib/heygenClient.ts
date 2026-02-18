/**
 * HeyGen API v2 Client
 * Fetches avatars, voices, and generates avatar videos
 */

const HEYGEN_API_URL = "https://api.heygen.com/v2";
const HEYGEN_UPLOAD_URL = "https://upload.heygen.com/v1";

/** Raw avatar from HeyGen API (may include category, tags, resolution, etc.) */
export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name?: string;
  preview_image_url?: string;
  preview_video_url?: string;
  gender?: string;
  avatar_style?: string;
  avatar_type?: string;
  /** v2 API may return "type" (e.g. ugc, lifestyle, community) */
  type?: string | null;
  is_public?: boolean;
  is_paid?: boolean;
  premium?: boolean;
  category?: string;
  tags?: string[] | null;
  description?: string;
  resolution?: { width?: number; height?: number };
  dimension?: { width?: number; height?: number };
}

/** Talking photo from HeyGen v2 /avatars response (photo avatars / UGC-style) */
export interface HeyGenTalkingPhoto {
  talking_photo_id: string;
  talking_photo_name?: string;
  preview_image_url?: string;
}

/** Formatted avatar returned by getAvatars (category-filtered, with native resolution) */
export interface FormattedHeyGenAvatar {
  id: string;
  name: string;
  preview?: string;
  videoPreview?: string;
  imagePreview?: string;
  gender: string;
  style: string;
  category: string;
  isPaid: boolean;
  isPublic: boolean;
  nativeResolution: { width: number; height: number; aspectRatio: string };
  aspectRatio: string;
  width: number;
  height: number;
  /** Normalized type for dashboard: public (stock), ugc, or from talking_photos */
  avatarType?: "public" | "ugc";
}

export interface HeyGenVoice {
  voice_id: string;
  display_name?: string;
  language?: string;
  gender?: string;
  preview_audio_url?: string;
  accent?: string;
}

export interface HeyGenVideoGenerateOptions {
  avatarStyle?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1" | string;
  dimension?: { width: number; height: number };
  background?: { type: string; value?: string };
  useNativeResolution?: boolean;
  /** If true (default), use 720p-style resolution so generation works on lower HeyGen plans. */
  useStandardResolution?: boolean;
}

export interface HeyGenVideoStatus {
  status: "pending" | "waiting" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
  progress?: number;
}

class HeyGenClient {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.baseUrl = HEYGEN_API_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("HEYGEN_API_KEY is not configured. Add it to your .env file.");
    }
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    };
    if (body && method === "POST") options.body = JSON.stringify(body);
    try {
      const response = await fetch(url, options);
      const responseText = await response.text();
      const data = (responseText ? JSON.parse(responseText) : {}) as Record<string, unknown>;
      if (!response.ok) {
        const errMsg =
          (data as { message?: string }).message ??
          (data as { error?: string }).error ??
          (data as { msg?: string }).msg ??
          `HeyGen API error: ${response.status}`;
        console.error(`[HeyGen] ${method} ${url} → ${response.status}`, responseText.substring(0, 300));
        throw new Error(String(errMsg));
      }
      return data as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("[HeyGen] Invalid JSON response from", url);
      }
      throw error;
    }
  }

  /** Calculate aspect ratio string from width/height */
  calculateAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9";
    if (Math.abs(ratio - 9 / 16) < 0.01) return "9:16";
    if (Math.abs(ratio - 1) < 0.01) return "1:1";
    if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3";
    if (Math.abs(ratio - 21 / 9) < 0.01) return "21:9";
    return `${width}:${height}`;
  }

  /** Get native resolution for an avatar (from API fields or inferred from type/style). */
  getAvatarNativeResolution(avatar: HeyGenAvatar): { width: number; height: number; aspectRatio: string } {
    if (avatar.resolution?.width && avatar.resolution?.height) {
      return {
        width: avatar.resolution.width,
        height: avatar.resolution.height,
        aspectRatio: this.calculateAspectRatio(avatar.resolution.width, avatar.resolution.height),
      };
    }
    if (avatar.dimension?.width && avatar.dimension?.height) {
      return {
        width: avatar.dimension.width,
        height: avatar.dimension.height,
        aspectRatio: this.calculateAspectRatio(avatar.dimension.width, avatar.dimension.height),
      };
    }
    const style = (avatar.avatar_style ?? "").toLowerCase();
    const name = (avatar.avatar_name ?? "").toLowerCase();
    const type = (avatar.avatar_type ?? "").toLowerCase();
    if (type.includes("community")) {
      return { width: 1920, height: 1080, aspectRatio: "16:9" };
    }
    // Avatars with "lounge", "office", "sofa", "desk", "room" are often full-scene/landscape; use 16:9 so video matches avatar (not forced reel).
    const looksLandscape = /lounge|office|sofa|desk|room/.test(name);
    if (looksLandscape) {
      return { width: 1920, height: 1080, aspectRatio: "16:9" };
    }
    if (
      type.includes("ugc") ||
      type.includes("lifestyle") ||
      style.includes("casual") ||
      style.includes("influencer")
    ) {
      return { width: 1080, height: 1920, aspectRatio: "9:16" };
    }
    return { width: 1080, height: 1920, aspectRatio: "9:16" };
  }

  /** Get avatars filtered by category (Lifestyle, UGC, Community) and background quality; includes native resolution and talking_photos (UGC-style). */
  async getAvatars(options?: { freeOnly?: boolean }): Promise<FormattedHeyGenAvatar[]> {
    const filterFreeOnly = options?.freeOnly ?? true;
    console.log("[HeyGen] Fetching avatars... filter free only:", filterFreeOnly);

    try {
      const data = await this.makeRequest<{
        data?: {
          avatars?: HeyGenAvatar[];
          talking_photos?: HeyGenTalkingPhoto[];
        };
      }>("/avatars");
      const allAvatars = data?.data?.avatars ?? [];
      const talkingPhotos = data?.data?.talking_photos ?? [];

      // Temporary logging: raw HeyGen response and counts per type
      const typeCounts: Record<string, number> = {};
      allAvatars.forEach((a) => {
        const t = (a.type ?? a.avatar_type ?? a.category ?? "unknown").toString().toLowerCase();
        typeCounts[t] = (typeCounts[t] ?? 0) + 1;
      });
      console.log("[HeyGen] Raw API: avatars=", allAvatars.length, "talking_photos=", talkingPhotos.length, "types=", typeCounts);

      // HeyGen has 4 types: Professional, Lifestyle, UGC, Community. We sync Lifestyle, UGC, Community. Also respect API "type" field.
      const ALLOWED_CATEGORIES = ["lifestyle", "ugc", "community"];
      const EXCLUDED_CATEGORIES = ["professional", "studio", "business", "education", "corporate", "premium"];

      let categoryFiltered = allAvatars.filter((avatar) => {
        const category = (avatar.category ?? "").toLowerCase();
        const tags = (avatar.tags ?? []).map((t) => String(t).toLowerCase());
        const avatarTypeRaw = (avatar.avatar_type ?? avatar.type ?? "").toString().toLowerCase();
        const name = (avatar.avatar_name ?? "").toLowerCase();
        const hasAnyCategoryInfo = category || avatarTypeRaw || tags.length > 0;

        // Explicit UGC type from API must be included
        if (avatarTypeRaw.includes("ugc") || category.includes("ugc")) return true;

        const matchesExcluded = EXCLUDED_CATEGORIES.some(
          (excl) =>
            category.includes(excl) ||
            tags.some((tag) => tag.includes(excl)) ||
            avatarTypeRaw.includes(excl) ||
            name.includes(excl)
        );
        if (matchesExcluded) return false;

        const matchesAllowed = ALLOWED_CATEGORIES.some(
          (allowed) =>
            category.includes(allowed) ||
            tags.some((tag) => tag.includes(allowed)) ||
            avatarTypeRaw.includes(allowed) ||
            name.includes(allowed)
        );
        if (matchesAllowed) return true;
        if (!hasAnyCategoryInfo) return true;
        return false;
      });

      let avatarsToShow = categoryFiltered;
      if (filterFreeOnly) {
        avatarsToShow = categoryFiltered.filter(
          (a) => a.is_public === true || !(a.is_paid ?? a.premium)
        );
        try {
          const { HEYGEN_FREE_AVATAR_IDS } = await import("@/config/heygen-free-avatars");
          if (HEYGEN_FREE_AVATAR_IDS?.length > 0) {
            const idSet = new Set(HEYGEN_FREE_AVATAR_IDS.map((id: string) => id.trim().toLowerCase()));
            avatarsToShow = avatarsToShow.filter((a) => idSet.has(a.avatar_id.toLowerCase()));
          }
        } catch {
          // no config
        }
      }

      // Exclude avatars with plain/studio/solid backgrounds (light grey, off-white, professional)
      const EXCLUDED_KEYWORDS = [
        "green screen",
        "greenscreen",
        "chroma key",
        "studio background",
        "white background",
        "plain background",
        "solid background",
        "transparent background",
        "light grey",
        "light gray",
        "off-white",
        "grey background",
        "gray background",
        "neutral background",
        "uniform background",
        "plain backdrop",
        "solid color background",
        "light background",
        "studio look",
        "professional backdrop",
        // HeyGen studio/outfit avatars (plain backdrop) - e.g. "Aditya in Brown blazer"
        "blazer",
        " blouse",
        " suit ",
        " suit.",
        " shirt ",
        " shirt.",
        "beige blazer",
        "brown blazer",
        "blue blazer",
        "maroon",
      ];

      avatarsToShow = avatarsToShow.filter((avatar) => {
        const name = (avatar.avatar_name ?? "").toLowerCase();
        const text = `${name} ${(avatar.description ?? "").toLowerCase()} ${(avatar.avatar_style ?? "").toLowerCase()}`;
        if (EXCLUDED_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))) return false;
        const style = (avatar.avatar_style ?? "").toLowerCase();
        if (style.includes("studio") || style.includes("green") || style.includes("chroma")) return false;
        // Exclude "FirstName in [Outfit]" names (studio/look avatars with plain background)
        if (name.includes(" in ") && (name.includes("blazer") || name.includes(" shirt") || name.includes(" suit") || name.includes("blouse"))) return false;
        return true;
      });

      const formatted = avatarsToShow
        .map((avatar) => {
          const nativeResolution = this.getAvatarNativeResolution(avatar);
          const preview = avatar.preview_image_url || avatar.preview_video_url;
          if (!preview) return null;
          const category = (avatar.category ?? "lifestyle").toLowerCase();
          const apiType = (avatar.avatar_type ?? avatar.type ?? "").toString().toLowerCase();
          const isUgc = apiType.includes("ugc") || category.includes("ugc");
          return {
            id: avatar.avatar_id,
            name: avatar.avatar_name ?? "Unnamed Avatar",
            preview,
            videoPreview: avatar.preview_video_url,
            imagePreview: avatar.preview_image_url,
            gender: avatar.gender ?? "Unknown",
            style: avatar.avatar_style ?? "normal",
            category: isUgc ? "ugc" : category,
            isPaid: avatar.is_paid ?? avatar.premium ?? false,
            isPublic: avatar.is_public ?? false,
            nativeResolution,
            aspectRatio: nativeResolution.aspectRatio,
            width: nativeResolution.width,
            height: nativeResolution.height,
            avatarType: isUgc ? "ugc" : "public",
          };
        })
        .filter((a) => a !== null) as FormattedHeyGenAvatar[];

      // Append talking_photos as UGC-style avatars (photo avatars from HeyGen)
      const ugcFromTalkingPhotos: FormattedHeyGenAvatar[] = talkingPhotos
        .filter((tp) => tp.talking_photo_id && (tp.preview_image_url || tp.talking_photo_name))
        .map((tp) => ({
          id: tp.talking_photo_id,
          name: tp.talking_photo_name ?? "Talking Photo",
          preview: tp.preview_image_url,
          videoPreview: undefined,
          imagePreview: tp.preview_image_url,
          gender: "Unknown",
          style: "normal",
          category: "ugc",
          isPaid: false,
          isPublic: true,
          nativeResolution: { width: 1080, height: 1920, aspectRatio: "9:16" },
          aspectRatio: "9:16",
          width: 1080,
          height: 1920,
          avatarType: "ugc" as const,
        }));

      const combined = [...formatted, ...ugcFromTalkingPhotos];
      console.log(
        "[HeyGen] Formatted: public/stock=",
        formatted.length,
        "talking_photos(ugc)=",
        ugcFromTalkingPhotos.length,
        "total=",
        combined.length
      );
      return combined;
    } catch (error) {
      console.error("[HeyGen] Failed to fetch avatars:", error);
      return [];
    }
  }

  async getVoices(): Promise<HeyGenVoice[]> {
    try {
      const data = await this.makeRequest<{ data?: { voices?: HeyGenVoice[] } }>("/voices");
      return data?.data?.voices ?? [];
    } catch (error) {
      console.error("[HeyGen] Failed to fetch voices:", error);
      return [];
    }
  }

  async getVoicesForAvatar(avatarId: string): Promise<HeyGenVoice[]> {
    try {
      // Try avatar-specific voices endpoint first
      const data = await this.makeRequest<{ data?: { voices?: HeyGenVoice[] } }>(
        `/avatar/${encodeURIComponent(avatarId)}/voices`
      );
      if (data?.data?.voices?.length) return data.data.voices;
    } catch {
      // Fallback: try plural avatars endpoint
      try {
        const data = await this.makeRequest<{ data?: { voices?: HeyGenVoice[] } }>(
          `/avatars/${encodeURIComponent(avatarId)}/voices`
        );
        if (data?.data?.voices?.length) return data.data.voices!;
      } catch {
        // ignore
      }
    }
    return await this.getVoices();
  }

  async getAvatarDetails(avatarId: string): Promise<{
    id: string;
    name: string;
    preview?: string;
    defaultVoice?: string;
    gender?: string;
    style?: string;
  } | null> {
    try {
      const data = await this.makeRequest<{
        data?: {
          avatar_id?: string;
          avatar_name?: string;
          preview_image_url?: string;
          gender?: string;
          avatar_style?: string;
          default_voice_id?: string;
        };
      }>(`/avatar/${encodeURIComponent(avatarId)}/details`);
      const d = data?.data;
      if (!d?.avatar_id) return null;
      return {
        id: d.avatar_id,
        name: d.avatar_name ?? d.avatar_id,
        preview: d.preview_image_url,
        defaultVoice: d.default_voice_id,
        gender: d.gender,
        style: d.avatar_style,
      };
    } catch (error) {
      console.error("[HeyGen] Failed to fetch avatar details:", error);
      return null;
    }
  }

  /** Get avatar details including native resolution (for video generation). */
  async getAvatarDetailsWithResolution(avatarId: string): Promise<{
    success: boolean;
    avatar?: { id: string; name: string; style?: string; category?: string };
    nativeResolution: { width: number; height: number; aspectRatio: string };
    error?: string;
  }> {
    const fallback = {
      width: 1080,
      height: 1920,
      aspectRatio: "9:16" as const,
    };
    try {
      const data = await this.makeRequest<{ data?: HeyGenAvatar }>(
        `/avatar.get?avatar_id=${encodeURIComponent(avatarId)}`
      );
      const avatar = data?.data;
      if (!avatar) {
        const details = await this.getAvatarDetails(avatarId);
        if (details) {
          return {
            success: true,
            avatar: { id: details.id, name: details.name, style: details.style },
            nativeResolution: fallback,
          };
        }
        return { success: false, nativeResolution: fallback, error: "Invalid response" };
      }
      const nativeResolution = this.getAvatarNativeResolution(avatar);
      return {
        success: true,
        avatar: {
          id: avatar.avatar_id,
          name: avatar.avatar_name ?? avatarId,
          style: avatar.avatar_style,
          category: avatar.category,
        },
        nativeResolution,
      };
    } catch (error) {
      console.error("[HeyGen] Failed to get avatar details with resolution:", error);
      return {
        success: false,
        nativeResolution: fallback,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Standard resolution (720p) that works on HeyGen lower-tier plans; avoids "subscribe to higher plan" errors. */
  static readonly STANDARD_RESOLUTION = {
    "9:16": { width: 720, height: 1280 },
    "16:9": { width: 1280, height: 720 },
    "1:1": { width: 720, height: 720 },
    "4:3": { width: 960, height: 720 },
    "21:9": { width: 1280, height: 548 },
  } as const;

  async generateVideo(
    script: string,
    avatarId: string,
    voiceId: string,
    options: HeyGenVideoGenerateOptions = {}
  ): Promise<{ videoId: string; status: string; resolution?: { width: number; height: number }; aspectRatio?: string }> {
    const aspectRatio = options.aspectRatio ?? "9:16";
    const useStandardResolution = options.useStandardResolution !== false;
    const requestedDimension =
      options.dimension ??
      (aspectRatio === "16:9"
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 });
    const dimension = useStandardResolution
      ? (HeyGenClient.STANDARD_RESOLUTION[aspectRatio as keyof typeof HeyGenClient.STANDARD_RESOLUTION] ?? HeyGenClient.STANDARD_RESOLUTION["9:16"])
      : requestedDimension;

    const videoInput: Record<string, unknown> = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: options.avatarStyle ?? "normal",
            scale: 1.0,
            offset: { x: 0, y: 0 },
            fit_to_frame: true,
            crop: false,
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: voiceId,
            speed: 1.0,
          },
        },
      ],
      dimension: { width: dimension.width, height: dimension.height },
      aspect_ratio: aspectRatio,
      test: false,
      quality: "high",
      background: options.background ?? { type: "color", value: "#000000" },
    };

    const data = await this.makeRequest<{ data?: { video_id?: string } }>("/video/generate", "POST", videoInput);
    const videoId = data?.data?.video_id;
    if (!videoId) throw new Error("HeyGen did not return a video ID");
    return {
      videoId,
      status: "processing",
      resolution: dimension,
      aspectRatio,
    };
  }

  /** Convert buffer to base64 (for server-side photo avatar) */
  bufferToBase64(buffer: Buffer): string {
    return buffer.toString("base64");
  }

  /** Create talking photo from image (HeyGen: POST upload.heygen.com/v1/talking_photo). Returns talking_photo_id for use in video generation. */
  async createPhotoAvatar(imageBuffer: Buffer, avatarName: string, mimeType = "image/jpeg"): Promise<{
    success: boolean;
    avatarId?: string;
    status?: string;
    message?: string;
    error?: string;
  }> {
    try {
      console.log("[HeyGen] Creating talking photo (instant avatar):", avatarName);
      const url = `${HEYGEN_UPLOAD_URL}/talking_photo`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apiKey!,
          "Content-Type": mimeType,
        },
        body: new Uint8Array(imageBuffer),
      });
      const responseText = await response.text();
      const data = responseText ? (JSON.parse(responseText) as { code?: number; data?: { talking_photo_id?: string; talking_photo_url?: string }; message?: string }) : {};
      if (!response.ok) {
        const errMsg = data.message ?? data.data ?? responseText?.substring(0, 200) ?? `Upload failed: ${response.status}`;
        throw new Error(String(errMsg));
      }
      const talkingPhotoId = data.data?.talking_photo_id;
      if (!talkingPhotoId) {
        throw new Error(data.message ?? "No talking_photo_id in response");
      }
      console.log("[HeyGen] Talking photo created:", talkingPhotoId);
      return {
        success: true,
        avatarId: talkingPhotoId,
        status: "completed",
        message: "Talking photo ready. Use in video generation with character.type: talking_photo.",
      };
    } catch (error) {
      console.error("[HeyGen] Photo avatar creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Upload video file to HeyGen. Uses direct POST to upload.heygen.com/v1/asset (official Upload Asset API).
   * Returns asset id as videoId for use in createVideoAvatar.
   */
  async uploadVideoFile(
    videoBuffer: Buffer,
    mimeType: string,
    filename = "avatar-video.mp4"
  ): Promise<{ success: boolean; videoUrl?: string; videoId?: string; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: "HEYGEN_API_KEY is not configured." };
    }
    try {
      const fileSize = videoBuffer.length;
      console.log("[HeyGen] Uploading video via upload.heygen.com/v1/asset...", filename, (fileSize / 1024 / 1024).toFixed(2), "MB");

      const uploadUrl = `${HEYGEN_UPLOAD_URL}/asset`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": mimeType,
        },
        body: new Uint8Array(videoBuffer),
      });

      const responseText = await response.text();
      const data = responseText ? (JSON.parse(responseText) as { code?: number; data?: { id?: string; url?: string; file_type?: string }; message?: string }) : {};

      if (!response.ok) {
        const msg = data.message ?? data.data ?? responseText?.substring(0, 300) ?? `Upload failed: ${response.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }

      if (data.code !== 100 && data.code !== 0) {
        throw new Error(data.message ?? "HeyGen upload returned an error");
      }

      const assetId = data.data?.id;
      if (!assetId) {
        throw new Error(data.message ?? "HeyGen did not return an asset id");
      }

      console.log("[HeyGen] Video uploaded successfully, asset_id:", assetId);
      return {
        success: true,
        videoId: assetId,
        videoUrl: data.data?.url,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[HeyGen] Video upload failed:", msg);
      return {
        success: false,
        error: msg,
      };
    }
  }

  /**
   * Create custom (UGC) avatar from uploaded video_id(s).
   * Uses HeyGen v2 POST /avatars with video_id and optional consent_video_id.
   */
  async createVideoAvatar(
    videoId: string,
    avatarName: string,
    consentVideoId?: string
  ): Promise<{
    success: boolean;
    avatarId?: string;
    status?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const body: Record<string, string> = {
        avatar_name: avatarName,
        avatar_type: "UGC",
        video_id: videoId,
      };
      if (consentVideoId) body.consent_video_id = consentVideoId;

      console.log("[HeyGen] Step 3: Creating avatar with video_id...", avatarName);
      const data = await this.makeRequest<{ data?: { avatar_id?: string; id?: string } }>("/avatars", "POST", body);
      const avatarId = data?.data?.avatar_id ?? data?.data?.id;

      if (avatarId) {
        console.log("[HeyGen] Avatar creation started:", avatarId);
        return {
          success: true,
          avatarId,
          status: "processing",
          message: "Avatar creation started. Ready in 15-30 minutes.",
        };
      }
      return { success: false, error: "HeyGen did not return avatar_id" };
    } catch (error) {
      console.error("[HeyGen] Create video avatar failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Get avatar creation status (processing / completed / failed). For talking_photo_id, returns completed (no status API). */
  async getAvatarCreationStatus(avatarId: string): Promise<{
    success: boolean;
    status?: string;
    progress?: number;
    avatar?: { id: string; name: string; preview?: string; videoPreview?: string };
    error?: string;
  }> {
    try {
      console.log("[HeyGen] Checking avatar creation status:", avatarId);
      const data = await this.makeRequest<{
        data?: {
          avatar_id?: string;
          avatar_name?: string;
          status?: string;
          progress?: number;
          preview_image_url?: string;
          preview_video_url?: string;
        };
      }>(`/avatar.get?avatar_id=${encodeURIComponent(avatarId)}`);
      const avatar = data?.data;
      if (!avatar) throw new Error("Invalid response");
      const status = avatar.status ?? "processing";
      return {
        success: true,
        status,
        progress: avatar.progress ?? 0,
        avatar:
          status === "completed"
            ? {
                id: avatar.avatar_id ?? avatarId,
                name: avatar.avatar_name ?? avatarId,
                preview: avatar.preview_image_url,
                videoPreview: avatar.preview_video_url,
              }
            : undefined,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("404") || msg.includes("Not Found")) {
        return { success: true, status: "completed", progress: 100, avatar: { id: avatarId, name: avatarId } };
      }
      console.error("[HeyGen] Failed to get avatar status:", error);
      return { success: false, error: msg };
    }
  }

  /** List custom (user-created) avatars. */
  async getCustomAvatars(): Promise<{
    success: boolean;
    avatars: Array<{
      id: string;
      name: string;
      preview?: string;
      videoPreview?: string;
      status?: string;
      isCustom: boolean;
      createdAt?: string;
    }>;
    error?: string;
  }> {
    try {
      console.log("[HeyGen] Fetching custom avatars...");
      const data = await this.makeRequest<{
        data?: {
          avatars?: Array<{
            avatar_id?: string;
            avatar_name?: string;
            preview_image_url?: string;
            preview_video_url?: string;
            status?: string;
            created_at?: string;
          }>;
        };
      }>("/avatar/list.get?type=custom");
      const list = data?.data?.avatars ?? [];
      const customAvatars = list.map((a) => ({
        id: a.avatar_id ?? "",
        name: a.avatar_name ?? a.avatar_id ?? "",
        preview: a.preview_image_url,
        videoPreview: a.preview_video_url,
        status: a.status,
        isCustom: true,
        createdAt: a.created_at,
      }));
      console.log("[HeyGen] Found", customAvatars.length, "custom avatars");
      return { success: true, avatars: customAvatars };
    } catch (error) {
      console.error("[HeyGen] Failed to fetch custom avatars:", error);
      return {
        success: true,
        avatars: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** List UGC avatars from HeyGen (if endpoint exists). Returns same shape as getCustomAvatars for merging. */
  async getUgcAvatars(): Promise<{
    success: boolean;
    avatars: Array<{
      id: string;
      name: string;
      preview?: string;
      videoPreview?: string;
      status?: string;
      isUgc: boolean;
    }>;
    error?: string;
  }> {
    try {
      console.log("[HeyGen] Fetching UGC avatars (list.get?type=ugc)...");
      const data = await this.makeRequest<{
        data?: {
          avatars?: Array<{
            avatar_id?: string;
            avatar_name?: string;
            preview_image_url?: string;
            preview_video_url?: string;
            status?: string;
          }>;
        };
      }>("/avatar/list.get?type=ugc");
      const list = data?.data?.avatars ?? [];
      const ugcAvatars = list.map((a) => ({
        id: a.avatar_id ?? "",
        name: a.avatar_name ?? a.avatar_id ?? "",
        preview: a.preview_image_url,
        videoPreview: a.preview_video_url,
        status: a.status,
        isUgc: true,
      }));
      console.log("[HeyGen] Found", ugcAvatars.length, "UGC avatars from list.get?type=ugc");
      return { success: true, avatars: ugcAvatars };
    } catch (error) {
      // Endpoint may not exist or return 404; do not fail the whole flow
      console.log("[HeyGen] UGC list endpoint not available or error:", error instanceof Error ? error.message : String(error));
      return {
        success: true,
        avatars: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
    // HeyGen video status uses V1 endpoint (v2 /video/{id} returns 404)
    const v1Url = `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`;
    if (!this.apiKey) throw new Error("HEYGEN_API_KEY is not configured.");
    const response = await fetch(v1Url, {
      method: "GET",
      headers: { "X-Api-Key": this.apiKey, "Content-Type": "application/json" },
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const errMsg = (data as { message?: string }).message ?? `HeyGen API error: ${response.status}`;
      throw new Error(errMsg);
    }
    const d = (data?.data ?? data) as Record<string, unknown> | undefined;
    let apiStatus = (d?.status ?? "pending") as string;
    if (apiStatus === "complete") apiStatus = "completed";

    let progress = 0;

    if (apiStatus === "completed") {
      progress = 100;
    } else if (apiStatus === "pending") {
      progress = 5;
    } else if (apiStatus === "processing" || apiStatus === "waiting") {
      // Use HeyGen's actual progress if available
      const rawProgress = d?.progress ?? d?.percent;
      if (rawProgress != null && typeof rawProgress === "number") {
        // HeyGen may return decimal (0.46 = 46%) or integer (46)
        progress = rawProgress < 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
        progress = Math.max(10, Math.min(99, progress));
      } else {
        progress = 50; // Fallback when API doesn't return progress
      }
    }

    const videoUrl = (d?.video_url ?? d?.videoUrl ?? (d?.video as Record<string, unknown>)?.video_url) as string | undefined;
    const thumbnailUrl = (d?.thumbnail_url ?? d?.thumbnailUrl ?? (d?.video as Record<string, unknown>)?.thumbnail_url) as string | undefined;

    return {
      status: apiStatus as HeyGenVideoStatus["status"],
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration: typeof d?.duration === "number" ? d.duration : undefined,
      error: typeof d?.error === "string" ? d.error : undefined,
      progress,
    };
  }
}

let clientInstance: HeyGenClient | null = null;

export function getHeyGenClient(): HeyGenClient {
  if (!clientInstance) clientInstance = new HeyGenClient();
  return clientInstance;
}
