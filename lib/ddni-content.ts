import type { Opportunity } from "@/lib/dashboard-data"

export type OpportunityKind = "jobs" | "volunteering" | "collaboration"

export const OPPORTUNITY_KIND_LABEL: Record<OpportunityKind, string> = {
  jobs: "Jobs & Internships",
  volunteering: "Volunteering",
  collaboration: "Business & Collaboration",
}

const textOf = (item: Opportunity) => `${item.title} ${item.description}`.toLowerCase()

export function opportunityKind(item: Opportunity): OpportunityKind {
  const text = textOf(item)
  if (/volunteer|serve|support team/.test(text)) return "volunteering"
  if (/collaborat|partner|business|enterprise|venture|invest/.test(text)) return "collaboration"
  return "jobs"
}

export type AnnouncementCategory = "My Courses" | "DDNI Updates" | "Events & Sessions" | "Resources" | "Opportunities"

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = ["My Courses", "DDNI Updates", "Events & Sessions", "Resources", "Opportunities"]

export function announcementCategory(item: Opportunity): AnnouncementCategory {
  const text = textOf(item)
  if (/session|event|calendar|webinar|conference/.test(text)) return "Events & Sessions"
  if (/manual|resource|library|download|recording/.test(text)) return "Resources"
  if (/opportunit|volunteer|internship|vacanc|job\b/.test(text)) return "Opportunities"
  if (/course|register|registration|enrol|cohort|pioneers|building self|gifts of/.test(text)) return "My Courses"
  return "DDNI Updates"
}

export function longDate(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}
