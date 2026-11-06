"use client"

import { useCallback, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Loader2, Trash2, Upload, AlertCircle, Sparkles } from "lucide-react"

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: { event: string; info: { secure_url?: string; [key: string]: unknown } }
        ) => void
      ) => {
        open: () => void
        close: () => void
        destroy: () => void
      }
    }
  }
}

interface CloudinaryCourseThumbnailUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string
}

/**
 * Enforces 4:5 aspect ratio (1080x1350) with auto gravity (c_fill, g_auto, w_1080, h_1350)
 * and format & web quality compression (f_auto, q_auto).
 */
export function optimizeCourseThumbnailUrl(url: string): string {
  if (!url || typeof url !== "string") return ""
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url
  }
  if (url.includes("w_1080") && url.includes("h_1350")) {
    return url
  }
  return url.replace(
    "/image/upload/",
    "/image/upload/c_fill,g_auto,w_1080,h_1350/f_auto,q_auto/"
  )
}

export function CloudinaryCourseThumbnailUpload({
  value,
  onChange,
  disabled = false,
  error,
}: CloudinaryCourseThumbnailUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const widgetRef = useRef<ReturnType<NonNullable<Window["cloudinary"]>["createUploadWidget"]> | null>(null)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""

  const isConfigured = Boolean(
    cloudName &&
    uploadPreset &&
    cloudName !== "YOUR_CLOUD_NAME" &&
    uploadPreset !== "YOUR_UPLOAD_PRESET"
  )

  const createWidget = useCallback(() => {
    if (!window.cloudinary || !cloudName || !uploadPreset) return null

    return window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        multiple: false,
        resourceType: "image",
        maxFiles: 1,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
        sources: ["local", "url", "camera"],
        // Enforce 4:5 aspect ratio cropping in the widget UI
        cropping: true,
        croppingAspectRatio: 0.8, // 4:5 (4 / 5 = 0.8)
        croppingDefaultSelectionRatio: 0.8,
        croppingShowDimensions: true,
        showSkipCropButton: false, // Forces user to confirm 4:5 crop frame
        // Enforce removal of external branding & attribution
        showPoweredBy: false,
        showAdvancedOptions: false,
        singleUploadAutoClose: true,
        // Backend transformation during asset ingestion
        transformation: [
          { width: 1080, height: 1350, crop: "fill", gravity: "auto" },
          { fetch_format: "auto", quality: "auto" },
        ],
        theme: "minimal",
        styles: {
          palette: {
            window: "#0a1c2a",          // DDNI Deep Navy
            windowBorder: "#d2ad55",    // DDNI Gold
            tabIcon: "#f3d27a",         // Active Tab Gold
            menuIcons: "#94a3b8",       // Slate
            textDark: "#0a1c2a",
            textLight: "#f8f9fa",       // Light Text
            link: "#f3d27a",            // Gold Links
            action: "#c89b3c",          // Brand Gold Button
            inactiveTabIcon: "#475569", // Subdued Slate
            error: "#970024",           // DDNI Burgundy
            inProgress: "#d2ad55",      // Gold Progress
            complete: "#20b832",        // Green
            sourceBg: "#071520",        // Deep Ink Surface
          },
          fonts: {
            default: null,
            "'Plus Jakarta Sans', sans-serif": {
              url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
              active: true,
            },
          },
        },
      },
      (widgetError, result) => {
        if (widgetError) {
          setIsUploading(false)
          setLocalError("Unable to complete upload. Please check file format.")
          return
        }

        if (result && result.event === "uploading") {
          setIsUploading(true)
          setLocalError(null)
        }

        if (result && result.event === "success" && result.info?.secure_url) {
          setIsUploading(false)
          setLocalError(null)
          const optimized = optimizeCourseThumbnailUrl(result.info.secure_url)
          onChange(optimized)
        }

        if (result && (result.event === "close" || result.event === "abort")) {
          setIsUploading(false)
        }
      }
    )
  }, [cloudName, uploadPreset, onChange])

  const handleOpenWidget = () => {
    setLocalError(null)

    if (!isConfigured) {
      setLocalError("Upload service configuration is missing in .env.local.")
      return
    }

    if (!window.cloudinary) {
      setLocalError("Upload dialog is preparing. Please try again in a moment.")
      return
    }

    try {
      if (!widgetRef.current) {
        widgetRef.current = createWidget()
      }
      widgetRef.current?.open()
    } catch {
      setLocalError("Unable to open upload dialog. Please refresh and try again.")
    }
  }

  const handleRemove = () => {
    onChange("")
    setLocalError(null)
  }

  const displayUrl = value ? optimizeCourseThumbnailUrl(value) : ""
  const displayError = localError || error

  return (
    <div className="flex flex-col gap-3">
      {/* Upload Widget Script */}
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="afterInteractive"
      />

      {/* Embedded backdrop blur override ensuring no solid dark background */}
      <style jsx global>{`
        #cloudinary-overlay,
        .cloudinary-overlay,
        div[style*="z-index: 100000"] {
          background-color: rgba(7, 21, 32, 0.45) !important;
          backdrop-filter: blur(14px) saturate(160%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(160%) !important;
        }
        iframe[data-test="uw-iframe"],
        iframe.cloudinary-widget,
        iframe[src*="cloudinary.com"] {
          border: 1px solid rgba(210, 173, 85, 0.45) !important;
          border-radius: 1.25rem !important;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(210, 173, 85, 0.2) !important;
          overflow: hidden !important;
        }
      `}</style>

      {/* DDNI Branded Container */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm sm:flex-row sm:items-start">
        {/* 4:5 Vertical Preview Frame (1080 x 1350 ratio) */}
        <div className="group relative aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-xl border border-[#d2ad55]/30 bg-[#071520] shadow-sm sm:w-44">
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Course cover preview"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071520]/80 via-transparent to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2.5 p-3 text-center text-white/70">
              <div className="grid size-11 place-items-center rounded-full border border-[#d2ad55]/30 bg-[#0a1c2a]">
                <ImageIcon className="size-5 text-[#f3d27a]" />
              </div>
              <div className="space-y-0.5">
                <span className="font-serif text-xs font-semibold text-[#f8f5ec]">4:5 Cover</span>
                <p className="text-[10px] text-white/50">1080 × 1350 px</p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 grid place-items-center bg-[#071520]/85 backdrop-blur-xs">
              <Loader2 className="size-6 animate-spin text-[#f3d27a]" />
            </div>
          )}

          {/* 4:5 Ratio Indicator Pill */}
          <div className="absolute bottom-2 right-2 rounded-full border border-[#d2ad55]/30 bg-[#0a1c2a]/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#f3d27a] backdrop-blur-xs">
            4:5
          </div>
        </div>

        {/* Action Controls & Guidelines */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleOpenWidget}
              className="btn-gold min-h-10 gap-2 px-4 text-xs font-semibold shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  {value ? "Change Cover" : "Upload Cover"}
                </>
              )}
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                onClick={handleRemove}
                className="min-h-10 gap-1.5 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="size-3.5 shrink-0 text-[#c89b3c]" />
              <span>Locked 4:5 aspect ratio (1080 × 1350 px)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Smart crop with automatic content-aware centering, optimized as next-gen AVIF/WebP.
            </p>
          </div>

          {!isConfigured && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Note: Update upload keys in <code className="rounded bg-muted px-1 font-mono text-[10px]">.env.local</code> to activate live uploads.
            </p>
          )}
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}
