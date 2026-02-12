/**
 * Video processing utility for competitor video download and transcription.
 *
 * PRIMARY APPROACH: Use Anthropic web_search to analyze video URLs directly (no download).
 * This is implemented in app/api/scripts/generate via analyzeCompetitorVideo().
 *
 * This utility is for the FALLBACK approach when exact transcripts are needed:
 * 1. Download video with yt-dlp
 * 2. Extract audio with ffmpeg
 * 3. Transcribe with OpenAI Whisper API (or local whisper)
 *
 * Requires: yt-dlp, ffmpeg, and optionally OPENAI_API_KEY for Whisper.
 */

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"
import OpenAI from "openai"

const execAsync = promisify(exec)

const ytDlpPath = process.env.YT_DLP_PATH || "yt-dlp"

export class VideoProcessor {
  private tempDir: string

  constructor(tempDir?: string) {
    this.tempDir = tempDir ?? path.join(process.cwd(), "public", "downloads", "videos")
    this.ensureTempDir()
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  /** Download video using yt-dlp */
  async downloadVideo(url: string): Promise<string> {
    console.log("[VideoProcessor] Downloading video from:", url.slice(0, 60))

    const timestamp = Date.now()
    const outputTemplate = path.join(this.tempDir, `video_${timestamp}.%(ext)s`)

    try {
      await execAsync(`"${ytDlpPath}" -f "best[ext=mp4]/best" -o "${outputTemplate}" "${url}"`, {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10,
      })

      const files = fs.readdirSync(this.tempDir).filter((f) => f.startsWith(`video_${timestamp}.`))
      const found = files[0]
      if (!found) {
        throw new Error("Video file was not created")
      }

      const fullPath = path.join(this.tempDir, found)
      console.log("[VideoProcessor] Video downloaded:", fullPath)
      return fullPath
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error("[VideoProcessor] Download failed:", msg)
      throw new Error(`Failed to download video: ${msg}`)
    }
  }

  /** Extract audio from video using ffmpeg */
  async extractAudio(videoPath: string): Promise<string> {
    console.log("[VideoProcessor] Extracting audio from:", videoPath)

    const ext = path.extname(videoPath)
    const audioPath = videoPath.replace(ext, ".mp3")

    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}" -y`,
        { timeout: 30000 }
      )

      if (!fs.existsSync(audioPath)) {
        throw new Error("Audio file was not created")
      }

      console.log("[VideoProcessor] Audio extracted:", audioPath)
      return audioPath
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error("[VideoProcessor] Audio extraction failed:", msg)
      throw new Error(`Failed to extract audio: ${msg}`)
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API.
   * Requires OPENAI_API_KEY in environment.
   */
  async transcribeWithOpenAI(audioPath: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for Whisper transcription")
    }

    console.log("[VideoProcessor] Transcribing with OpenAI Whisper API...")

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const stream = fs.createReadStream(audioPath)
    ;(stream as NodeJS.ReadableStream & { path?: string }).path = audioPath

    const transcription = await openai.audio.transcriptions.create({
      file: stream,
      model: "whisper-1",
    })

    const transcript = transcription.text?.trim() ?? ""
    console.log("[VideoProcessor] Transcription complete")
    return transcript
  }

  /** Cleanup temporary file */
  cleanup(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log("[VideoProcessor] Cleaned up:", filePath)
      }
    } catch (error) {
      console.error("[VideoProcessor] Cleanup error:", error)
    }
  }

}

/** Validate competitor video URL */
export function isValidCompetitorVideoUrl(url: string): boolean {
  const normalized = url.trim()
  if (!normalized) return false
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /tiktok\.com\/t\/[\w-]+/,
    /instagram\.com\/(p|reel)\/[\w.-]+/,
    /youtube\.com\/shorts\/[\w-]+/,
    /youtube\.com\/watch\?v=[\w-]+/,
    /youtu\.be\/[\w-]+/,
  ]
  try {
    const toTest = normalized.startsWith("http") ? normalized : `https://${normalized}`
    const u = new URL(toTest)
    const full = u.hostname + u.pathname + u.search
    return patterns.some((p) => p.test(full))
  } catch {
    return false
  }
}
