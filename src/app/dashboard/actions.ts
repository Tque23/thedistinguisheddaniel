"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type MemberProfileSubmission = {
  name: string
  title: string
  avatarUrl: string
  headline: string
  role: string
  company: string
  location: string
  website: string
  linkedinUrl: string
  skills: string[]
  bio: string
}

export async function saveMemberProfile(input: MemberProfileSubmission) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Please sign in again before saving your profile." }
  if (!input || typeof input !== "object" || !Array.isArray(input.skills)
    || ![input.name, input.title, input.avatarUrl, input.headline, input.role, input.company, input.location, input.website, input.linkedinUrl, input.bio].every((value) => typeof value === "string")
    || !input.skills.every((skill) => typeof skill === "string")) {
    return { error: "The profile details are invalid. Review the form and try again." }
  }

  const name = input.name.trim()
  const title = input.title.trim()
  const website = input.website.trim()
  const linkedinUrl = input.linkedinUrl.trim()
  if (name.length < 2 || name.length > 80 || title.length > 100 || input.headline.length > 140
    || input.role.length > 100 || input.company.length > 120 || input.location.length > 100
    || input.avatarUrl.length > 2048 || website.length > 2048 || linkedinUrl.length > 2048
    || input.bio.length > 600 || input.skills.length > 12 || input.skills.some((skill) => skill.length > 64)) {
    return { error: "Some profile details are outside the allowed limits. Review the form and try again." }
  }
  for (const value of [website, linkedinUrl, input.avatarUrl.trim()]) {
    if (value && !isHttpUrl(value)) return { error: "Profile links must use http or https." }
  }
  if (linkedinUrl && !/linkedin\.com/i.test(linkedinUrl)) return { error: "Enter a valid LinkedIn profile link." }

  const now = new Date().toISOString()
  const profile = {
    id: user.id,
    headline: input.headline.trim(),
    role: input.role.trim(),
    company: input.company.trim(),
    location: input.location.trim(),
    website,
    linkedin_url: linkedinUrl,
    bio: input.bio.trim(),
    skills: input.skills.map((skill) => skill.trim()).filter(Boolean),
    directory_visible: false,
    updated_at: now,
  }
  const { error: profileError } = await supabase.from("member_profiles").upsert(profile)
  if (profileError) return { error: "We couldn't save your professional profile. Please try again." }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      title,
      avatar_url: input.avatarUrl.trim(),
      location: profile.location,
      professional_profile_status: "pending_review",
      last_profile_saved_at: now,
    },
  })
  revalidatePath("/dashboard")
  if (updateError) return { savedAt: now, error: "Your professional details were saved, but we couldn't update your account name and photo." }
  return { savedAt: now }
}

export async function saveCommunicationPreferences(preferences: { emailUpdates: boolean; networkAlerts: boolean }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Please sign in again before saving your preferences." }
  if (typeof preferences?.emailUpdates !== "boolean" || typeof preferences?.networkAlerts !== "boolean") {
    return { error: "The preference settings are invalid. Please try again." }
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      preferences: {
        email_updates: preferences.emailUpdates,
        network_alerts: preferences.networkAlerts,
      },
    },
  })
  if (error) return { error: "We couldn't save your preferences. Please try again." }
  revalidatePath("/dashboard")
  return { saved: true }
}

export async function requestCourseAccess(courseId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Please sign in again to sign up for this course." }
  if (typeof courseId !== "string" || !courseId.trim() || courseId.length > 128) return { error: "The selected course is invalid." }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, is_free")
    .eq("id", courseId)
    .eq("published", true)
    .maybeSingle()
  if (courseError || !course) return { error: "This course is unavailable or could not be loaded." }

  const { data: existing, error: existingError } = await supabase
    .from("course_enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle()
  if (existingError) return { error: "Unable to check your current sign-up." }
  if (existing?.status === "enrolled" || existing?.status === "pending") return { requested: true }

  const status = course.is_free ? "enrolled" : "pending"
  const { error } = await supabase.from("course_enrollments").upsert(
    { user_id: user.id, course_id: course.id, status, source: "self" },
    { onConflict: "user_id,course_id" },
  )
  if (error) return { error: course.is_free ? "Unable to open this course just now." : "Unable to send your sign-up just now." }
  revalidatePath("/dashboard")
  return { requested: true }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}
