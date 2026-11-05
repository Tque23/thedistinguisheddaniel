"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ContentSection = "announcements" | "resources" | "courses" | "blog_posts"
type ContentValues = {
  title?: string | null
  body?: string | null
  resource_type?: string | null
  url?: string | null
  description?: string | null
  instructor?: string | null
  event_date?: string | null
  thumbnail_url?: string | null
  media_url?: string | null
  slug?: string | null
  category?: string | null
  duration?: string | null
  price?: string | null
  is_free?: string | null
}

const editableFields: Record<ContentSection, readonly string[]> = {
  announcements: ["title", "body"],
  resources: ["title", "resource_type", "url", "description"],
  courses: ["slug", "title", "instructor", "category", "description", "duration", "event_date", "thumbnail_url", "price", "is_free"],
  blog_posts: ["title", "instructor", "event_date", "thumbnail_url", "media_url", "body"],
}

async function adminContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || user?.app_metadata?.is_admin !== true) return null
  return { supabase, user }
}

function isContentSection(value: string): value is ContentSection {
  return value === "announcements" || value === "resources" || value === "courses" || value === "blog_posts"
}

function allowedValues(section: ContentSection, values: ContentValues): ContentValues {
  const safe: ContentValues = {}
  for (const key of editableFields[section] as (keyof ContentValues)[]) {
    const value = values[key]
    if (typeof value === "string" || value === null) safe[key] = value
  }
  return safe
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export async function saveContentItem(section: ContentSection, values: ContentValues, id?: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || !values || typeof values !== "object") return { error: "Invalid content details." }
  if (id !== undefined && (typeof id !== "string" || !id.trim())) return { error: "Invalid content item." }
  const { supabase, user } = context
  const fields = allowedValues(section, values)
  if (!Object.keys(fields).length) return { error: "No editable content was provided." }

  let error: { message: string } | null = null
  if (section === "announcements") {
    if (!fields.title?.trim() || !fields.body?.trim()) return { error: "Title and details are required." }
    const payload = { title: fields.title.trim(), body: fields.body.trim() }
    const result = id
      ? await supabase.from("announcements").update(payload).eq("id", id)
      : await supabase.from("announcements").insert({ ...payload, published: true, created_by: user.id })
    error = result.error
  } else if (section === "resources") {
    if (!fields.title?.trim() || !fields.resource_type?.trim() || !fields.url?.trim()) return { error: "Title, type and link are required." }
    if (!validHttpUrl(fields.url.trim())) return { error: "Enter a full resource link starting with https://." }
    const payload = { title: fields.title.trim(), resource_type: fields.resource_type.trim(), url: fields.url.trim(), description: fields.description?.trim() || null }
    const result = id
      ? await supabase.from("resources").update(payload).eq("id", id)
      : await supabase.from("resources").insert({ ...payload, published: true, created_by: user.id })
    error = result.error
  } else if (section === "courses") {
    if (!fields.slug?.trim() || !fields.title?.trim() || !fields.instructor?.trim()
      || (fields.is_free !== "Free" && fields.is_free !== "Paid")) {
      return { error: "Slug, title, instructor and access type are required." }
    }
    if (fields.event_date?.trim() && Number.isNaN(Date.parse(fields.event_date))) return { error: "Enter a valid course date." }
    if (fields.thumbnail_url?.trim() && !validHttpUrl(fields.thumbnail_url.trim())) return { error: "Enter a full thumbnail link starting with https://." }
    const payload = {
      slug: fields.slug.trim(),
      title: fields.title.trim(),
      instructor: fields.instructor.trim(),
      category: fields.category?.trim() || null,
      description: fields.description?.trim() || null,
      duration: fields.duration?.trim() || null,
      event_date: fields.event_date?.trim() || null,
      thumbnail_url: fields.thumbnail_url?.trim() || null,
      price: fields.price?.trim() || null,
      is_free: fields.is_free === "Free",
    }
    const result = id
      ? await supabase.from("courses").update(payload).eq("id", id)
      : await supabase.from("courses").insert({ ...payload, published: true })
    error = result.error
  } else {
    if (!fields.title?.trim() || !fields.instructor?.trim() || !fields.body?.trim()) return { error: "Title, author and body are required." }
    if (fields.event_date?.trim() && Number.isNaN(Date.parse(fields.event_date))) return { error: "Enter a valid post date." }
    for (const value of [fields.thumbnail_url, fields.media_url]) {
      if (value?.trim() && !validHttpUrl(value.trim())) return { error: "Media links must use http or https." }
    }
    const payload = {
      title: fields.title.trim(),
      instructor: fields.instructor.trim(),
      event_date: fields.event_date?.trim() || null,
      thumbnail_url: fields.thumbnail_url?.trim() || null,
      media_url: fields.media_url?.trim() || null,
      body: fields.body.trim(),
    }
    const result = id
      ? await supabase.from("blog_posts").update(payload).eq("id", id)
      : await supabase.from("blog_posts").insert({ ...payload, published: true, created_by: user.id })
    error = result.error
  }
  if (error) return { error: "Unable to save this item." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

export async function deleteContentItem(section: ContentSection, id: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || typeof id !== "string" || !id.trim()) return { error: "Invalid content item." }
  const { supabase } = context
  const result = section === "announcements"
    ? await supabase.from("announcements").delete().eq("id", id)
    : section === "resources"
      ? await supabase.from("resources").delete().eq("id", id)
      : section === "courses"
        ? await supabase.from("courses").delete().eq("id", id)
      : await supabase.from("blog_posts").delete().eq("id", id)
  if (result.error) return { error: "Unable to remove this item." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { deleted: true }
}

export async function setContentPublished(section: ContentSection, id: string, published: boolean) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || typeof id !== "string" || !id.trim() || typeof published !== "boolean") return { error: "Invalid content visibility settings." }
  const { supabase } = context
  const result = section === "announcements"
    ? await supabase.from("announcements").update({ published }).eq("id", id)
    : section === "resources"
      ? await supabase.from("resources").update({ published }).eq("id", id)
      : section === "courses"
        ? await supabase.from("courses").update({ published }).eq("id", id)
      : await supabase.from("blog_posts").update({ published }).eq("id", id)
  if (result.error) return { error: "Unable to change visibility." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

export async function saveAnnouncementSetting(title: "__dashboard_announcement__" | "__landing_announcement__", body: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (title !== "__dashboard_announcement__" && title !== "__landing_announcement__") return { error: "Invalid announcement." }
  if (typeof body !== "string") return { error: "Announcement details are invalid." }
  const { supabase, user } = context
  const text = body.trim()
  if (!text) return { error: "Announcements can't be empty." }

  const { data: existing, error: lookupError } = await supabase
    .from("announcements")
    .select("id")
    .eq("title", title)
    .maybeSingle()
  if (lookupError) return { error: "Unable to load the existing announcement." }
  const result = existing
    ? await supabase.from("announcements").update({ body: text, published: true }).eq("id", existing.id)
    : await supabase.from("announcements").insert({ title, body: text, published: true, created_by: user.id })
  if (result.error) return { error: "Unable to save this announcement." }
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

export async function setCourseAccess(userId: string, courseId: string, status: "enrolled" | "revoked") {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (typeof userId !== "string" || !userId.trim() || typeof courseId !== "string" || !courseId.trim()
    || (status !== "enrolled" && status !== "revoked")) return { error: "Invalid course access request." }
  const { supabase } = context
  const { error } = await supabase.from("course_enrollments").upsert(
    { user_id: userId, course_id: courseId, status, source: "admin", updated_at: new Date().toISOString() },
    { onConflict: "user_id,course_id" },
  )
  if (error) return { error: "Unable to update course access." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}
