"use client"

import { useState, type FormEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, StatusMessage, ViewHeader, selectClassName } from "@/components/dashboard/dashboard-ui"
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF, SUPPORT_WHATSAPP_HREF } from "@/lib/dashboard-data"
import { ChevronDown, Mail, MessageCircle, Phone, Send } from "lucide-react"
import type { DashboardView, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

const topics = ["Account & sign-in", "Institute courses", "Network & opportunities", "Profile review", "Something else"]

const faqs: { q: string; a: string; view?: DashboardView; cta?: string }[] = [
  { q: "How do I change my password?", a: "Open Settings, choose Change password and enter a new password of at least 8 characters.", view: "settings", cta: "Open settings" },
  { q: "Why does my profile say “Pending review”?", a: "Every professional profile is reviewed by the DDNI team before it is shared with the Network. You'll be able to see the status in Account History.", view: "history", cta: "View history" },
  { q: "How do I enrol in a course?", a: "Open a course in the Institute and choose “Enquire about this course”. The Institute team will reply with next steps.", view: "institute", cta: "Browse courses" },
  { q: "How do I respond to an opportunity?", a: "Select Respond on any opportunity in the Network. Your email app opens with the opportunity referenced in the subject line." , view: "network", cta: "Open the Network" },
  { q: "Can I update my contact email?", a: "Yes. In Settings, enter your new email and confirm the change from the link we send to your inbox." },
]

type Errors = Partial<Record<"topic" | "subject" | "message", string>>

export function SupportView({ member, onNavigate }: DashboardViewProps) {
  const [form, setForm] = useState({ topic: "", subject: "", message: "" })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  function validate() {
    const next: Errors = {}
    if (!form.topic) next.topic = "Choose a topic."
    if (form.subject.trim().length < 4) next.subject = "Add a short subject (at least 4 characters)."
    else if (form.subject.length > 120) next.subject = "Keep the subject under 120 characters."
    if (form.message.trim().length < 20) next.message = "Tell us a little more (at least 20 characters)."
    else if (form.message.length > 2000) next.message = "Keep your message under 2,000 characters."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setSent(false)
    if (!validate()) return
    const body = `${form.message.trim()}\n\n—\nMember: ${member.name}\nEmail: ${member.email}\nMember ID: ${member.id}\nTopic: ${form.topic}`
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${form.topic}] ${form.subject.trim()}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <ViewHeader kicker="Support" title="We're here to help" description="Send the DDNI team a message, or find a quick answer below." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Your message opens in your email app, addressed to {SUPPORT_EMAIL}, with your member details included.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <Field id="support-topic" label="Topic" error={errors.topic}>
                <select id="support-topic" className={selectClassName} value={form.topic} aria-invalid={Boolean(errors.topic)} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                  <option value="">Select a topic</option>
                  {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </select>
              </Field>
              <Field id="support-subject" label="Subject" error={errors.subject}>
                <Input id="support-subject" value={form.subject} maxLength={120} aria-invalid={Boolean(errors.subject)} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" />
              </Field>
              <Field id="support-message" label="Message" error={errors.message} hint={`${form.message.length}/2000`}>
                <Textarea id="support-message" value={form.message} maxLength={2000} rows={6} aria-invalid={Boolean(errors.message)} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Share as much detail as you can." />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="btn-gold"><Send data-icon="inline-start" />Send message</Button>
                {sent && <StatusMessage tone="success">Your email app should open now. If it doesn&apos;t, email us at {SUPPORT_EMAIL}.</StatusMessage>}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Contact the team</CardTitle><CardDescription>Wiseman Mavundla, Network Coordinator</CardDescription></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <ContactLink href={`mailto:${SUPPORT_EMAIL}`} icon={Mail} label={SUPPORT_EMAIL} />
              <ContactLink href={SUPPORT_PHONE_HREF} icon={Phone} label={SUPPORT_PHONE} />
              <ContactLink href={SUPPORT_WHATSAPP_HREF} icon={MessageCircle} label="Message on WhatsApp" external />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Frequently asked questions</CardTitle></CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-col items-start gap-2 pt-2">
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                {faq.view && <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => onNavigate(faq.view!)}>{faq.cta}</Button>}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ContactLink({ href, icon: Icon, label, external }: { href: string; icon: typeof Mail; label: string; external?: boolean }) {
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:border-[#dcb567]/40 hover:bg-accent/40">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#970024]/20 text-[#ef7182]"><Icon className="size-4" /></span>
      <span className="min-w-0 truncate">{label}</span>
    </a>
  )
}
