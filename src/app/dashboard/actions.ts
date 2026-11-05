"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/database.types"
import type { AssessmentSubmissionResult } from "@/lib/dashboard-data"

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

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
      if (result.error) return { error: "Unable to update your course progress. Please try again." }
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
        const message = /attempt limit reached/i.test(error.message)
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
