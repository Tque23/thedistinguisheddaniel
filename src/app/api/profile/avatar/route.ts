import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isValidCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.endsWith("cloudinary.com") &&
      parsed.pathname.includes("/image/upload/")
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
    }

    const body = await req.json()
    const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() : ""

    if (!avatarUrl || !isValidCloudinaryUrl(avatarUrl)) {
      return NextResponse.json(
        { error: "Invalid Cloudinary image URL provided." },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
        last_profile_saved_at: now,
      },
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update profile avatar." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      savedAt: now,
    })
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while saving avatar." },
      { status: 500 }
    )
  }
}
