export const SUPPORT_EMAIL = "Info@distinguisheddaniel.com"
export const SUPPORT_PHONE = "+27 83 250 6306"
export const SUPPORT_PHONE_HREF = "tel:+27832506306"
export const SUPPORT_WHATSAPP_HREF = "https://wa.me/27832506306"

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Opportunity = {
  id: string
  title: string
  description: string
  createdAt: string
}

export type CourseEnrollmentStatus = "pending" | "enrolled" | "revoked"

export type Course = {
  id: string
  slug: string
  title: string
  instructor: string
  category: string
  description: string
  duration: string
  eventDate: string
  thumbnailUrl: string
  price: string
  isFree: boolean
  createdAt: string
}

export type CourseEnrollment = {
  id: string
  courseId: string
  userId: string
  status: CourseEnrollmentStatus
  source: string
  createdAt: string
}

export type Resource = {
  id: string
  title: string
  description: string
  url: string
  type: string
  createdAt: string
}

export type CourseCertificate = {
  id: string
  courseId: string | null
  memberName: string
  courseTitle: string
  instructor: string
  certificateCode: string
  issuedAt: string
}

export type CourseLearningPath = {
  id: string
  courseId: string
  title: string
  description: string
  published: boolean
  createdAt: string
}

export type CourseSession = {
  id: string
  courseId: string
  pathId: string | null
  title: string
  description: string
  videoUrl: string
  durationMinutes: number
  position: number
  published: boolean
}

export type CourseMaterial = {
  id: string
  courseId: string
  sessionId: string | null
  title: string
  description: string
  resourceType: string
  url: string
  position: number
}

export type CourseQuestionType = "multiple_choice" | "true_false" | "written"

export type CourseAssessment = {
  id: string
  courseId: string
  sessionId: string | null
  title: string
  instructions: string
  maxAttempts: number
}

export type CourseAssessmentQuestion = {
  id: string
  assessmentId: string
  prompt: string
  questionType: CourseQuestionType
  options: string[]
  points: number
  position: number
}

export type CourseAssessmentAttempt = {
  id: string
  assessmentId: string
  userId: string
  status: "pending_review" | "graded"
  score: number
  maxScore: number
  submittedAt: string
  gradedAt: string
}

export type CourseAssessmentAnswer = {
  id: string
  attemptId: string
  questionId: string
  answer: string
  isCorrect: boolean | null
  pointsAwarded: number | null
  feedback: string
}

export type CourseSessionCompletion = {
  sessionId: string
  completedAt: string
}

export type AssessmentSubmissionResult = {
  attemptId: string
  score: number
  maxScore: number
  needsReview: boolean
  attemptsUsed: number
  attemptsAllowed: number
}

export type MemberProfile = {
  headline: string
  company: string
  role: string
  bio: string
  location: string
  website: string
  linkedinUrl: string
  skills: string[]
  updatedAt: string
}

export type DirectoryMember = MemberProfile & {
  id: string
  name: string
}

export const emptyProfile: MemberProfile = {
  headline: "",
  company: "",
  role: "",
  bio: "",
  location: "",
  website: "",
  linkedinUrl: "",
  skills: [],
  updatedAt: "",
}

type Row = Record<string, unknown>

const text = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value))

export function normalizeSkills(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).map((skill) => skill.trim()).filter(Boolean)
  if (typeof value === "string") return value.split(",").map((skill) => skill.trim()).filter(Boolean)
  return []
}

export function toOpportunity(row: Row): Opportunity {
  return { id: text(row.id), title: text(row.title), description: text(row.body), createdAt: text(row.created_at) }
}

export function toCourse(row: Row): Course {
  return {
    id: text(row.id),
    slug: text(row.slug),
    title: text(row.title),
    instructor: text(row.instructor),
    category: text(row.category) || "Course",
    description: text(row.description),
    duration: text(row.duration),
    eventDate: text(row.event_date),
    thumbnailUrl: text(row.thumbnail_url),
    price: text(row.price),
    isFree: row.is_free === true,
    createdAt: text(row.created_at),
  }
}

export function toEnrollment(row: Row): CourseEnrollment {
  const status = text(row.status)
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    userId: text(row.user_id),
    status: status === "enrolled" || status === "revoked" ? status : "pending",
    source: text(row.source),
    createdAt: text(row.created_at),
  }
}

export function enrollmentFor(enrollments: CourseEnrollment[], courseId: string) {
  return enrollments.find((enrollment) => enrollment.courseId === courseId)
}

export function hasCourseAccess(enrollments: CourseEnrollment[], courseId: string) {
  return enrollmentFor(enrollments, courseId)?.status === "enrolled"
}

export function toResource(row: Row): Resource {
  return {
    id: text(row.id),
    title: text(row.title),
    description: text(row.description),
    url: text(row.url),
    type: text(row.resource_type) || "Resource",
    createdAt: text(row.created_at),
  }
}

export function toCourseCertificate(row: Row): CourseCertificate {
  return {
    id: text(row.id),
    courseId: row.course_id == null ? null : text(row.course_id),
    memberName: text(row.member_name),
    courseTitle: text(row.course_title),
    instructor: text(row.instructor),
    certificateCode: text(row.certificate_code),
    issuedAt: text(row.issued_at),
  }
}

export function toCourseLearningPath(row: Row): CourseLearningPath {
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    title: text(row.title),
    description: text(row.description),
    published: row.published === true,
    createdAt: text(row.created_at),
  }
}

export function toCourseSession(row: Row): CourseSession {
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    pathId: row.path_id == null ? null : text(row.path_id),
    title: text(row.title),
    description: text(row.description),
    videoUrl: text(row.video_url),
    durationMinutes: Number.isFinite(Number(row.duration_minutes)) ? Number(row.duration_minutes) : 0,
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
    published: row.published === true,
  }
}

export function toCourseMaterial(row: Row): CourseMaterial {
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    sessionId: row.session_id == null ? null : text(row.session_id),
    title: text(row.title),
    description: text(row.description),
    resourceType: text(row.resource_type),
    url: text(row.url),
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
  }
}

export function toCourseAssessment(row: Row): CourseAssessment {
  return {
    id: text(row.id),
    courseId: text(row.course_id),
    sessionId: row.session_id == null ? null : text(row.session_id),
    title: text(row.title),
    instructions: text(row.instructions),
    maxAttempts: Number.isFinite(Number(row.max_attempts)) ? Number(row.max_attempts) : 1,
  }
}

export function toCourseAssessmentQuestion(row: Row): CourseAssessmentQuestion {
  const rawType = text(row.question_type)
  const questionType: CourseQuestionType = rawType === "multiple_choice" || rawType === "true_false" ? rawType : "written"
  return {
    id: text(row.id),
    assessmentId: text(row.assessment_id),
    prompt: text(row.prompt),
    questionType,
    options: Array.isArray(row.options) ? row.options.filter((option): option is string => typeof option === "string") : [],
    points: Number.isFinite(Number(row.points)) ? Number(row.points) : 1,
    position: Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
  }
}

export function toCourseAssessmentAttempt(row: Row): CourseAssessmentAttempt {
  return {
    id: text(row.id),
    assessmentId: text(row.assessment_id),
    userId: text(row.user_id),
    status: row.status === "graded" ? "graded" : "pending_review",
    score: Number.isFinite(Number(row.score)) ? Number(row.score) : 0,
    maxScore: Number.isFinite(Number(row.max_score)) ? Number(row.max_score) : 0,
    submittedAt: text(row.submitted_at),
    gradedAt: text(row.graded_at),
  }
}

export function toCourseAssessmentAnswer(row: Row): CourseAssessmentAnswer {
  return {
    id: text(row.id),
    attemptId: text(row.attempt_id),
    questionId: text(row.question_id),
    answer: text(row.answer),
    isCorrect: typeof row.is_correct === "boolean" ? row.is_correct : null,
    pointsAwarded: typeof row.points_awarded === "number" ? row.points_awarded : null,
    feedback: text(row.feedback),
  }
}

export function toCourseSessionCompletion(row: Row): CourseSessionCompletion {
  return { sessionId: text(row.session_id), completedAt: text(row.completed_at) }
}

export function toProfile(row: Row | null | undefined): MemberProfile {
  if (!row) return emptyProfile
  return {
    headline: text(row.headline),
    company: text(row.company),
    role: text(row.role),
    bio: text(row.bio),
    location: text(row.location),
    website: text(row.website),
    linkedinUrl: text(row.linkedin_url),
    skills: normalizeSkills(row.skills),
    updatedAt: text(row.updated_at),
  }
}

export function toDirectoryMember(row: Row): DirectoryMember {
  const profile = toProfile(row)
  return {
    ...profile,
    id: text(row.id),
    name: text(row.full_name) || text(row.display_name) || text(row.name) || "DDNI member",
  }
}

export function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M"
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", options).format(date)
}

export function relativeTime(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function profileCompletion(member: { name: string; title: string; avatarUrl: string }, profile: MemberProfile) {
  const checks: [string, boolean][] = [
    ["Full name", Boolean(member.name && member.name !== "Member")],
    ["Professional title", Boolean(member.title && member.title !== "DDNI Member")],
    ["Profile photo", Boolean(member.avatarUrl)],
    ["Headline", Boolean(profile.headline)],
    ["Company", Boolean(profile.company)],
    ["Location", Boolean(profile.location)],
    ["Areas of expertise", profile.skills.length > 0],
    ["Personal introduction", Boolean(profile.bio)],
  ]
  const missing = checks.filter(([, done]) => !done).map(([label]) => label)
  return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing }
}
