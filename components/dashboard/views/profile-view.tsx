"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Field, StatusMessage, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { MemberAvatarContent } from "@/components/dashboard/member-avatar"
import { initialsFor, isValidUrl, normalizeSkills, profileCompletion, type MemberProfile } from "@/lib/dashboard-data"
import { Check, Circle, RotateCcw, Save, ShieldCheck } from "lucide-react"
import type { DashboardMember, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type FormState = {
  name: string
  title: string
  avatarUrl: string
  headline: string
  role: string
  company: string
  location: string
  website: string
  linkedinUrl: string
  skills: string
  bio: string
}

type Errors = Partial<Record<keyof FormState, string>>

const BIO_LIMIT = 600

function toForm(member: DashboardMember, profile: MemberProfile): FormState {
  return {
    name: member.name === "Member" ? "" : member.name,
    title: member.title === "DDNI Member" ? "" : member.title,
    avatarUrl: member.avatarUrl,
    headline: profile.headline,
    role: profile.role,
    company: profile.company,
    location: profile.location || member.location,
    website: profile.website,
    linkedinUrl: profile.linkedinUrl,
    skills: profile.skills.join(", "),
    bio: profile.bio,
  }
}

function validate(form: FormState): Errors {
  const errors: Errors = {}
  const name = form.name.trim()
  if (name.length < 2) errors.name = "Enter your full name."
  else if (name.length > 80) errors.name = "Keep your name under 80 characters."
  if (form.title.length > 100) errors.title = "Keep your title under 100 characters."
  if (form.headline.length > 140) errors.headline = "Keep your headline under 140 characters."
  if (form.avatarUrl && !isValidUrl(form.avatarUrl)) errors.avatarUrl = "Enter a full image link starting with https://."
  if (form.website && !isValidUrl(form.website)) errors.website = "Enter a full link starting with https://."
  if (form.linkedinUrl && (!isValidUrl(form.linkedinUrl) || !/linkedin\.com/i.test(form.linkedinUrl))) errors.linkedinUrl = "Enter your LinkedIn profile link, e.g. https://linkedin.com/in/you."
  if (normalizeSkills(form.skills).length > 12) errors.skills = "List up to 12 areas of expertise."
  if (form.bio.length > BIO_LIMIT) errors.bio = `Keep your introduction under ${BIO_LIMIT} characters.`
  return errors
}

const statusLabels: Record<string, string> = { pending_review: "Pending review", approved: "Approved", rejected: "Changes requested" }

export function ProfileView({ member, data, onMemberChange, onProfileChange }: DashboardViewProps & { onMemberChange: (updates: Partial<DashboardMember>) => void; onProfileChange: (profile: MemberProfile) => void }) {
  const saved = useMemo(() => toForm(member, data.profile), [member, data.profile])
  const [form, setForm] = useState<FormState>(saved)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(saved) }, [saved])

  const dirty = (Object.keys(form) as (keyof FormState)[]).some((key) => form[key] !== saved[key])
  const preview = { ...member, name: form.name.trim() || member.name, title: form.title.trim() || "DDNI Member", avatarUrl: isValidUrl(form.avatarUrl) ? form.avatarUrl : "", initials: initialsFor(form.name.trim() || member.name) }
  const completion = profileCompletion(preview, { ...data.profile, headline: form.headline, company: form.company, location: form.location, bio: form.bio, skills: normalizeSkills(form.skills) })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    setStatus(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ tone: "error", text: "Please fix the highlighted fields." })
      return
    }
    setSaving(true)
    setStatus(null)
    const supabase = createClient()
    const now = new Date().toISOString()
    const skills = normalizeSkills(form.skills)
    const profileRow = {
      id: member.id,
      headline: form.headline.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      website: form.website.trim(),
      linkedin_url: form.linkedinUrl.trim(),
      bio: form.bio.trim(),
      skills,
      updated_at: now,
    }
    const { error: profileError } = await supabase.from("member_profiles").upsert(profileRow)
    if (profileError) {
      setSaving(false)
      setStatus({ tone: "error", text: "We couldn't save your profile. Please try again." })
      return
    }
    const name = form.name.trim()
    const title = form.title.trim()
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        title,
        avatar_url: form.avatarUrl.trim(),
        location: profileRow.location,
        professional_profile_status: "pending_review",
        last_profile_saved_at: now,
      },
    })
    setSaving(false)
    onProfileChange({ headline: profileRow.headline, role: profileRow.role, company: profileRow.company, location: profileRow.location, website: profileRow.website, linkedinUrl: profileRow.linkedin_url, bio: profileRow.bio, skills, updatedAt: now })
    if (authError) {
      setStatus({ tone: "error", text: "Your professional details were saved, but we couldn't update your name and photo. Please try again." })
      return
    }
    onMemberChange({ name, title: title || "DDNI Member", avatarUrl: form.avatarUrl.trim(), location: profileRow.location, initials: initialsFor(name), profileStatus: "pending_review", lastProfileSavedAt: now })
    setStatus({ tone: "success", text: "Profile saved and submitted for review." })
  }

  const input = (key: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}, hint?: string) => (
    <Field id={`profile-${key}`} label={label} error={errors[key]} hint={hint}>
      <Input id={`profile-${key}`} value={form[key]} onChange={(e) => update(key, e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `profile-${key}-error` : undefined} {...props} />
    </Field>
  )

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <ViewHeader
        kicker="Member profile"
        title="Your public presence"
        description="Keep your profile current so the right people in the TDD Network can find and connect with you."
        actions={<>
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => { setForm(saved); setErrors({}); setStatus(null) }}><RotateCcw data-icon="inline-start" />Discard</Button>
          <Button type="submit" className="btn-gold" disabled={saving || !dirty}><Save data-icon="inline-start" />{saving ? "Saving…" : "Save changes"}</Button>
        </>}
      />
      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      {data.errors.profile && <StatusMessage tone="error">{data.errors.profile}</StatusMessage>}
      {member.profileStatus === "rejected" && <StatusMessage tone="error">{`The DDNI team requested changes${member.profileReviewNote ? `: ${member.profileReviewNote}` : "."} Update your profile and save to resubmit.`}</StatusMessage>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>About you</CardTitle><CardDescription>Your name, title and photo appear across the dashboard.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {input("name", "Full name", { autoComplete: "name", required: true })}
              {input("title", "Professional title", { placeholder: "e.g. Founder, Whitfield Capital" })}
              {input("avatarUrl", "Profile photo link", { type: "url", placeholder: "https://…", className: "" }, "Link to a square image (JPG or PNG).")}
              <Field id="profile-email" label="Email address" hint="Change your email in Settings.">
                <Input id="profile-email" value={member.email} placeholder="No email on file" disabled />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Professional details</CardTitle><CardDescription>Visible to verified network members once reviewed.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {input("headline", "Headline", { placeholder: "What you do, in a sentence" })}
              {input("role", "Role", { placeholder: "e.g. Managing Partner" })}
              {input("company", "Company or ministry")}
              {input("location", "Location", { autoComplete: "address-level2", placeholder: "City, Country" })}
              {input("website", "Website", { type: "url", placeholder: "https://…" })}
              {input("linkedinUrl", "LinkedIn", { type: "url", placeholder: "https://linkedin.com/in/…" })}
              <div className="sm:col-span-2">{input("skills", "Areas of expertise", { placeholder: "Leadership, Finance, Teaching" }, "Separate each with a comma.")}</div>
              <Field id="profile-bio" label="Personal introduction" error={errors.bio} hint={`${form.bio.length}/${BIO_LIMIT}`} className="sm:col-span-2">
                <Textarea id="profile-bio" rows={5} value={form.bio} onChange={(e) => update("bio", e.target.value)} aria-invalid={Boolean(errors.bio)} placeholder="A short introduction for other members." />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl text-xl font-semibold" style={{ backgroundColor: member.avatarColor, color: "#1a1200" }}>
                <MemberAvatarContent key={preview.avatarUrl} member={preview} imageClassName="rounded-2xl" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-foreground">{preview.name}</p>
                <p className="truncate text-xs text-muted-foreground">{preview.title}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {member.emailConfirmedAt && <Badge variant="outline" className="border-[#c89b3c]/50 text-[#f3d27a]"><ShieldCheck data-icon="inline-start" />Verified member</Badge>}
                {member.profileStatus && <Badge variant="secondary">{statusLabels[member.profileStatus] || member.profileStatus}</Badge>}
              </div>
              {member.memberSince && <p className="text-xs text-muted-foreground">Member since {member.memberSince}</p>}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader><CardTitle>Profile strength</CardTitle><CardDescription>Complete your profile to improve discovery.</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-end justify-between"><span className="text-4xl font-semibold text-[#f3d27a]">{completion.percent}%</span><span className="text-xs text-muted-foreground">{completion.percent === 100 ? "Complete" : completion.percent >= 60 ? "Strong foundation" : "Getting started"}</span></div>
              <Progress value={completion.percent} className="h-2" />
              <ul className="flex flex-col gap-2 text-sm">
                {["Full name", "Professional title", "Profile photo", "Headline", "Company", "Location", "Areas of expertise", "Personal introduction"].map((label) => {
                  const done = !completion.missing.includes(label)
                  return <li key={label} className={`flex items-center gap-2 ${done ? "text-foreground" : "text-muted-foreground"}`}>{done ? <Check className="size-4 text-[#f3d27a]" /> : <Circle className="size-4" />}{label}</li>
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
