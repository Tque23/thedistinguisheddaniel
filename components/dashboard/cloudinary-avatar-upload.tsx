"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Trash2, AlertCircle, Sparkles } from "lucide-react"

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

interface CloudinaryAvatarUploadProps {
  avatarUrl: string
  initials?: string
  avatarColor?: string
  onChange: (url: string) => void
  disabled?: boolean
  error?: string
}

/**
 * Ensures face-detection square thumbnail (c_thumb, g_face, w_400, h_400)
 * and automatic quality & format (f_auto, q_auto) are applied to the delivery URL.
 */
export function optimizeCloudinaryAvatarUrl(url: string): string {
  if (!url || typeof url !== "string") return ""
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url
  }
  if (url.includes("c_thumb") || url.includes("c_fill")) {
    return url
  }
  return url.replace("/image/upload/", "/image/upload/c_thumb,g_face,w_400,h_400/f_auto,q_auto/")
}

export function CloudinaryAvatarUpload({
  avatarUrl,
  initials = "U",
  avatarColor = "#f4ebd0",
  onChange,
  disabled = false,
  error,
}: CloudinaryAvatarUploadProps) {
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
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif", "heic"],
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        sources: ["local", "camera", "url"],
        cropping: false, // auto face detection
        // Enforce removal of external branding and attribution
        showPoweredBy: false,
        showAdvancedOptions: false,
        singleUploadAutoClose: true,
        transformation: [
          { width: 400, height: 400, crop: "thumb", gravity: "face" },
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
          setLocalError("Unable to complete upload. Please check your file format.")
          return
        }

        if (result && result.event === "uploading") {
          setIsUploading(true)
          setLocalError(null)
        }

        if (result && result.event === "success" && result.info?.secure_url) {
          setIsUploading(false)
          setLocalError(null)
          const optimized = optimizeCloudinaryAvatarUrl(result.info.secure_url)
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
      setLocalError("Unable to open photo dialog. Please refresh and try again.")
    }
  }

  const handleRemoveAvatar = () => {
    onChange("")
    setLocalError(null)
  }

  const currentDisplayUrl = avatarUrl ? optimizeCloudinaryAvatarUrl(avatarUrl) : ""
  const displayError = localError || error

  return (
    <div className="flex flex-col gap-3">
      {/* Script for Upload Widget */}
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

      {/* DDNI Branded Card Container */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm transition-all sm:flex-row sm:items-center">
        {/* Avatar Preview Frame */}
        <div className="relative group size-20 shrink-0">
          <div
            className="grid size-full place-items-center overflow-hidden rounded-2xl text-xl font-semibold shadow-xs ring-1 ring-[#d2ad55]/30 transition-transform group-hover:scale-[1.02]"
            style={{ backgroundColor: avatarColor, color: "#1a1200" }}
          >
            {currentDisplayUrl ? (
              <img
                src={currentDisplayUrl}
                alt="Profile picture"
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : (
              <span className="font-serif">{initials}</span>
            )}

            {isUploading && (
              <div className="absolute inset-0 grid place-items-center bg-[#071520]/80 backdrop-blur-xs">
                <Loader2 className="size-6 animate-spin text-[#f3d27a]" />
              </div>
            )}
          </div>

          {currentDisplayUrl && !isUploading && (
            <button
              type="button"
              onClick={handleOpenWidget}
              disabled={disabled}
              className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-[#d2ad55]/40 bg-[#0a1c2a] text-[#f3d27a] shadow-md transition hover:scale-110 hover:bg-[#071520]"
              title="Change photo"
              aria-label="Change profile photo"
            >
              <Camera className="size-3.5" />
            </button>
          )}
        </div>

        {/* Content & Action Controls */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                  Uploading…
                </>
              ) : (
                <>
                  <Camera className="size-3.5" />
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                </>
              )}
            </Button>

            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isUploading}
                onClick={handleRemoveAvatar}
                className="min-h-10 gap-1.5 px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-[#c89b3c]" />
            <span>Automatic face-centering • 1:1 square high-resolution portrait</span>
          </div>

          {!isConfigured && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Note: Update upload keys in <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">.env.local</code> to activate live uploads.
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
