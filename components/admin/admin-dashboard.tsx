"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  deleteContentItem,
  saveAnnouncementSetting as saveAnnouncementSettingAction,
  saveContentItem,
  setContentPublished,
  setCourseAccess as setCourseAccessAction,
  issueCourseCertificate,
} from "@/src/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, StatusMessage } from "@/components/dashboard/dashboard-ui"
import { formatDate, isValidUrl, normalizeSkills, relativeTime } from "@/lib/dashboard-data"
import { Pencil, Plus, Trash2, X, Users, ShieldCheck, Settings2, ChevronDown, Check, MessageSquareWarning, LayoutDashboard, FileText, Megaphone, GraduationCap, Award } from "lucide-react"
import { ClassManagement } from "@/components/admin/class-management"

type FieldKind = "text" | "textarea" | "url" | "select"
type FieldConfig = { name: string; label: string; kind?: FieldKind; required?: boolean; placeholder?: string; hint?: string; options?: readonly string[] }

const resourceTypes = ["PDF", "Guide", "Workbook", "Video", "Recording", "Audio", "Link"] as const

const sections = {
  announcements: { title: "Opportunities", singular: "opportunity", destination: "Member dashboard → The Network", fields: [
    { name: "title", label: "Title", required: true },
    { name: "body", label: "Details", kind: "textarea", required: true, hint: "Members can expand and respond by email." },
  ] },
  resources: { title: "Resources", singular: "resource", destination: "Member dashboard → The Institute → Resource library", fields: [
    { name: "title", label: "Title", required: true },
    { name: "resource_type", label: "Type", kind: "select", required: true, options: resourceTypes, hint: "Video, Recording and Audio show a Watch button." },
    { name: "url", label: "Link", kind: "url", required: true, placeholder: "https://…" },
    { name: "description", label: "Description", kind: "textarea" },
  ] },
  courses: { title: "Courses", singular: "course", destination: "Member dashboard → Institute and Courses", fields: [
    { name: "slug", label: "Course slug", required: true, hint: "Used to connect this course to its detailed course information." },
    { name: "title", label: "Title", required: true },
    { name: "instructor", label: "Instructor", required: true },
    { name: "category", label: "Category" },
    { name: "description", label: "Description", kind: "textarea" },
    { name: "duration", label: "Duration" },
    { name: "event_date", label: "Date", placeholder: "YYYY-MM-DD" },
    { name: "thumbnail_url", label: "Thumbnail link", kind: "url", placeholder: "https://…" },
    { name: "price", label: "Price", placeholder: "e.g. R800" },
    { name: "is_free", label: "Access", kind: "select", required: true, options: ["Free", "Paid"] },
  ] },
  blog_posts: { title: "Blog posts", singular: "blog post", destination: "Public site", fields: [
    { name: "title", label: "Title", required: true },
    { name: "instructor", label: "Author", required: true },
    { name: "event_date", label: "Date", placeholder: "YYYY-MM-DD" },
    { name: "thumbnail_url", label: "Thumbnail link", kind: "url", placeholder: "https://…" },
    { name: "media_url", label: "Optional media link", kind: "url", placeholder: "https://…" },
    { name: "body", label: "Body", kind: "textarea", required: true },
  ] },
} satisfies Record<string, { title: string; singular: string; destination: string; fields: FieldConfig[] }>

type Section = keyof typeof sections
type AdminArea = "overview" | "classes" | "content" | "members" | "announcements"
type Item = Record<string, string | boolean | null> & { id: string; published?: boolean; is_free?: boolean }
type Profile = { headline?: string; company?: string; role?: string; bio?: string; location?: string; website?: string; linkedin_url?: string; skills?: unknown; updated_at?: string }
type User = { id: string; email?: string; created_at: string; last_sign_in_at?: string; email_confirmed_at?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; profile?: Profile | null }
type Enrollment = { id: string; user_id: string; course_id: string; status: "pending" | "enrolled" | "revoked"; source: string; created_at: string }
type CourseOption = { id: string; title: string; is_free: boolean }
type AdminCertificate = { id: string; user_id: string; course_id: string | null; certificate_code: string; issued_at: string }

const accessOptions = ["prepared", "updates", "active", "blocked"] as const
const accessLabels: Record<string, string> = { prepared: "Dashboard is being prepared", updates: "Updates to the dashboard are being made", active: "Active", blocked: "Blocked" }
const reviewLabels: Record<string, string> = { pending_review: "Profile pending review", approved: "Profile approved", rejected: "Profile changes requested" }
const selectClass = "h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"

function profileStatusOf(user: User) { return String(user.user_metadata?.professional_profile_status || "") }

export default function AdminDashboard() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [activeArea, setActiveArea] = useState<AdminArea>("overview")
  const [section, setSection] = useState<Section>("announcements")
  const [form, setForm] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [items, setItems] = useState<Item[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [courseCatalog, setCourseCatalog] = useState<CourseOption[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [certificates, setCertificates] = useState<AdminCertificate[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [userSort, setUserSort] = useState<"name" | "email" | "created_at" | "verified">("created_at")
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending_review" | "approved" | "rejected" | "none">("all")
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [userStatus, setUserStatus] = useState("")
  const [verificationStatus, setVerificationStatus] = useState("")
  const [dashboardAnnouncement, setDashboardAnnouncement] = useState("The Spring Cohort applications close Friday. Secure your seat now.")
  const [landingAnnouncement, setLandingAnnouncement] = useState("We have launched. Don\'t miss your spot.")
  const [announcementStatus, setAnnouncementStatus] = useState("")
  const [accessBusy, setAccessBusy] = useState("")

  const config = sections[section]
  const dashboardAnnouncementKey = "__dashboard_announcement__"
  const landingAnnouncementKey = "__landing_announcement__"

  async function loadAnnouncementSettings() {
    try {
      const { data, error } = await createClient().from("announcements").select("title, body, published").in("title", [dashboardAnnouncementKey, landingAnnouncementKey]).eq("published", true)
      if (error) { setAnnouncementStatus("Unable to load current announcements."); return }
      const dashboard = data?.find((item) => item.title === dashboardAnnouncementKey)
      const landing = data?.find((item) => item.title === landingAnnouncementKey)
      if (dashboard?.body) setDashboardAnnouncement(dashboard.body)
      if (landing?.body) setLandingAnnouncement(landing.body)
    } catch (error) {
      console.error("[admin] loadAnnouncementSettings failed", error)
      setAnnouncementStatus("Unable to load current announcements.")
    }
  }
  async function saveAnnouncementSetting(title: "__dashboard_announcement__" | "__landing_announcement__", body: string) {
    if (!body.trim()) { setAnnouncementStatus("Announcements can't be empty."); return }
    setAnnouncementStatus("Saving announcement...")
    try {
      const result = await saveAnnouncementSettingAction(title, body)
      setAnnouncementStatus(result.error ?? "Announcement saved and live.")
    } catch (error) {
      console.error("[admin] saveAnnouncementSetting failed", error)
      setAnnouncementStatus("Unable to save this announcement. Please try again.")
    }
  }
  async function loadItems(currentSection = section) {
    try {
      const query = createClient().from(currentSection).select("*").order("created_at", { ascending: false })
      const { data, error } = currentSection === "announcements" ? await query.not("title", "in", `("__dashboard_announcement__","__landing_announcement__")`) : await query
      if (error) { setStatus("Unable to load content."); return }
      setItems((data as Item[]) || [])
    } catch (error) {
      console.error("[admin] loadItems failed", error)
      setStatus("Unable to load content.")
    }
  }
  async function loadCourseAccess() {
    try {
      const client = createClient()
      const [{ data: catalog, error: catalogError }, { data: rows, error: rowsError }, { data: issued, error: certificatesError }] = await Promise.all([
        client.from("courses").select("id, title, is_free").order("title"),
        client.from("course_enrollments").select("id, user_id, course_id, status, source, created_at").order("created_at", { ascending: false }),
        client.from("course_certificates").select("id, user_id, course_id, certificate_code, issued_at").order("issued_at", { ascending: false }),
      ])
      if (catalogError || rowsError || certificatesError) { setUserStatus("Unable to load course access data."); return }
      setCourseCatalog((catalog as CourseOption[]) || [])
      setEnrollments((rows as Enrollment[]) || [])
      setCertificates((issued as AdminCertificate[]) || [])
    } catch (error) {
      console.error("[admin] loadCourseAccess failed", error)
      setUserStatus("Unable to load course access data.")
    }
  }
  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) { setUserStatus("Unable to load member accounts."); return }
      const result = await response.json() as { users?: User[] }
      if (!Array.isArray(result.users)) { setUserStatus("Unable to load member accounts."); return }
      setUsers(result.users)
    } catch (error) {
      console.error("[admin] loadUsers failed", error)
      setUserStatus("Unable to load member accounts.")
    }
  }
  async function updateUser(id: string, updates: Record<string, unknown>, successMessage = "User access updated.") {
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) })
      setUserStatus(response.ok ? successMessage : "Unable to update user.")
      if (response.ok) await loadUsers()
      return response.ok
    } catch (error) {
      console.error("[admin] updateUser failed", error)
      setUserStatus("Unable to update user.")
      return false
    }
  }
  async function toggleAdmin(user: User) { await updateUser(user.id, { is_admin: user.app_metadata?.is_admin !== true }, user.app_metadata?.is_admin === true ? "Admin role removed." : "Admin role assigned.") }
  async function updateContact(user: User) { const email = window.prompt("Contact email", user.email || ""); if (email && email !== user.email) await updateUser(user.id, { email }, "Contact email updated.") }
  async function reviewProfile(user: User, profileStatus: "approved" | "rejected") {
    const ok = await updateUser(user.id, { profile_status: profileStatus, profile_review_note: profileStatus === "rejected" ? reviewNote : "" }, profileStatus === "approved" ? "Profile approved." : "Changes requested. The member will see your note on their dashboard.")
    if (ok) setReviewNote("")
  }
  async function resendVerification(user: User) {
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, resend_verification: true }) })
      setVerificationStatus(response.ok ? `Verification email sent to ${user.email || "member"}.` : "Unable to send verification email.")
    } catch (error) {
      console.error("[admin] resendVerification failed", error)
      setVerificationStatus("Unable to send verification email.")
    }
  }
  async function resendUnverifiedInBulk() {
    const unverified = users.filter((user) => !user.email_confirmed_at && user.email)
    if (!unverified.length) { setVerificationStatus("There are no unverified users to contact."); return }
    if (!window.confirm(`Send verification emails to ${unverified.length} unverified members?`)) return
    setVerificationStatus(`Sending ${unverified.length} verification email${unverified.length === 1 ? "" : "s"}...`)
    const results = await Promise.allSettled(unverified.map((user) => fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, resend_verification: true }) })))
    const sent = results.filter((result) => result.status === "fulfilled" && result.value.ok).length
    setVerificationStatus(`Sent ${sent} of ${unverified.length} verification emails.`)
  }
  async function updateAllMemberAccess(dashboard_status: "prepared" | "active" | "updates", label: string) {
    const members = users.filter((user) => user.email !== "admin@distinguisheddaniel.com")
    if (!members.length) { setUserStatus("There are no members to update."); return }
    if (!window.confirm(`${label} for all ${members.length} members?`)) return
    setUserStatus(`Updating access for ${members.length} members...`)
    const results = await Promise.allSettled(members.map((user) => fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, dashboard_status }),
    })))
    const updated = results.filter((result) => result.status === "fulfilled" && result.value.ok).length
    setUserStatus(`Updated access for ${updated} of ${members.length} members.`)
    if (updated > 0) await loadUsers()
  }
  async function deleteUser(user: User) {
    if (!window.confirm(`Delete the account for ${user.email || "this user"}?`)) return
    try {
      const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) })
      setUserStatus(response.ok ? "User account deleted." : "Unable to delete user.")
      if (response.ok) await loadUsers()
    } catch (error) {
      console.error("[admin] deleteUser failed", error)
      setUserStatus("Unable to delete user.")
    }
  }
  useEffect(() => {
    void (async () => {
      try {
        const client = createClient()
        let { data: { user } } = await client.auth.getUser()
        if (user?.app_metadata?.is_admin !== true) {
          const { data: refreshed } = await client.auth.refreshSession()
          user = refreshed.session?.user || user
        }
        const isAdmin = user?.app_metadata?.is_admin === true
        setAllowed(isAdmin)
        if (isAdmin) { await loadItems(); await loadUsers(); await loadAnnouncementSettings(); await loadCourseAccess() }
      } catch (error) {
        console.error("[admin] initialization failed", error)
        setAllowed(false)
        setUserStatus("Unable to load the administrator dashboard.")
      }
    })()
  }, [])
  function resetForm() { setEditingId(null); setForm({}); setFormErrors({}); setStatus("") }
  function startEdit(item: Item) { setEditingId(item.id); setForm(Object.fromEntries(config.fields.map((field) => [field.name, field.name === "is_free" ? (item.is_free ? "Free" : "Paid") : String(item[field.name] ?? "")]))); setFormErrors({}); setStatus("") }
  async function setCourseAccess(userId: string, courseId: string, status: "enrolled" | "revoked") {
    setAccessBusy(`${userId}:${courseId}`)
    try {
      const result = await setCourseAccessAction(userId, courseId, status)
      setUserStatus(result.error ?? (status === "enrolled" ? "Course access granted." : "Course access revoked."))
      if (!("error" in result)) await loadCourseAccess()
    } catch (error) {
      console.error("[admin] setCourseAccess failed", error)
      setUserStatus("Unable to update course access. Please try again.")
    } finally {
      setAccessBusy("")
    }
  }
  async function issueCertificate(userId: string, courseId: string, courseTitle: string) {
    const busyKey = `${userId}:${courseId}`
    if (!window.confirm(`Confirm this member completed "${courseTitle}" and issue their certificate?`)) return
    setAccessBusy(busyKey)
    setUserStatus("")
    try {
      const result = await issueCourseCertificate(userId, courseId)
      setUserStatus(result.error ?? "Course completion recorded and certificate issued.")
      if (!result.error) await loadCourseAccess()
    } catch (error) {
      console.error("[admin] issueCertificate failed", error)
      setUserStatus("Unable to issue this certificate. Please try again.")
    } finally {
      setAccessBusy("")
    }
  }
  function validateForm() {
    const errors: Record<string, string> = {}
    for (const field of config.fields as FieldConfig[]) {
      const value = (form[field.name] || "").trim()
      if (field.required && !value) errors[field.name] = `${field.label} is required.`
      else if (value && field.kind === "url" && !isValidUrl(value)) errors[field.name] = "Enter a full link starting with https://."
      else if (value && field.name === "event_date" && Number.isNaN(Date.parse(value))) errors[field.name] = "Use a date like 2026-11-14."
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validateForm()) { setStatus("Please fix the highlighted fields."); return }
    if (!allowed) return
    setStatus(editingId ? "Saving..." : "Publishing...")
    const values: Record<string, string | null> = Object.fromEntries(config.fields.map((field) => [field.name, (form[field.name] || "").trim() || null]))
    try {
      const result = await saveContentItem(section, values, editingId || undefined)
      if (result.error) { setStatus(result.error); return }
      resetForm()
      setStatus(editingId ? "Changes saved." : "Published successfully.")
      await loadItems()
    } catch (error) {
      console.error("[admin] submit content failed", error)
      setStatus("Unable to save this item. Please try again.")
    }
  }
  async function remove(item: Item) {
    if (!window.confirm(`Remove “${String(item.title)}”?`)) return
    try {
      const result = await deleteContentItem(section, item.id)
      setStatus(result.error ?? "Item removed.")
      if (!result.error) await loadItems()
    } catch (error) {
      console.error("[admin] remove content failed", error)
      setStatus("Unable to remove this item. Please try again.")
    }
  }
  async function togglePublished(item: Item) {
    try {
      const result = await setContentPublished(section, item.id, !item.published)
      setStatus(result.error ?? (item.published ? "Hidden from members." : "Published to members."))
      await loadItems()
    } catch (error) {
      console.error("[admin] toggle content visibility failed", error)
      setStatus("Unable to change visibility. Please try again.")
    }
  }

  const reviewCounts = useMemo(() => ({ pending_review: users.filter((user) => profileStatusOf(user) === "pending_review").length }), [users])
  const visibleUsers = useMemo(() => users.filter((user) => `${user.email || ""} ${String(user.user_metadata?.full_name || "")} ${user.profile?.company || ""}`.toLowerCase().includes(userSearch.toLowerCase())).filter((user) => reviewFilter === "all" || (reviewFilter === "none" ? !profileStatusOf(user) : profileStatusOf(user) === reviewFilter)).sort((a, b) => {
    if (userSort === "verified") return Number(Boolean(a.email_confirmed_at)) - Number(Boolean(b.email_confirmed_at))
    if (userSort === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    const aValue = userSort === "name" ? String(a.user_metadata?.full_name || "Member") : a.email || ""
    const bValue = userSort === "name" ? String(b.user_metadata?.full_name || "Member") : b.email || ""
    return aValue.localeCompare(bValue)
  }), [users, userSearch, userSort, reviewFilter])

  if (allowed === null) return <main className="tdd-dashboard grid min-h-dvh place-items-center p-6 text-muted-foreground" role="status"><div className="flex items-center gap-3"><span className="motion-safe:animate-spin size-5 rounded-full border-2 border-current/20 border-t-primary" aria-hidden="true" />Checking administrator access…</div></main>
  if (!allowed) return <main className="tdd-dashboard grid min-h-dvh place-items-center p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Admin access required</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">This area is restricted to administrators.</p></CardContent></Card></main>
  const areas: { id: AdminArea; label: string; description: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", description: "A summary of members and items that need attention.", icon: LayoutDashboard },
    { id: "classes", label: "Class management", description: "Build course learning paths, sessions, assessments, and learner reviews in one course-scoped workspace.", icon: GraduationCap },
    { id: "content", label: "Content", description: "Create, update, and publish resources, opportunities, and blog posts.", icon: FileText },
    { id: "members", label: "Members", description: "Review member profiles, manage account access, and approve course requests.", icon: Users },
    { id: "announcements", label: "Announcements", description: "Manage the live messages shown on the public site and member dashboard.", icon: Megaphone },
  ]
  const activeAreaInfo = areas.find((area) => area.id === activeArea) ?? areas[0]

  return <main className="tdd-dashboard min-h-dvh"><div className="ddni-light mx-auto min-h-dvh max-w-[1440px] p-4 sm:p-6 lg:p-8">
    <div className="mb-8 flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The Distinguished Daniel</p><h1 className="mt-2 font-display text-3xl leading-snug tracking-tight text-foreground sm:text-4xl">Admin dashboard</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A central workspace for site content and member operations.</p></div>
      <Button variant="outline" className="min-h-10 shrink-0" nativeButton={false} render={<a href="/dashboard" />}>Open member dashboard</Button>
    </div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Admin sections" className="h-fit rounded-2xl border border-border/80 bg-card p-2.5 shadow-sm lg:sticky lg:top-6">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
          {areas.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={activeArea === id ? "page" : undefined} onClick={() => setActiveArea(id)} className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${activeArea === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{label}</span>
              {id === "members" && (reviewCounts.pending_review > 0 || enrollments.some((enrollment) => enrollment.status === "pending")) && <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeArea === id ? "bg-primary-foreground/15" : "bg-muted"}`}>{reviewCounts.pending_review + enrollments.filter((enrollment) => enrollment.status === "pending").length}</span>}
            </button>
          ))}
        </div>
      </nav>
      <div className="min-w-0">
        <header className="mb-6 space-y-1">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">{activeAreaInfo.label}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{activeAreaInfo.description}</p>
        </header>
        {activeArea === "overview" && <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Members" value={users.length} />
            <StatTile label="Active dashboards" value={users.filter((user) => user.user_metadata?.dashboard_status === "active").length} />
            <StatTile label="Unverified members" value={users.filter((user) => !user.email_confirmed_at).length} />
            <button type="button" className="text-left" onClick={() => { setReviewFilter("pending_review"); setActiveArea("members") }}><StatTile label="Profiles to review" value={reviewCounts.pending_review} highlight={reviewCounts.pending_review > 0} /></button>
          </div>
          <Card className="border-border/70">
            <CardHeader><CardTitle>Needs attention</CardTitle><p className="text-sm text-muted-foreground">Review outstanding requests and member profiles from the Members workspace.</p></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2"><Badge variant={enrollments.some((enrollment) => enrollment.status === "pending") ? "default" : "secondary"}>{enrollments.filter((enrollment) => enrollment.status === "pending").length} course requests</Badge><Badge variant={reviewCounts.pending_review > 0 ? "default" : "secondary"}>{reviewCounts.pending_review} profiles to review</Badge></div>
              <Button variant="outline" onClick={() => setActiveArea("members")}>Open member management</Button>
            </CardContent>
          </Card>
        </>}
        {activeArea === "classes" && <ClassManagement courses={courseCatalog} members={users} />}
        {activeArea === "announcements" && <Card>
          <CardHeader><CardTitle>Live announcements</CardTitle><p className="text-sm text-muted-foreground">These messages appear immediately on the public landing page and member dashboard. Network opportunities are managed separately under Content.</p></CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-2"><label htmlFor="dashboard-announcement" className="text-sm font-medium">Member dashboard announcement</label><Textarea id="dashboard-announcement" value={dashboardAnnouncement} onChange={(event) => setDashboardAnnouncement(event.target.value)} /><p className="text-xs text-muted-foreground">Shown in the bar at the top of every member dashboard view. Members can dismiss it for their session.</p><Button className="w-fit btn-gold" onClick={() => void saveAnnouncementSetting(dashboardAnnouncementKey, dashboardAnnouncement)}>Save dashboard announcement</Button></div>
            <div className="flex flex-col gap-2"><label htmlFor="landing-announcement" className="text-sm font-medium">Landing page announcement</label><Textarea id="landing-announcement" value={landingAnnouncement} onChange={(event) => setLandingAnnouncement(event.target.value)} /><p className="text-xs text-muted-foreground">Shown on the public homepage.</p><Button className="w-fit btn-gold" onClick={() => void saveAnnouncementSetting(landingAnnouncementKey, landingAnnouncement)}>Save landing announcement</Button></div>
            {announcementStatus && <p role="status" className="text-sm text-muted-foreground lg:col-span-2">{announcementStatus}</p>}
          </CardContent>
        </Card>}
        {activeArea === "content" && <>
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
            <span className="me-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Manage</span>
            {(Object.keys(sections) as Section[]).map((key) => <Button key={key} size="sm" variant={section === key ? "default" : "outline"} className={section === key ? "btn-gold" : ""} onClick={() => { setSection(key); resetForm(); void loadItems(key) }}>{sections[key].title}</Button>)}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit border-border/70"><CardHeader><CardTitle className="flex items-center justify-between gap-3 tracking-tight">{editingId ? `Edit ${config.singular}` : `Add ${config.singular}`}<Button variant="ghost" size="icon" onClick={resetForm} aria-label="Clear form"><X /></Button></CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Appears in: {config.destination}</p></CardHeader><CardContent><form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {(config.fields as FieldConfig[]).map((field) => { const id = `admin-${section}-${field.name}`; const value = form[field.name] || ""; const onChange = (next: string) => { setForm({ ...form, [field.name]: next }); if (formErrors[field.name]) setFormErrors({ ...formErrors, [field.name]: "" }) }; const label = field.required ? `${field.label} *` : field.label; return <Field key={field.name} id={id} label={label} error={formErrors[field.name]} hint={field.hint}>
          {field.kind === "textarea" ? <Textarea id={id} name={field.name} rows={5} value={value} required={field.required} aria-invalid={Boolean(formErrors[field.name])} aria-describedby={formErrors[field.name] ? `${id}-error` : field.hint ? `${id}-hint` : undefined} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
            : field.kind === "select" ? <select id={id} name={field.name} required={field.required} className={`${selectClass} h-11`} value={value} aria-invalid={Boolean(formErrors[field.name])} aria-describedby={formErrors[field.name] ? `${id}-error` : field.hint ? `${id}-hint` : undefined} onChange={(e) => onChange(e.target.value)}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}{value && !field.options?.includes(value) && <option value={value}>{value}</option>}</select>
            : <Input id={id} name={field.name} type={field.kind === "url" ? "url" : "text"} value={value} required={field.required} aria-invalid={Boolean(formErrors[field.name])} aria-describedby={formErrors[field.name] ? `${id}-error` : field.hint ? `${id}-hint` : undefined} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />}
        </Field> })}
        <div className="flex gap-3"><Button type="submit" className="btn-gold"><Plus data-icon="inline-start" />{editingId ? "Save changes" : "Publish"}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}</div>{status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      </form></CardContent></Card>
      <Card className="border-border/70"><CardHeader><CardTitle className="tracking-tight">{config.title}</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">Hidden items stay saved but aren&apos;t shown to members.</p></CardHeader><CardContent className="flex flex-col gap-3">{items.map((item) => <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:items-start sm:p-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium tracking-tight">{String(item.title)}</p><Badge variant={item.published ? "default" : "secondary"}>{item.published ? "Published" : "Hidden"}</Badge>{(item.resource_type || item.category) && <Badge variant="outline">{String(item.resource_type || item.category)}</Badge>}</div><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{String(item.description || item.body || item.instructor || item.url || "")}</p>{typeof item.created_at === "string" && <p className="mt-2 text-xs text-muted-foreground">Added {formatDate(item.created_at)}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label={`Edit ${String(item.title)}`}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => void remove(item)} aria-label={`Delete ${String(item.title)}`}><Trash2 /></Button><Button variant="outline" size="sm" onClick={() => void togglePublished(item)}>{item.published ? "Hide" : "Publish"}</Button></div></div>)}{items.length === 0 && <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center"><FileText className="size-6 text-primary" aria-hidden="true" /><div><p className="font-medium">No {config.title.toLowerCase()} yet</p><p className="mt-1 text-sm text-muted-foreground">Add an item using the form to make it available here.</p></div></div>}</CardContent></Card>
          </div>
        </>}
        {activeArea === "members" && <Card id="member-access">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 /> Member access and admin roles</CardTitle><p className="text-sm text-muted-foreground">Review course requests, update individual accounts, or use carefully confirmed bulk actions.</p></CardHeader><CardContent className="flex flex-col gap-5">
      <PendingCourseRequests users={users} courses={courseCatalog} enrollments={enrollments} busy={accessBusy} onGrant={(userId, courseId) => void setCourseAccess(userId, courseId, "enrolled")} />
      <section aria-labelledby="bulk-member-actions" className="rounded-2xl border border-border/80 bg-muted/40 p-5"><div className="mb-4"><h3 id="bulk-member-actions" className="font-medium tracking-tight">Bulk actions</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Changes apply to every member except the primary administrator.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => void updateAllMemberAccess("prepared", "Set dashboard access to prepared")}>Set all to prepared</Button><Button variant="outline" onClick={() => void updateAllMemberAccess("active", "Activate dashboards")}>Activate all members</Button><Button variant="outline" onClick={() => void updateAllMemberAccess("updates", "Set dashboard access to updates")}>Set all to updates</Button><Button variant="outline" onClick={() => void resendUnverifiedInBulk()}>Resend verification emails</Button></div></section>
      {verificationStatus && <p role="status" className="text-sm text-muted-foreground">{verificationStatus}</p>}
      {userStatus && <p role="status" className="text-sm text-muted-foreground">{userStatus}</p>}
      <div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Search users" placeholder="Search by name, email or company" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} className="h-11" /><select aria-label="Filter by profile review" className={selectClass} value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as typeof reviewFilter)}><option value="all">All profiles</option><option value="pending_review">Pending review ({reviewCounts.pending_review})</option><option value="approved">Approved</option><option value="rejected">Changes requested</option><option value="none">Not submitted</option></select><select aria-label="Sort users" className={selectClass} value={userSort} onChange={(event) => setUserSort(event.target.value as typeof userSort)}><option value="created_at">Newest first</option><option value="name">Name</option><option value="email">Email</option><option value="verified">Unverified first</option></select></div>
      <div className="flex flex-col gap-4">{visibleUsers.map((user) => { const expanded = expandedUserId === user.id; const profileStatus = profileStatusOf(user); return <div key={user.id} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><p className="font-medium tracking-tight">{String(user.user_metadata?.full_name || "Member")}</p><p className="break-words text-sm text-muted-foreground">{user.email || "No email"}{user.user_metadata?.title ? ` · ${String(user.user_metadata.title)}` : ""}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant={user.app_metadata?.is_admin === true ? "default" : "secondary"}>{user.app_metadata?.is_admin === true ? "Admin" : "Member"}</Badge><Badge variant={user.email_confirmed_at ? "outline" : "destructive"}>{user.email_confirmed_at ? "Verified" : "Unverified"}</Badge><Badge variant="outline">{accessLabels[String(user.user_metadata?.dashboard_status || "prepared")]}</Badge>{profileStatus && <Badge variant={profileStatus === "pending_review" ? "default" : "outline"} className={profileStatus === "pending_review" ? "btn-gold" : ""}>{reviewLabels[profileStatus] || profileStatus}</Badge>}</div></div><div className="flex flex-wrap items-center gap-2.5"><select aria-label={`Dashboard access for ${user.email}`} className={selectClass} value={String(user.user_metadata?.dashboard_status || "prepared")} onChange={(e) => void updateUser(user.id, { dashboard_status: e.target.value })}>{accessOptions.map((option) => <option key={option} value={option}>{accessLabels[option]}</option>)}</select><Button variant="outline" size="sm" onClick={() => void toggleAdmin(user)}><ShieldCheck data-icon="inline-start" />{user.app_metadata?.is_admin === true ? "Remove admin" : "Assign admin"}</Button><Button variant="outline" size="sm" onClick={() => void updateContact(user)}><Pencil data-icon="inline-start" />Contact</Button>{!user.email_confirmed_at && user.email && <Button variant="outline" size="sm" onClick={() => void resendVerification(user)}>Resend verification</Button>}<Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => { setExpandedUserId(expanded ? null : user.id); setReviewNote("") }}><ChevronDown data-icon="inline-start" className={expanded ? "rotate-180 transition-transform motion-reduce:transition-none" : "transition-transform motion-reduce:transition-none"} />Profile</Button>{user.email !== "admin@distinguisheddaniel.com" && <Button variant="outline" size="sm" className="text-destructive" aria-label={`Delete ${user.email || "user"}`} onClick={() => void deleteUser(user)}><Trash2 /></Button>}</div></div>
        {expanded && <MemberDetails user={user} reviewNote={reviewNote} onReviewNoteChange={setReviewNote} onReview={(next) => void reviewProfile(user, next)} courses={courseCatalog} enrollments={enrollments.filter((enrollment) => enrollment.user_id === user.id)} certificates={certificates.filter((certificate) => certificate.user_id === user.id)} busy={accessBusy} onGrant={(courseId) => void setCourseAccess(user.id, courseId, "enrolled")} onRevoke={(courseId) => void setCourseAccess(user.id, courseId, "revoked")} onIssueCertificate={(courseId, courseTitle) => void issueCertificate(user.id, courseId, courseTitle)} />}
      </div> })}{visibleUsers.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No users match this search.</p>}</div>
          </CardContent>
        </Card>}
      </div>
    </div>
  </div></main>
}

function StatTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return <div className={`rounded-2xl border bg-card p-5 shadow-sm ${highlight ? "border-primary/50" : "border-border/80"}`}><p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>
}

function PendingCourseRequests({ users, courses, enrollments, busy, onGrant }: { users: User[]; courses: CourseOption[]; enrollments: Enrollment[]; busy: string; onGrant: (userId: string, courseId: string) => void }) {
  const pending = enrollments.filter((enrollment) => enrollment.status === "pending")
  return <section aria-labelledby="pending-course-requests-title" className="rounded-2xl border border-border/80 bg-muted/20 p-5">
    <h3 id="pending-course-requests-title" className="font-medium tracking-tight">Pending course requests</h3>
    {pending.length === 0
      ? <div className="mt-4 rounded-xl border border-dashed border-border bg-card/70 px-4 py-6 text-center"><p className="text-sm font-medium text-foreground">No course requests to review</p><p className="mt-1 text-sm text-muted-foreground">New course requests will appear here.</p></div>
      : <ul className="mt-3 flex flex-col gap-3">{pending.map((enrollment) => {
        const user = users.find((candidate) => candidate.id === enrollment.user_id)
        const course = courses.find((candidate) => candidate.id === enrollment.course_id)
        const isBusy = busy === `${enrollment.user_id}:${enrollment.course_id}`
        return <li key={enrollment.id} className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{String(user?.user_metadata?.full_name || user?.email || "Member")}</p>
            <p className="break-words text-sm text-muted-foreground">{course?.title || "Course"}{user?.email ? ` · ${user.email}` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Requested {formatDate(enrollment.created_at)}</p>
          </div>
          <Button size="sm" className="btn-gold" disabled={isBusy} onClick={() => onGrant(enrollment.user_id, enrollment.course_id)}>
            {isBusy ? "Granting..." : "Grant access"}
          </Button>
        </li>
      })}</ul>}
  </section>
}

function MemberDetails({ user, reviewNote, onReviewNoteChange, onReview, courses, enrollments, certificates, busy, onGrant, onRevoke, onIssueCertificate }: { user: User; reviewNote: string; onReviewNoteChange: (value: string) => void; onReview: (status: "approved" | "rejected") => void; courses: CourseOption[]; enrollments: Enrollment[]; certificates: AdminCertificate[]; busy: string; onGrant: (courseId: string) => void; onRevoke: (courseId: string) => void; onIssueCertificate: (courseId: string, courseTitle: string) => void }) {
  const profile = user.profile
  const preferences = (user.user_metadata?.preferences || {}) as Record<string, unknown>
  const skills = normalizeSkills(profile?.skills)
  const profileStatus = profileStatusOf(user)
  const reviewedAt = String(user.user_metadata?.profile_reviewed_at || "")
  const note = String(user.user_metadata?.profile_review_note || "")
  const rows: [string, string][] = [["Headline", profile?.headline || ""], ["Role", profile?.role || ""], ["Company", profile?.company || ""], ["Location", profile?.location || String(user.user_metadata?.location || "")], ["Website", profile?.website || ""], ["LinkedIn", profile?.linkedin_url || ""]]
  return <div className="mt-5 grid gap-5 border-t border-border/80 pt-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(15rem,1fr)]">
    <div className="flex flex-col gap-3">
      {!profile ? <p className="text-sm text-muted-foreground">This member hasn&apos;t saved a professional profile yet.</p> : <>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="break-words text-foreground">{value ? (isValidUrl(value) ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">{value}</a> : value) : "—"}</dd></div>)}</dl>
        {skills.length > 0 && <div className="flex flex-wrap gap-1.5">{skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>}
        {profile.bio && <p className="whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>}
        {profile.updated_at && <p className="text-xs text-muted-foreground">Last saved {relativeTime(profile.updated_at)}</p>}
      </>}
      <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-3"><div><dt className="text-muted-foreground">Joined</dt><dd className="text-foreground">{formatDate(user.created_at)}</dd></div><div><dt className="text-muted-foreground">Last sign-in</dt><dd className="text-foreground">{user.last_sign_in_at ? relativeTime(user.last_sign_in_at) : "Never"}</dd></div><div><dt className="text-muted-foreground">Email preferences</dt><dd className="text-foreground">Updates {preferences.email_updates === false ? "off" : "on"} · Network {preferences.network_alerts === false ? "off" : "on"}</dd></div></dl>
      <section aria-labelledby={`certificates-${user.id}`} className="border-t border-border pt-4">
        <h3 id={`certificates-${user.id}`} className="font-medium tracking-tight">Course completion &amp; certificates</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Confirm completion to issue a certificate to this member.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {enrollments.filter((enrollment) => enrollment.status === "enrolled").map((enrollment) => {
            const course = courses.find((item) => item.id === enrollment.course_id)
            const certificate = certificates.find((item) => item.course_id === enrollment.course_id)
            const isBusy = busy === `${user.id}:${enrollment.course_id}`
            return <li key={enrollment.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <Award className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{course?.title || "Course"}</p>
                  {certificate && <p className="mt-1 text-xs text-muted-foreground">Issued {formatDate(certificate.issued_at)} · {certificate.certificate_code}</p>}
                </div>
              </div>
              {certificate
                ? <Badge variant="outline" className="w-fit border-primary/30 text-primary"><Check className="me-1 size-3.5" />Issued</Badge>
                : <Button size="sm" className="btn-gold shrink-0" disabled={!course || isBusy} onClick={() => course && onIssueCertificate(course.id, course.title)}><Award data-icon="inline-start" />{isBusy ? "Issuing…" : "Mark complete & issue"}</Button>}
            </li>
          })}
        </ul>
        {enrollments.every((enrollment) => enrollment.status !== "enrolled") && <p className="mt-3 text-sm text-muted-foreground">No active course enrollments to complete.</p>}
      </section>
    </div>
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">Profile review</p>
      <p className="text-xs text-muted-foreground">{profileStatus ? `${reviewLabels[profileStatus] || profileStatus}${reviewedAt ? ` · reviewed ${relativeTime(reviewedAt)}` : ""}` : "Not submitted yet."} This doesn&apos;t change dashboard access.</p>
      {note && <StatusMessage tone="error">{note}</StatusMessage>}
      <Textarea aria-label="Note for the member" placeholder="Optional note when requesting changes" rows={3} maxLength={500} value={reviewNote} onChange={(e) => onReviewNoteChange(e.target.value)} />
      <div className="flex flex-wrap gap-2"><Button size="sm" className="btn-gold" disabled={!profile || profileStatus === "approved"} onClick={() => onReview("approved")}><Check data-icon="inline-start" />Approve</Button><Button size="sm" variant="outline" disabled={!profile} onClick={() => onReview("rejected")}><MessageSquareWarning data-icon="inline-start" />Request changes</Button></div>
    </div>
  </div>
}
