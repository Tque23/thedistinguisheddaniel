"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"

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

async function withActionErrors<T extends object>(name: string, fallback: string, action: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await action()
  } catch (error) {
    console.error(`[admin] ${name} failed`, error)
    return { error: fallback }
  }
}

async function saveContentItemInternal(section: ContentSection, values: ContentValues, id?: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || !values || typeof values !== "object") return { error: "Invalid content details." }
  if (id !== undefined && (typeof id !== "string" || !id.trim())) return { error: "Invalid content item." }
  const { supabase, user } = context
  const fields = allowedValues(section, values)
  if (!Object.keys(fields).length) return { error: "No editable content was provided." }

  let error: { message: string } | null = null
  let saved = false
  if (section === "announcements") {
    if (!fields.title?.trim() || !fields.body?.trim()) return { error: "Title and details are required." }
    const payload = { title: fields.title.trim(), body: fields.body.trim() }
    const result = id
      ? await supabase.from("announcements").update(payload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("announcements").insert({ ...payload, published: true, created_by: user.id }).select("id").maybeSingle()
    error = result.error
    saved = Boolean(result.data)
  } else if (section === "resources") {
    if (!fields.title?.trim() || !fields.resource_type?.trim() || !fields.url?.trim()) return { error: "Title, type and link are required." }
    if (!validHttpUrl(fields.url.trim())) return { error: "Enter a full resource link starting with https://." }
    const payload = { title: fields.title.trim(), resource_type: fields.resource_type.trim(), url: fields.url.trim(), description: fields.description?.trim() || null }
    const result = id
      ? await supabase.from("resources").update(payload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("resources").insert({ ...payload, published: true, created_by: user.id }).select("id").maybeSingle()
    error = result.error
    saved = Boolean(result.data)
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
      ? await supabase.from("courses").update(payload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("courses").insert({ ...payload, published: true }).select("id").maybeSingle()
    error = result.error
    saved = Boolean(result.data)
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
      ? await supabase.from("blog_posts").update(payload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("blog_posts").insert({ ...payload, published: true, created_by: user.id }).select("id").maybeSingle()
    error = result.error
    saved = Boolean(result.data)
  }
  if (error || !saved) return { error: "Unable to save this item." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

async function deleteContentItemInternal(section: ContentSection, id: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || typeof id !== "string" || !id.trim()) return { error: "Invalid content item." }
  const { supabase } = context
  const result = section === "announcements"
    ? await supabase.from("announcements").delete().eq("id", id).select("id").maybeSingle()
    : section === "resources"
      ? await supabase.from("resources").delete().eq("id", id).select("id").maybeSingle()
      : section === "courses"
        ? await supabase.from("courses").delete().eq("id", id).select("id").maybeSingle()
      : await supabase.from("blog_posts").delete().eq("id", id).select("id").maybeSingle()
  if (result.error || !result.data) return { error: "Unable to remove this item." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { deleted: true }
}

async function setContentPublishedInternal(section: ContentSection, id: string, published: boolean) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (!isContentSection(section) || typeof id !== "string" || !id.trim() || typeof published !== "boolean") return { error: "Invalid content visibility settings." }
  const { supabase } = context
  const result = section === "announcements"
    ? await supabase.from("announcements").update({ published }).eq("id", id).select("id").maybeSingle()
    : section === "resources"
      ? await supabase.from("resources").update({ published }).eq("id", id).select("id").maybeSingle()
      : section === "courses"
        ? await supabase.from("courses").update({ published }).eq("id", id).select("id").maybeSingle()
      : await supabase.from("blog_posts").update({ published }).eq("id", id).select("id").maybeSingle()
  if (result.error || !result.data) return { error: "Unable to change visibility." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

async function saveAnnouncementSettingInternal(title: "__dashboard_announcement__" | "__landing_announcement__", body: string) {
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
    ? await supabase.from("announcements").update({ body: text, published: true }).eq("id", existing.id).select("id").maybeSingle()
    : await supabase.from("announcements").insert({ title, body: text, published: true, created_by: user.id }).select("id").maybeSingle()
  if (result.error || !result.data) return { error: "Unable to save this announcement." }
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

async function setCourseAccessInternal(userId: string, courseId: string, status: "enrolled" | "revoked") {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  if (typeof userId !== "string" || !userId.trim() || typeof courseId !== "string" || !courseId.trim()
    || (status !== "enrolled" && status !== "revoked")) return { error: "Invalid course access request." }
  const { supabase } = context
  const { data, error } = await supabase.from("course_enrollments").upsert(
    { user_id: userId, course_id: courseId, status, source: "admin", updated_at: new Date().toISOString() },
    { onConflict: "user_id,course_id" },
  ).select("id").maybeSingle()
  if (error || !data) return { error: "Unable to update course access." }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { saved: true }
}

async function issueCourseCertificateInternal(userId: string, courseId: string) {
  const context = await adminContext()
  if (!context) return { error: "Administrator access is required." }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(userId) || !uuidPattern.test(courseId)) return { error: "Select a valid member and course." }

  const serviceClient = createAdminClient()
  const [{ data: enrollment, error: enrollmentError }, { data: course, error: courseError }, { data: target, error: userError }] = await Promise.all([
    serviceClient.from("course_enrollments").select("status").eq("user_id", userId).eq("course_id", courseId).maybeSingle(),
    serviceClient.from("courses").select("title, instructor").eq("id", courseId).maybeSingle(),
    serviceClient.auth.admin.getUserById(userId),
  ])
  if (enrollmentError || courseError || userError) return { error: "Unable to verify course completion details." }
  if (enrollment?.status !== "enrolled" || !course || !target.user) {
    return { error: "A certificate can only be issued to an enrolled member for an existing course." }
  }

  const metadata = target.user.user_metadata ?? {}
  const nameParts = [metadata.first_name, metadata.last_name].filter((part): part is string => typeof part === "string" && part.trim().length > 0)
  const memberName = [metadata.full_name, metadata.name].find((name) => typeof name === "string" && name.trim().length > 0)
  const name = typeof memberName === "string" ? memberName.trim() : nameParts.join(" ") || target.user.email?.split("@")[0] || "DDNI Member"
  const { error } = await serviceClient.from("course_certificates").insert({
    user_id: userId,
    course_id: courseId,
    member_name: name,
    course_title: course.title,
    instructor: course.instructor,
    issued_by: context.user.id,
  })
  if (error?.code === "23505") return { error: "A certificate has already been issued for this member and course." }
  if (error) return { error: "Unable to issue this certificate." }

  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return { issued: true }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function saveContentItem(section: ContentSection, values: ContentValues, id?: string) {
  return withActionErrors("saveContentItem", "Unable to save this item. Please try again.", () => saveContentItemInternal(section, values, id))
}

export async function deleteContentItem(section: ContentSection, id: string) {
  return withActionErrors("deleteContentItem", "Unable to remove this item. Please try again.", () => deleteContentItemInternal(section, id))
}

export async function setContentPublished(section: ContentSection, id: string, published: boolean) {
  return withActionErrors("setContentPublished", "Unable to change visibility. Please try again.", () => setContentPublishedInternal(section, id, published))
}

export async function saveAnnouncementSetting(title: "__dashboard_announcement__" | "__landing_announcement__", body: string) {
  return withActionErrors("saveAnnouncementSetting", "Unable to save this announcement. Please try again.", () => saveAnnouncementSettingInternal(title, body))
}

export async function setCourseAccess(userId: string, courseId: string, status: "enrolled" | "revoked") {
  return withActionErrors("setCourseAccess", "Unable to update course access. Please try again.", () => setCourseAccessInternal(userId, courseId, status))
}

export async function issueCourseCertificate(userId: string, courseId: string) {
  return withActionErrors("issueCourseCertificate", "Unable to issue this certificate. Please try again.", () => issueCourseCertificateInternal(userId, courseId))
}

export type LearningPathSubmission = {
  id?: string
  courseId: string
  title: string
  description: string
  published: boolean
}

export async function saveLearningPath(input: LearningPathSubmission) {
  return withActionErrors("saveLearningPath", "Unable to save this learning path. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (!input || typeof input !== "object" || !uuidPattern.test(input.courseId)
      || (input.id !== undefined && !uuidPattern.test(input.id))
      || typeof input.title !== "string" || input.title.trim().length < 2 || input.title.trim().length > 160
      || typeof input.description !== "string" || input.description.length > 2000
      || typeof input.published !== "boolean") {
      return { error: "Learning path details are invalid." }
    }

    const values = {
      title: input.title.trim(),
      description: input.description.trim(),
      published: input.published,
      updated_at: new Date().toISOString(),
    }
    const result = input.id
      ? await context.supabase.from("course_learning_paths").update(values).eq("id", input.id).eq("course_id", input.courseId).select("id").maybeSingle()
      : await context.supabase.from("course_learning_paths").insert({
        ...values,
        course_id: input.courseId,
        created_by: context.user.id,
      }).select("id").maybeSingle()
    if (result.error) return { error: "Unable to save this learning path." }
    if (!result.data) return { error: "This learning path could not be found." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true, id: result.data.id }
  })
}

export async function deleteLearningPath(id: string) {
  return withActionErrors("deleteLearningPath", "Unable to remove this learning path. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (typeof id !== "string" || !uuidPattern.test(id)) return { error: "Select a valid learning path." }
    const { data, error } = await context.supabase.from("course_learning_paths").delete().eq("id", id).select("id").maybeSingle()
    if (error || !data) return { error: "Unable to remove this learning path." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { deleted: true }
  })
}

export type CourseSessionSubmission = {
  id?: string
  courseId: string
  pathId: string | null
  title: string
  description: string
  videoUrl: string
  durationMinutes: number
  position: number
  published: boolean
}

export async function saveCourseSession(input: CourseSessionSubmission) {
  return withActionErrors("saveCourseSession", "Unable to save this session. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (!input || typeof input !== "object" || !uuidPattern.test(input.courseId)
      || (input.id !== undefined && !uuidPattern.test(input.id))
      || (input.pathId !== null && !uuidPattern.test(input.pathId))
      || typeof input.title !== "string" || input.title.trim().length < 2 || input.title.trim().length > 160
      || typeof input.description !== "string" || input.description.length > 5000
      || typeof input.videoUrl !== "string" || input.videoUrl.length > 2048
      || (input.videoUrl.trim() && !validHttpUrl(input.videoUrl.trim()))
      || !Number.isInteger(input.durationMinutes) || input.durationMinutes < 0 || input.durationMinutes > 1440
      || !Number.isInteger(input.position) || input.position < 0 || input.position > 10000
      || typeof input.published !== "boolean") {
      return { error: "Session details are invalid." }
    }

    if (input.pathId) {
      const { data: path, error } = await context.supabase
        .from("course_learning_paths")
        .select("id")
        .eq("id", input.pathId)
        .eq("course_id", input.courseId)
        .maybeSingle()
      if (error || !path) return { error: "Choose a learning path for this course." }
    }
    const values = {
      path_id: input.pathId,
      title: input.title.trim(),
      description: input.description.trim(),
      video_url: input.videoUrl.trim() || null,
      duration_minutes: input.durationMinutes,
      position: input.position,
      published: input.published,
      updated_at: new Date().toISOString(),
    }
    const result = input.id
      ? await context.supabase.from("course_sessions").update(values).eq("id", input.id).eq("course_id", input.courseId).select("id").maybeSingle()
      : await context.supabase.from("course_sessions").insert({
        ...values,
        course_id: input.courseId,
        created_by: context.user.id,
      }).select("id").maybeSingle()
    if (result.error) return { error: "Unable to save this session." }
    if (!result.data) return { error: "This session could not be found." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true, id: result.data.id }
  })
}

export async function deleteCourseSession(id: string) {
  return withActionErrors("deleteCourseSession", "Unable to remove this session. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (typeof id !== "string" || !uuidPattern.test(id)) return { error: "Select a valid session." }
    const { count, error: completionError } = await context.supabase
      .from("course_session_completions")
      .select("session_id", { count: "exact", head: true })
      .eq("session_id", id)
    if (completionError) return { error: "Unable to check whether members completed this session." }
    if (count) return { error: "Members have completed this session. Unpublish it instead to preserve progress." }
    const { data, error } = await context.supabase.from("course_sessions").delete().eq("id", id).select("id").maybeSingle()
    if (error || !data) return { error: "Unable to remove this session." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { deleted: true }
  })
}

export type CourseMaterialSubmission = {
  id?: string
  courseId: string
  sessionId: string | null
  title: string
  description: string
  resourceType: string
  url: string
  position: number
  published: boolean
}

export async function saveCourseMaterial(input: CourseMaterialSubmission) {
  return withActionErrors("saveCourseMaterial", "Unable to save this material. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (!input || typeof input !== "object" || !uuidPattern.test(input.courseId)
      || (input.id !== undefined && !uuidPattern.test(input.id))
      || (input.sessionId !== null && !uuidPattern.test(input.sessionId))
      || typeof input.title !== "string" || input.title.trim().length < 2 || input.title.trim().length > 160
      || typeof input.description !== "string" || input.description.length > 2000
      || typeof input.resourceType !== "string" || input.resourceType.trim().length < 2 || input.resourceType.trim().length > 40
      || typeof input.url !== "string" || input.url.length > 2048 || !validHttpUrl(input.url.trim())
      || !Number.isInteger(input.position) || input.position < 0 || input.position > 10000
      || typeof input.published !== "boolean") {
      return { error: "Material details are invalid." }
    }
    if (input.sessionId) {
      const { data: session, error } = await context.supabase
        .from("course_sessions")
        .select("id")
        .eq("id", input.sessionId)
        .eq("course_id", input.courseId)
        .maybeSingle()
      if (error || !session) return { error: "Choose a session from this course." }
    }
    const values = {
      session_id: input.sessionId,
      title: input.title.trim(),
      description: input.description.trim(),
      resource_type: input.resourceType.trim(),
      url: input.url.trim(),
      position: input.position,
      published: input.published,
      updated_at: new Date().toISOString(),
    }
    const result = input.id
      ? await context.supabase.from("course_materials").update(values).eq("id", input.id).eq("course_id", input.courseId).select("id").maybeSingle()
      : await context.supabase.from("course_materials").insert({
        ...values,
        course_id: input.courseId,
        created_by: context.user.id,
      }).select("id").maybeSingle()
    if (result.error) return { error: "Unable to save this material." }
    if (!result.data) return { error: "This material could not be found." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true, id: result.data.id }
  })
}

export async function deleteCourseMaterial(id: string) {
  return withActionErrors("deleteCourseMaterial", "Unable to remove this material. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (typeof id !== "string" || !uuidPattern.test(id)) return { error: "Select a valid material." }
    const { data, error } = await context.supabase.from("course_materials").delete().eq("id", id).select("id").maybeSingle()
    if (error || !data) return { error: "Unable to remove this material." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { deleted: true }
  })
}

export type AssessmentQuestionSubmission = {
  prompt: string
  questionType: "multiple_choice" | "true_false" | "written"
  options: string[]
  correctAnswer: string | null
  points: number
}

export type CourseAssessmentSubmission = {
  id?: string
  courseId: string
  sessionId: string | null
  title: string
  instructions: string
  maxAttempts: number
  published: boolean
  questions: AssessmentQuestionSubmission[]
}

export async function saveCourseAssessment(input: CourseAssessmentSubmission) {
  return withActionErrors("saveCourseAssessment", "Unable to save this assessment. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (!input || typeof input !== "object" || !uuidPattern.test(input.courseId)
      || (input.id !== undefined && !uuidPattern.test(input.id))
      || (input.sessionId !== null && !uuidPattern.test(input.sessionId))
      || typeof input.title !== "string" || input.title.trim().length < 2 || input.title.trim().length > 160
      || typeof input.instructions !== "string" || input.instructions.length > 2000
      || !Number.isInteger(input.maxAttempts) || input.maxAttempts < 1 || input.maxAttempts > 50
      || typeof input.published !== "boolean" || !Array.isArray(input.questions) || input.questions.length < 1 || input.questions.length > 100) {
      return { error: "Assessment details are invalid." }
    }
    for (const question of input.questions) {
      if (!question || typeof question.prompt !== "string" || question.prompt.trim().length < 2 || question.prompt.trim().length > 2000
        || !Number.isInteger(question.points) || question.points < 1 || question.points > 100
        || !["multiple_choice", "true_false", "written"].includes(question.questionType)
        || !Array.isArray(question.options) || question.options.some((option) => typeof option !== "string")) {
        return { error: "One or more assessment questions are invalid." }
      }
      if (question.questionType === "multiple_choice") {
        const options = question.options.map((option) => option.trim())
        if (options.length < 2 || options.length > 10 || options.some((option) => !option || option.length > 300)
          || new Set(options.map((option) => option.toLowerCase())).size !== options.length
          || typeof question.correctAnswer !== "string" || !options.includes(question.correctAnswer.trim())) {
          return { error: "Multiple-choice questions need distinct options and one correct answer." }
        }
      } else if (question.questionType === "true_false") {
        if (question.correctAnswer !== "True" && question.correctAnswer !== "False") return { error: "Choose the correct true/false answer." }
      } else if (question.options.length !== 0 || question.correctAnswer !== null) {
        return { error: "Written questions cannot include answer options." }
      }
    }

    const questions = input.questions.map((question) => ({
      prompt: question.prompt.trim(),
      question_type: question.questionType,
      options: question.questionType === "multiple_choice"
        ? question.options.map((option) => option.trim())
        : question.questionType === "true_false" ? ["True", "False"] : [],
      correct_answer: question.questionType === "written" ? null : question.correctAnswer?.trim() ?? null,
      points: question.points,
    })) as Json
    const { data, error } = await context.supabase.rpc("save_course_assessment", {
      p_assessment_id: input.id ?? null,
      p_course_id: input.courseId,
      p_session_id: input.sessionId,
      p_title: input.title.trim(),
      p_instructions: input.instructions.trim(),
      p_max_attempts: input.maxAttempts,
      p_published: input.published,
      p_questions: questions,
    })
    if (error) {
      return { error: /member attempts/i.test(error.message)
        ? "This assessment has member attempts. Create a new assessment to change its questions."
        : "Unable to save this assessment." }
    }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true, id: data }
  })
}

export async function deleteCourseAssessment(id: string) {
  return withActionErrors("deleteCourseAssessment", "Unable to remove this assessment. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (typeof id !== "string" || !uuidPattern.test(id)) return { error: "Select a valid assessment." }
    const { data, error } = await context.supabase.from("course_assessments").delete().eq("id", id).select("id").maybeSingle()
    if (error) {
      return { error: /foreign key|violates/i.test(error.message)
        ? "This assessment has member attempts and cannot be deleted. Unpublish it instead."
        : "Unable to remove this assessment." }
    }
    if (!data) return { error: "This assessment could not be found." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { deleted: true }
  })
}

export async function setLearningItemPublished(kind: "path" | "session" | "material" | "assessment", id: string, published: boolean) {
  return withActionErrors("setLearningItemPublished", "Unable to change visibility. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (!["path", "session", "material", "assessment"].includes(kind)
      || typeof id !== "string" || !uuidPattern.test(id) || typeof published !== "boolean") {
      return { error: "Visibility settings are invalid." }
    }
    if (kind === "assessment" && published) {
      const { data: questions, error } = await context.supabase
        .from("course_assessment_questions")
        .select("id, question_type")
        .eq("assessment_id", id)
      if (error || !questions?.length) return { error: "Add at least one question before publishing this assessment." }
      const objectiveIds = questions.filter((question) => question.question_type !== "written").map((question) => question.id)
      if (objectiveIds.length) {
        const { data: keys, error: keyError } = await context.supabase
          .from("course_assessment_answer_keys")
          .select("question_id")
          .in("question_id", objectiveIds)
        if (keyError || keys?.length !== objectiveIds.length) return { error: "Add an answer key for every scored question before publishing." }
      }
    }
    const result = kind === "path"
      ? await context.supabase.from("course_learning_paths").update({ published, updated_at: new Date().toISOString() }).eq("id", id)
      : kind === "session"
        ? await context.supabase.from("course_sessions").update({ published, updated_at: new Date().toISOString() }).eq("id", id)
        : kind === "material"
          ? await context.supabase.from("course_materials").update({ published, updated_at: new Date().toISOString() }).eq("id", id)
          : await context.supabase.from("course_assessments").update({ published, updated_at: new Date().toISOString() }).eq("id", id)
    if (result.error) return { error: "Unable to change visibility." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true }
  })
}

export type AssessmentGradeSubmission = {
  questionId: string
  pointsAwarded: number
  feedback: string
}

export async function gradeAssessmentAttempt(attemptId: string, grades: AssessmentGradeSubmission[]) {
  return withActionErrors("gradeAssessmentAttempt", "Unable to save assessment grades. Please try again.", async () => {
    const context = await adminContext()
    if (!context) return { error: "Administrator access is required." }
    if (typeof attemptId !== "string" || !uuidPattern.test(attemptId) || !Array.isArray(grades)
      || grades.length < 1 || grades.length > 100
      || grades.some((grade) => !grade || !uuidPattern.test(grade.questionId)
        || !Number.isInteger(grade.pointsAwarded) || grade.pointsAwarded < 0
        || typeof grade.feedback !== "string" || grade.feedback.length > 1000)
      || new Set(grades.map((grade) => grade.questionId)).size !== grades.length) {
      return { error: "Assessment grades are invalid." }
    }
    const p_grades = grades.map((grade) => ({
      question_id: grade.questionId,
      points_awarded: grade.pointsAwarded,
      feedback: grade.feedback.trim(),
    })) as Json
    const { data, error } = await context.supabase.rpc("grade_course_assessment_attempt", {
      p_attempt_id: attemptId,
      p_grades,
    })
    if (error) return { error: "Unable to save assessment grades." }
    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { saved: true, result: data }
  })
}
