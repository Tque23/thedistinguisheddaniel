"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BookOpen, Briefcase, CalendarDays, Clock, Library, Mail, MapPin, MoreVertical, Pin, Megaphone, ShieldCheck, Users2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Opportunity } from "@/lib/dashboard-data"
import { ANNOUNCEMENT_CATEGORIES, announcementCategory, longDate, type AnnouncementCategory } from "@/lib/ddni-content"
import { SESSIONS, formatTimeRange, sessionTitle } from "@/lib/ddni-schedule"
import { cn } from "@/lib/utils"
import { DdniButton, EmptyPanel, LoadingBlock, PageHeading, Panel, TextLink } from "@/components/dashboard/ddni-ui"
import type { DashboardView, DashboardViewProps } from "@/components/dashboard/dashboard-shell"

const SEEN_KEY = "ddni-notifications-seen-at"

type TabId = "all" | "unread" | "courses" | "updates"

const CATEGORY_ICON = {
  "My Courses": BookOpen,
  "DDNI Updates": ShieldCheck,
  "Events & Sessions": CalendarDays,
  Resources: Library,
  Opportunities: Briefcase,
}

const CATEGORY_ACTION: Record<AnnouncementCategory, { label: string; view?: DashboardView }> = {
  "My Courses": { label: "View Courses", view: "courses" },
  "DDNI Updates": { label: "Read More" },
  "Events & Sessions": { label: "View Calendar", view: "calendar" },
  Resources: { label: "View Materials", view: "library" },
  Opportunities: { label: "View Opportunities", view: "opportunities" },
}

function Tile({ category, className }: { category: AnnouncementCategory; className?: string }) {
  const Icon = CATEGORY_ICON[category]
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-lg bg-[linear-gradient(160deg,#10294d,#071428)] text-[#e4c276] shadow-md ring-1 ring-[#c9a14f]/30", className)}>
      <Icon className="size-1/2" />
    </span>
  )
}

function Meta({ date }: { date: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-foreground/75">
      <span className="inline-flex items-center gap-1.5"><Users2 className="size-3.5" aria-hidden />DDNI Administration</span>
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden />{longDate(date)}</span>
    </p>
  )
}

export function AnnouncementsView({ data, onNavigate }: DashboardViewProps) {
  const [tab, setTab] = useState<TabId>("all")
  const [category, setCategory] = useState<AnnouncementCategory | null>(null)
  const [seenAt, setSeenAt] = useState(0)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() => new Set())
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSeenAt(Number(window.localStorage.getItem(SEEN_KEY) || 0))
  }, [])

  const items = data.opportunities
  const pinned = items[0]
  const rest = items.slice(1)
  const isUnread = (item: Opportunity) => unreadIds.has(item.id) || (!readIds.has(item.id) && new Date(item.createdAt).getTime() > seenAt)
  const unreadCount = items.filter(isUnread).length

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(ANNOUNCEMENT_CATEGORIES.map((name) => [name, 0])) as Record<AnnouncementCategory, number>
    items.forEach((item) => { counts[announcementCategory(item)] += 1 })
    return counts
  }, [items])

  const courseCount = categoryCounts["My Courses"]
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: `All (${items.length})` },
    { id: "unread", label: `Unread (${unreadCount})` },
    { id: "courses", label: `My Courses (${courseCount})` },
    { id: "updates", label: `DDNI Updates (${items.length - courseCount})` },
  ]

  const visible = rest.filter((item) => {
    const cat = announcementCategory(item)
    if (category && cat !== category) return false
    if (tab === "unread") return isUnread(item)
    if (tab === "courses") return cat === "My Courses"
    if (tab === "updates") return cat !== "My Courses"
    return true
  })
  const showPinned = pinned && (!category || announcementCategory(pinned) === category)
    && (tab === "all" || (tab === "unread" && isUnread(pinned)) || (tab === "courses" && announcementCategory(pinned) === "My Courses") || (tab === "updates" && announcementCategory(pinned) !== "My Courses"))

  function markRead(id: string) {
    setReadIds((current) => new Set(current).add(id))
    setUnreadIds((current) => { const next = new Set(current); next.delete(id); return next })
  }

  function markUnread(id: string) {
    setUnreadIds((current) => new Set(current).add(id))
    setReadIds((current) => { const next = new Set(current); next.delete(id); return next })
  }

  function markAllRead() {
    const now = Date.now()
    window.localStorage.setItem(SEEN_KEY, String(now))
    setSeenAt(now)
    setReadIds(new Set(items.map((item) => item.id)))
    setUnreadIds(new Set())
  }

  function act(item: Opportunity) {
    markRead(item.id)
    const action = CATEGORY_ACTION[announcementCategory(item)]
    if (action.view) onNavigate(action.view)
    else setExpanded((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next })
  }

  const upcoming = SESSIONS.filter((session) => session.end.getTime() >= Date.now() && session.mode === "in-person").slice(0, 3)

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Announcements" subtitle="Stay informed. Stay connected." onHome={() => onNavigate("overview")} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Announcement filters" className="flex flex-wrap gap-2">
              {tabs.map((item) => {
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={cn("ddni-btn ddni-serif h-10 rounded-md border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a]", active ? "ddni-btn-gold" : "border-input bg-white text-foreground hover:bg-[#f7efdc]")}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0} className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-[#8a6420] underline underline-offset-4 transition-colors hover:text-[#5f4312] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a] disabled:cursor-not-allowed disabled:opacity-50">
              <Mail className="size-4" aria-hidden />Mark All as Read
            </button>
          </div>

          {category && (
            <p className="text-sm text-muted-foreground">Showing <strong className="text-foreground">{category}</strong>. <button type="button" onClick={() => setCategory(null)} className="font-medium text-[#8a6420] underline underline-offset-4">Clear</button></p>
          )}

          {data.errors.opportunities && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.opportunities}</p>}

          {data.loading ? (
            <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <LoadingBlock key={i} className="h-32" />)}</div>
          ) : !showPinned && visible.length === 0 ? (
            <EmptyPanel
              icon={Megaphone}
              title={items.length ? "No announcements here" : "No announcements yet"}
              description={items.length ? "Try a different filter or category." : "Updates from the DDNI team will appear here."}
              action={items.length ? <DdniButton variant="outline" onClick={() => { setTab("all"); setCategory(null) }}>Show all announcements</DdniButton> : undefined}
            />
          ) : (
            <>
              {showPinned && pinned && (
                <article className="flex flex-col gap-4 rounded-xl border border-[#e8d9b4] bg-[#fbf1dc] p-4 shadow-sm sm:p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#8a6420] uppercase"><Pin className="size-3.5 fill-current" aria-hidden />Pinned Announcement</p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Tile category={announcementCategory(pinned)} className="size-20 sm:size-28" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <h3 className="ddni-serif text-xl leading-snug font-bold text-foreground sm:text-2xl">{pinned.title}</h3>
                      <p className={cn("text-sm leading-relaxed text-foreground/85", !expanded.has(pinned.id) && "line-clamp-3")}>{pinned.description}</p>
                      <Meta date={pinned.createdAt} />
                    </div>
                    <DdniButton size="lg" className="ddni-serif sm:self-center" onClick={() => act(pinned)}>{CATEGORY_ACTION[announcementCategory(pinned)].label}<ArrowRight /></DdniButton>
                  </div>
                </article>
              )}

              <ul className="flex flex-col gap-3">
                {visible.map((item) => {
                  const cat = announcementCategory(item)
                  const unread = isUnread(item)
                  const open = expanded.has(item.id)
                  return (
                    <li key={item.id}>
                      <article className="ddni-card ddni-card-hover flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <span className={cn("size-3 shrink-0 rounded-full", unread ? "bg-[#b8893a]" : "bg-transparent")} aria-label={unread ? "Unread" : undefined} role={unread ? "img" : undefined} />
                          <Tile category={cat} className="size-16 sm:size-20" />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <h3 className={cn("ddni-serif text-lg leading-snug text-foreground", unread ? "font-bold" : "font-semibold")}>{item.title}</h3>
                            <p className={cn("text-sm leading-relaxed text-foreground/80", !open && "line-clamp-2")}>{item.description}</p>
                            <Meta date={item.createdAt} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <DdniButton variant="outline" size="md" className="ddni-serif" onClick={() => act(item)} aria-expanded={CATEGORY_ACTION[cat].view ? undefined : open}>{!CATEGORY_ACTION[cat].view && open ? "Show Less" : CATEGORY_ACTION[cat].label}<ArrowRight /></DdniButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<button type="button" aria-label={`More actions for ${item.title}`} className="grid size-9 place-items-center rounded-md text-foreground/80 transition-colors hover:bg-[#f7efdc]" />}>
                              <MoreVertical className="size-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {unread ? <DropdownMenuItem onClick={() => markRead(item.id)}>Mark as read</DropdownMenuItem> : <DropdownMenuItem onClick={() => markUnread(item.id)}>Mark as unread</DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Announcement tools">
          <Panel title="Categories" icon={Briefcase}>
            <ul className="flex flex-col">
              <li>
                <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null} className={cn("flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f7efdc]", category === null ? "bg-[#fbf1dc] font-semibold text-foreground" : "text-foreground/85")}>
                  All Announcements<span className="grid min-w-7 place-items-center rounded-full bg-white px-2 py-0.5 text-xs">{items.length}</span>
                </button>
              </li>
              {ANNOUNCEMENT_CATEGORIES.map((name) => (
                <li key={name} className="border-t border-border/60 first:border-t-0">
                  <button type="button" onClick={() => { setCategory(name); setTab("all") }} aria-pressed={category === name} className={cn("flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f7efdc]", category === name ? "bg-[#fbf1dc] font-semibold text-foreground" : "text-foreground/85")}>
                    {name}<span className="grid min-w-7 place-items-center rounded-full bg-[#eeebe3] px-2 py-0.5 text-xs">{categoryCounts[name]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Upcoming Dates" icon={CalendarDays} action={<TextLink onClick={() => onNavigate("calendar")} className="text-xs text-[#8a6420]">View calendar<ArrowRight className="size-3.5" /></TextLink>}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcoming.map((session) => (
                  <li key={session.id} className="flex items-center gap-3 rounded-lg border border-border bg-white p-2.5">
                    <span className="grid w-12 shrink-0 place-items-center rounded-md bg-[#eef0f5] py-1 text-center leading-none">
                      <span className="text-[10px] font-semibold tracking-wide text-[#0c1d3a] uppercase">{session.start.toLocaleDateString("en-GB", { month: "short" })}</span>
                      <span className="ddni-serif text-xl font-bold text-[#0c1d3a]">{String(session.start.getDate()).padStart(2, "0")}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="ddni-serif block truncate text-sm font-bold text-foreground">{sessionTitle(session)}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3" aria-hidden />{formatTimeRange(session)}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{session.location}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <section className="ddni-card p-5">
            <div className="flex items-start gap-3">
              <BookOpen className="size-9 shrink-0 text-[#d9bf87]" aria-hidden />
              <div>
                <h3 className="ddni-serif text-lg font-bold text-foreground">Need a resource?</h3>
                <p className="mt-1 text-sm text-foreground/80">Access course materials, manuals and more in the Resource Library.</p>
              </div>
            </div>
            <DdniButton variant="outline" size="lg" className="ddni-serif mt-4 w-full" onClick={() => onNavigate("library")}>Go to Resource Library<ArrowRight /></DdniButton>
          </section>
        </aside>
      </div>
    </div>
  )
}
