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

export type Course = {
  id: string
  title: string
  instructor: string
  category: string
  description: string
  duration: string
  eventDate: string
  thumbnailUrl: string
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
    title: text(row.title),
    instructor: text(row.instructor),
    category: text(row.category) || "Course",
    description: text(row.description),
    duration: text(row.duration),
    eventDate: text(row.event_date),
    thumbnailUrl: text(row.thumbnail_url),
    createdAt: text(row.created_at),
  }
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
