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

    if (authError || !user || user.app_metadata?.is_admin !== true) {
      return NextResponse.json({ error: "Unauthorized. Administrator access required." }, { status: 403 })
    }

    const body = await req.json()
    const { courseId, thumbnailUrl } = body

    if (!thumbnailUrl || typeof thumbnailUrl !== "string" || !isValidCloudinaryUrl(thumbnailUrl)) {
      return NextResponse.json({ error: "Invalid Cloudinary thumbnail URL." }, { status: 400 })
    }

    // If a specific course ID is supplied, update the course record directly in Supabase
    if (courseId && typeof courseId === "string") {
      const { data, error: updateError } = await supabase
        .from("courses")
        .update({ thumbnail_url: thumbnailUrl })
        .eq("id", courseId)
        .select("id, title, thumbnail_url")
        .maybeSingle()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, course: data })
    }

    // Otherwise return the validated thumbnail URL for form population
    return NextResponse.json({ success: true, thumbnailUrl })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
