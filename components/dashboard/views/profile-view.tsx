"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { saveMemberProfile } from "@/src/app/dashboard/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AccountHistory } from "@/components/dashboard/views/history-view"
import { Field, StatusMessage, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { MemberAvatarContent } from "@/components/dashboard/member-avatar"
import { initialsFor, isValidUrl, normalizeSkills, profileCompletion, type MemberProfile } from "@/lib/dashboard-data"
import { Check, Circle, History, ShieldCheck, UserRound } from "lucide-react"
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
  if (form.role.length > 100) errors.role = "Keep your role under 100 characters."
  if (form.company.length > 120) errors.company = "Keep your company under 120 characters."
  if (form.location.length > 100) errors.location = "Keep your location under 100 characters."
  if (form.avatarUrl.length > 2048 || form.avatarUrl && !isValidUrl(form.avatarUrl)) errors.avatarUrl = "Enter a full image link starting with https://."
  if (form.website.length > 2048 || form.website && !isValidUrl(form.website)) errors.website = "Enter a full link starting with https://."
  if (form.linkedinUrl.length > 2048 || form.linkedinUrl && (!isValidUrl(form.linkedinUrl) || !/linkedin\.com/i.test(form.linkedinUrl))) errors.linkedinUrl = "Enter your LinkedIn profile link, e.g. https://linkedin.com/in/you."
  const skills = normalizeSkills(form.skills)
  if (skills.length > 12) errors.skills = "List up to 12 areas of expertise."
  else if (skills.some((skill) => skill.length > 64)) errors.skills = "Keep each area of expertise under 64 characters."
  if (form.bio.length > BIO_LIMIT) errors.bio = `Keep your introduction under ${BIO_LIMIT} characters.`
  return errors
}

const statusLabels: Record<string, string> = { pending_review: "Pending review", approved: "Approved", rejected: "Changes requested" }

function ProfileDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm leading-relaxed font-medium text-foreground">{children || <span className="font-normal text-muted-foreground">Not provided</span>}</dd>
    </div>
  )
}

export function ProfileView({ member, data, onNavigate, onMemberChange, onProfileChange }: DashboardViewProps & { onMemberChange: (updates: Partial<DashboardMember>) => void; onProfileChange: (profile: MemberProfile) => void }) {
  const saved = useMemo(() => toForm(member, data.profile), [member, data.profile])
  const [form, setForm] = useState<FormState>(saved)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) setForm(saved)
  }, [saved, isEditing])

  const dirty = (Object.keys(form) as (keyof FormState)[]).some((key) => form[key] !== saved[key])
  const preview = { ...member, name: form.name.trim() || member.name, title: form.title.trim() || "DDNI Member", avatarUrl: isValidUrl(form.avatarUrl) ? form.avatarUrl : "", initials: initialsFor(form.name.trim() || member.name) }
  const completion = profileCompletion(preview, { ...data.profile, headline: form.headline, company: form.company, location: form.location, bio: form.bio, skills: normalizeSkills(form.skills) })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    setStatus(null)
  }

  function beginEditing() {
    setForm(saved)
    setErrors({})
    setStatus(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setForm(saved)
    setErrors({})
    setStatus(null)
    setIsEditing(false)
  }

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ tone: "error", text: "Please fix the highlighted fields before continuing." })
      const firstInvalid = Object.keys(nextErrors)[0] as keyof FormState
      window.requestAnimationFrame(() => document.getElementById(`profile-${firstInvalid}`)?.focus())
      return
    }
    setStatus(null)
    setIsConfirmOpen(true)
  }

  async function confirmSave() {
    setIsConfirmOpen(false)
    setSaving(true)
    setStatus(null)
    const skills = normalizeSkills(form.skills)

    try {
      const result = await saveMemberProfile({
        name: form.name,
        title: form.title,
        avatarUrl: form.avatarUrl,
        headline: form.headline,
        role: form.role,
        company: form.company,
        location: form.location,
        website: form.website,
        linkedinUrl: form.linkedinUrl,
        skills,
        bio: form.bio,
      })
      if (!result.savedAt) {
        setStatus({ tone: "error", text: result.error ?? "We couldn't save your profile. Please try again." })
        return
      }

      const name = form.name.trim()
      const title = form.title.trim()
      const location = form.location.trim()
      const savedAt = result.savedAt
      onProfileChange({ headline: form.headline.trim(), role: form.role.trim(), company: form.company.trim(), location, website: form.website.trim(), linkedinUrl: form.linkedinUrl.trim(), bio: form.bio.trim(), skills, updatedAt: savedAt })
      if (result.error) {
        setStatus({ tone: "error", text: result.error })
        return
      }
      onMemberChange({ name, title: title || "DDNI Member", avatarUrl: form.avatarUrl.trim(), location, initials: initialsFor(name), profileStatus: "pending_review", lastProfileSavedAt: savedAt })
      setIsEditing(false)
      setStatus({ tone: "success", text: "Profile saved and submitted for review." })
    } catch {
      setStatus({ tone: "error", text: "We couldn't save your profile. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const input = (key: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}, hint?: string) => (
    <Field id={`profile-${key}`} label={label} error={errors[key]} hint={hint}>
      <Input
        {...props}
        id={`profile-${key}`}
        name={key}
        value={form[key]}
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `profile-${key}-error` : hint ? `profile-${key}-hint` : undefined}
      />
    </Field>
  )

  const accountEmail = member.email || "No email on file"
  const profileLocation = data.profile.location || member.location

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ViewHeader kicker="Member account" title="Your DDNI account" description="Review your account activity and keep your professional profile current." />

      {status && <StatusMessage tone={status.tone}>{status.text}</StatusMessage>}
      {data.errors.profile && <StatusMessage tone="error">{data.errors.profile}</StatusMessage>}
      {member.profileStatus === "rejected" && (
        <StatusMessage tone="error">
          {`The DDNI team requested changes${member.profileReviewNote ? `: ${member.profileReviewNote}` : "."} Update your profile and save to resubmit.`}
        </StatusMessage>
      )}

      <Card className="border border-border/60 bg-card p-6 shadow-sm">
        <CardContent className="p-0">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Member identity">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-semibold ring-1 ring-border/60" style={{ backgroundColor: member.avatarColor, color: "#1a1200" }}>
                <MemberAvatarContent member={member} imageClassName="rounded-2xl" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">DDNI member</p>
                <h2 className="mt-1 break-words font-display text-2xl leading-snug font-semibold tracking-tight text-foreground">{member.name}</h2>
                <p className="mt-0.5 break-words text-sm text-muted-foreground">{member.title !== "DDNI Member" ? member.title : "Member account"}</p>
                {member.email && <p className="mt-1 break-all text-sm text-muted-foreground">{member.email}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {member.emailConfirmedAt && (
                  <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/10 text-foreground">
                    <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />Verified email
                  </Badge>
                )}
                {member.profileStatus && <Badge variant="outline" className="border-border/60 bg-muted/50 text-foreground">{statusLabels[member.profileStatus] || member.profileStatus}</Badge>}
              </div>
              {member.memberSince && (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Member since <span className="font-medium text-foreground">{member.memberSince}</span>
                </p>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="gap-6">
        <TabsList variant="line" aria-label="Profile sections" className="h-auto w-full justify-start gap-2 border-b border-border/60 px-1 pb-1">
          <TabsTrigger value="activity" className="min-h-11 flex-none gap-2 rounded-none px-3 text-sm data-active:text-foreground">
            <History className="size-4" aria-hidden="true" />Account history
          </TabsTrigger>
          <TabsTrigger value="details" className="min-h-11 flex-none gap-2 rounded-none px-3 text-sm data-active:text-foreground">
            <UserRound className="size-4" aria-hidden="true" />Profile details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="flex flex-col gap-6">
          <AccountHistory member={member} data={data} onNavigate={onNavigate} />
        </TabsContent>

        <TabsContent value="details" className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.75fr)]">
          <form onSubmit={requestSave} noValidate className="min-w-0">
            <Card className="gap-6 border border-border/60 bg-card p-6 shadow-sm">
              <CardHeader className="flex flex-col gap-4 p-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg tracking-tight">Personal and professional details</CardTitle>
                  <CardDescription className="leading-relaxed">Your profile is shared with Network members after DDNI review.</CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="ghost" className="min-h-11 px-4" onClick={cancelEditing} disabled={saving}>Cancel</Button>
                      <Button type="submit" className="btn-gold min-h-11 px-4" disabled={!dirty || saving}>{saving ? "Saving…" : "Save Changes"}</Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" className="min-h-11 px-4" onClick={beginEditing}>Edit Profile</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 p-0">
                {isEditing ? (
                  <div className="flex flex-col gap-6">
                    <section className="space-y-4" aria-labelledby="profile-account-heading">
                      <div className="border-b border-border/60 pb-3">
                        <h3 id="profile-account-heading" className="text-sm font-semibold tracking-tight text-foreground">Account details</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The details DDNI uses to identify your member account.</p>
                      </div>
                      <div className="grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">
                        {input("name", "Full name", { autoComplete: "name", required: true })}
                        {input("title", "Professional title", { placeholder: "e.g. Founder, Whitfield Capital" })}
                        <Field id="profile-email" label="Email address" hint="Change your email in Settings.">
                          <p className="flex min-h-11 items-center rounded-lg border border-border/60 bg-muted/50 px-3 text-sm text-muted-foreground">{accountEmail}</p>
                        </Field>
                        {input("location", "Location", { autoComplete: "address-level2", placeholder: "City, Country" })}
                        {input("avatarUrl", "Profile photo link", { type: "url", placeholder: "https://…" }, "Link to a square image (JPG or PNG).")}
                      </div>
                    </section>
                    <section className="space-y-4" aria-labelledby="profile-professional-heading">
                      <div className="border-b border-border/60 pb-3">
                        <h3 id="profile-professional-heading" className="text-sm font-semibold tracking-tight text-foreground">Professional presence</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The information members can use to understand and connect with you.</p>
                      </div>
                      <div className="grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">
                        {input("headline", "Headline", { placeholder: "What you do, in a sentence" })}
                        {input("role", "Role", { placeholder: "e.g. Managing Partner" })}
                        {input("company", "Company or ministry")}
                        {input("website", "Website", { type: "url", placeholder: "https://…" })}
                        {input("linkedinUrl", "LinkedIn", { type: "url", placeholder: "https://linkedin.com/in/…" })}
                        <div className="sm:col-span-2">{input("skills", "Areas of expertise", { placeholder: "Leadership, Finance, Teaching" }, "Separate each with a comma.")}</div>
                        <Field id="profile-bio" label="Personal introduction" error={errors.bio} hint={`${form.bio.length}/${BIO_LIMIT}`} className="sm:col-span-2">
                          <Textarea
                            id="profile-bio"
                            name="bio"
                            rows={5}
                            value={form.bio}
                            onChange={(event) => update("bio", event.target.value)}
                            aria-invalid={Boolean(errors.bio)}
                            aria-describedby={errors.bio ? "profile-bio-error" : "profile-bio-hint"}
                            placeholder="A short introduction for other members."
                          />
                        </Field>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section className="space-y-4" aria-labelledby="profile-account-heading">
                      <div>
                        <h3 id="profile-account-heading" className="text-sm font-semibold tracking-tight text-foreground">Account details</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">How your DDNI member account is identified.</p>
                      </div>
                      <dl className="grid gap-x-6 gap-y-5 rounded-xl bg-muted/30 p-4 sm:grid-cols-2 sm:p-5">
                        <ProfileDetail label="Full name">{member.name}</ProfileDetail>
                        <ProfileDetail label="Email address">{accountEmail}</ProfileDetail>
                        <ProfileDetail label="Location">{profileLocation}</ProfileDetail>
                        <ProfileDetail label="Professional title">{member.title === "DDNI Member" ? "" : member.title}</ProfileDetail>
                      </dl>
                    </section>
                    <section className="space-y-4 border-t border-border/60 pt-5" aria-labelledby="profile-professional-heading">
                      <div>
                        <h3 id="profile-professional-heading" className="text-sm font-semibold tracking-tight text-foreground">Professional presence</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The details members see after your profile is reviewed.</p>
                      </div>
                      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                        <ProfileDetail label="Headline">{data.profile.headline}</ProfileDetail>
                        <ProfileDetail label="Role">{data.profile.role}</ProfileDetail>
                        <ProfileDetail label="Company or ministry">{data.profile.company}</ProfileDetail>
                        <ProfileDetail label="Website">
                          {data.profile.website && isValidUrl(data.profile.website) ? <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline-offset-4 hover:underline">{data.profile.website}</a> : data.profile.website}
                        </ProfileDetail>
                        <ProfileDetail label="LinkedIn">
                          {data.profile.linkedinUrl && isValidUrl(data.profile.linkedinUrl) ? <a href={data.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline-offset-4 hover:underline">{data.profile.linkedinUrl}</a> : data.profile.linkedinUrl}
                        </ProfileDetail>
                      </dl>
                    </section>
                    <section className="space-y-2 border-t border-border/60 pt-5" aria-labelledby="profile-skills-title">
                      <h3 id="profile-skills-title" className="text-xs font-medium text-muted-foreground">Areas of expertise</h3>
                      {data.profile.skills.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {data.profile.skills.map((skill) => <li key={skill}><Badge variant="secondary">{skill}</Badge></li>)}
                        </ul>
                      ) : <p className="text-sm text-muted-foreground">Not provided</p>}
                    </section>
                    <section className="space-y-2 border-t border-border/60 pt-5" aria-labelledby="profile-bio-title">
                      <h3 id="profile-bio-title" className="text-xs font-medium text-muted-foreground">Personal introduction</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{data.profile.bio || <span className="text-muted-foreground">Not provided</span>}</p>
                    </section>
                  </div>
                )}
                <section className="space-y-2 border-t border-border/60 pt-5" aria-labelledby="profile-preferences-title">
                  <h3 id="profile-preferences-title" className="text-xs font-medium text-muted-foreground">Communication preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{member.preferences.emailUpdates ? "Email updates on" : "Email updates off"}</Badge>
                    <Badge variant="outline">{member.preferences.networkAlerts ? "Network alerts on" : "Network alerts off"}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">Manage these preferences in Settings.</p>
                </section>
              </CardContent>
            </Card>
          </form>

          <Card className="h-fit gap-6 border border-border/60 bg-card p-6 shadow-sm">
            <CardHeader className="p-0">
              <CardTitle className="text-base tracking-tight">Profile strength</CardTitle>
              <CardDescription className="leading-relaxed">Complete your profile to improve discovery.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-0">
              <div className="flex items-end justify-between gap-3">
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-primary">{completion.percent}%</span>
                <span className="text-xs text-muted-foreground">{completion.percent === 100 ? "Complete" : completion.percent >= 60 ? "Strong foundation" : "Getting started"}</span>
              </div>
              <Progress value={completion.percent} className="h-2" />
              <ul className="flex flex-col gap-3 text-sm">
                {["Full name", "Professional title", "Profile photo", "Headline", "Company", "Location", "Areas of expertise", "Personal introduction"].map((label) => {
                  const done = !completion.missing.includes(label)
                  return <li key={label} className={`flex items-center gap-2 ${done ? "text-foreground" : "text-muted-foreground"}`}>{done ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}{label}</li>
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-6 text-card-foreground shadow-xl outline-none motion-safe:transition-[opacity,scale] motion-safe:duration-200 motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-starting-style:scale-[0.98]">
            <Dialog.Title className="text-lg leading-snug font-semibold tracking-tight text-foreground">Confirm profile changes</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">Are you sure you want to update your profile details?</Dialog.Description>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Dialog.Close render={<Button type="button" variant="ghost" className="min-h-11 px-4" disabled={saving} />}>Cancel</Dialog.Close>
              <Button type="button" className="btn-gold min-h-11 px-4" onClick={() => void confirmSave()} disabled={saving}>
                {saving ? "Saving…" : "Confirm changes"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
