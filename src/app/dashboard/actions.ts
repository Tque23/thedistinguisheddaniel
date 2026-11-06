"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/database.types"
import type { AssessmentSubmissionResult } from "@/lib/dashboard-data"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

async function saveMemberProfileInternal(input: MemberProfileSubmission) {
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

async function saveCommunicationPreferencesInternal(preferences: { emailUpdates: boolean; networkAlerts: boolean }) {
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

async function requestCourseAccessInternal(courseId: string) {
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

  export async function saveMemberProfile(input: MemberProfileSubmission) {
    try {
      return await saveMemberProfileInternal(input)
    } catch (error) {
      console.error("[dashboard] saveMemberProfile failed", error)
      return { error: "We couldn't save your profile. Please try again." }
    }
  }

  export async function saveCommunicationPreferences(preferences: { emailUpdates: boolean; networkAlerts: boolean }) {
    try {
      return await saveCommunicationPreferencesInternal(preferences)
    } catch (error) {
      console.error("[dashboard] saveCommunicationPreferences failed", error)
      return { error: "We couldn't save your preferences. Please try again." }
    }
  }

  export async function requestCourseAccess(courseId: string) {
    try {
      return await requestCourseAccessInternal(courseId)
    } catch (error) {
      console.error("[dashboard] requestCourseAccess failed", error)
      return { error: "Unable to send your course sign-up. Please try again." }
    }
  }

  async function getDashboardUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { error: "Please sign in again to update your saved items." } as const
    return { supabase, user } as const
  }

  export async function toggleSaveResource(resourceId: string) {
    try {
      const context = await getDashboardUser()
      if ("error" in context) return context
      if (typeof resourceId !== "string" || !uuidPattern.test(resourceId)) return { error: "The selected resource is invalid." }

      const { data: existing, error: lookupError } = await context.supabase
        .from("saved_resources")
        .select("resource_id")
        .eq("user_id", context.user.id)
        .eq("resource_id", resourceId)
        .maybeSingle()
      if (lookupError) return { error: "Unable to update your saved resources." }

      if (existing) {
        const { error } = await context.supabase.from("saved_resources")
          .delete().eq("user_id", context.user.id).eq("resource_id", resourceId)
        if (error) return { error: "Unable to update your saved resources." }
        revalidatePath("/dashboard")
        return { saved: false }
      }

      const { data: resource, error: resourceError } = await context.supabase
        .from("resources").select("id").eq("id", resourceId).eq("published", true).maybeSingle()
      if (resourceError || !resource) return { error: "This resource is unavailable." }
      const { error } = await context.supabase.from("saved_resources")
        .insert({ user_id: context.user.id, resource_id: resourceId })
      if (error) return { error: "Unable to update your saved resources." }
      revalidatePath("/dashboard")
      return { saved: true }
    } catch (error) {
      console.error("[dashboard] toggleSaveResource failed", error)
      return { error: "Unable to update your saved resources. Please try again." }
    }
  }

  export async function toggleSaveOpportunity(opportunityId: string) {
    try {
      const context = await getDashboardUser()
      if ("error" in context) return context
      if (typeof opportunityId !== "string" || !uuidPattern.test(opportunityId)) return { error: "The selected opportunity is invalid." }

      const { data: existing, error: lookupError } = await context.supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("user_id", context.user.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle()
      if (lookupError) return { error: "Unable to update your saved opportunities." }

      if (existing) {
        const { error } = await context.supabase.from("saved_opportunities")
          .delete().eq("user_id", context.user.id).eq("opportunity_id", opportunityId)
        if (error) return { error: "Unable to update your saved opportunities." }
        revalidatePath("/dashboard")
        return { saved: false }
      }

      const { data: opportunity, error: opportunityError } = await context.supabase
        .from("announcements").select("id").eq("id", opportunityId).eq("published", true).maybeSingle()
      if (opportunityError || !opportunity) return { error: "This opportunity is unavailable." }
      const { error } = await context.supabase.from("saved_opportunities")
        .insert({ user_id: context.user.id, opportunity_id: opportunityId })
      if (error) return { error: "Unable to update your saved opportunities." }
      revalidatePath("/dashboard")
      return { saved: true }
    } catch (error) {
      console.error("[dashboard] toggleSaveOpportunity failed", error)
      return { error: "Unable to update your saved opportunities. Please try again." }
    }
  }

  export async function setAnnouncementRead(announcementId: string, read: boolean) {
    try {
      const context = await getDashboardUser()
      if ("error" in context) return context
      if (typeof announcementId !== "string" || !uuidPattern.test(announcementId) || typeof read !== "boolean") {
        return { error: "The announcement read status is invalid." }
      }

      if (read) {
        const { data: announcement, error: announcementError } = await context.supabase
          .from("announcements").select("id").eq("id", announcementId).eq("published", true).maybeSingle()
        if (announcementError || !announcement) return { error: "This announcement is unavailable." }
        const { error } = await context.supabase.from("announcement_reads")
          .upsert({ user_id: context.user.id, announcement_id: announcementId }, { onConflict: "user_id,announcement_id" })
        if (error) return { error: "Unable to update announcement read status." }
      } else {
        const { error } = await context.supabase.from("announcement_reads")
          .delete().eq("user_id", context.user.id).eq("announcement_id", announcementId)
        if (error) return { error: "Unable to update announcement read status." }
      }
      revalidatePath("/dashboard")
      return { saved: true }
    } catch (error) {
      console.error("[dashboard] setAnnouncementRead failed", error)
      return { error: "Unable to update announcement read status. Please try again." }
    }
  }

  export async function markAnnouncementsRead(announcementIds: string[]) {
    try {
      const context = await getDashboardUser()
      if ("error" in context) return context
      if (!Array.isArray(announcementIds) || announcementIds.length > 50
        || new Set(announcementIds).size !== announcementIds.length
        || announcementIds.some((id) => typeof id !== "string" || !uuidPattern.test(id))) {
        return { error: "The announcement list is invalid." }
      }
      if (announcementIds.length) {
        const { error } = await context.supabase.from("announcement_reads").upsert(
          announcementIds.map((announcement_id) => ({ user_id: context.user.id, announcement_id })),
          { onConflict: "user_id,announcement_id" },
        )
        if (error) return { error: "Unable to mark announcements as read." }
      }
      revalidatePath("/dashboard")
      return { saved: true }
    } catch (error) {
      console.error("[dashboard] markAnnouncementsRead failed", error)
      return { error: "Unable to mark announcements as read. Please try again." }
    }
  }

  export async function setCourseSessionCompletion(sessionId: string, complete: boolean) {
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return { error: "Please sign in again to update your course progress." }
      if (!uuidPattern.test(sessionId) || typeof complete !== "boolean") return { error: "The selected session is invalid." }

      const { data: session, error: sessionError } = await supabase
        .from("course_sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle()
      if (sessionError || !session) return { error: "This session is unavailable or you do not have course access." }

      const result = complete
        ? await supabase.from("course_session_completions").upsert(
          { user_id: user.id, session_id: session.id },
          { onConflict: "user_id,session_id", ignoreDuplicates: true },
        )
        : await supabase.from("course_session_completions").delete().eq("user_id", user.id).eq("session_id", session.id)
      if (result.error) {
        return { error: /row-level security|policy/i.test(result.error.message)
          ? "Complete earlier required lessons before marking this lesson complete."
          : "Unable to update your course progress. Please try again." }
      }
      revalidatePath("/dashboard")
      return { saved: true }
    } catch (error) {
      console.error("[dashboard] setCourseSessionCompletion failed", error)
      return { error: "Unable to update your course progress. Please try again." }
    }
  }

  type AssessmentAnswerInput = { questionId: string; answer: string }

  function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
    return typeof value === "object" && value !== null && !Array.isArray(value)
  }

  export async function submitCourseAssessment(assessmentId: string, answers: AssessmentAnswerInput[]) {
    try {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return { error: "Please sign in again to submit your assessment." }
      if (!uuidPattern.test(assessmentId) || !Array.isArray(answers) || answers.length < 1 || answers.length > 100
        || answers.some((answer) => !answer || !uuidPattern.test(answer.questionId) || typeof answer.answer !== "string" || answer.answer.length > 5000)
        || new Set(answers.map((answer) => answer.questionId)).size !== answers.length) {
        return { error: "The assessment answers are invalid. Review them and try again." }
      }

      const { data, error } = await supabase.rpc("submit_course_assessment", {
        p_assessment_id: assessmentId,
        p_answers: answers.map((answer) => ({ question_id: answer.questionId, answer: answer.answer })) as Json,
      })
      if (error) {
        const message = /not open yet/i.test(error.message)
          ? "This assessment has not opened yet."
          : /assessment is closed/i.test(error.message)
            ? "This assessment is closed."
            : /complete the required lessons/i.test(error.message)
              ? "Complete the required lessons before submitting this assessment."
              : /attempt limit reached/i.test(error.message)
          ? "You have used all allowed attempts for this assessment."
          : /answer every assessment question|select one of the available answers/i.test(error.message)
            ? "Answer each question and select an available option."
            : "Unable to submit your assessment. Check your answers and try again."
        return { error: message }
      }
      if (!isJsonObject(data)) {
        console.error("[dashboard] submit_course_assessment returned an invalid response")
        return { error: "Your assessment could not be confirmed. Refresh and check your results." }
      }

      const { attempt_id: attemptId, score, max_score: maxScore, needs_review: needsReview, attempts_used: attemptsUsed, attempts_allowed: attemptsAllowed } = data
      if (typeof attemptId !== "string" || typeof score !== "number" || typeof maxScore !== "number"
        || typeof needsReview !== "boolean" || typeof attemptsUsed !== "number" || typeof attemptsAllowed !== "number") {
        console.error("[dashboard] submit_course_assessment returned incomplete result data")
        return { error: "Your assessment could not be confirmed. Refresh and check your results." }
      }

      revalidatePath("/dashboard")
      return {
        submitted: true,
        result: {
          attemptId,
          score,
          maxScore,
          needsReview,
          attemptsUsed,
          attemptsAllowed,
        } satisfies AssessmentSubmissionResult,
      }
    } catch (error) {
      console.error("[dashboard] submitCourseAssessment failed", error)
      return { error: "Unable to submit your assessment. Please try again." }
    }
}
