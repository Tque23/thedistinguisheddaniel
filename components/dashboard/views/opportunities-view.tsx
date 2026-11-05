"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Bookmark, BriefcaseBusiness, CalendarDays, Handshake, Megaphone, Sprout, UsersRound } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SUPPORT_EMAIL, type Opportunity } from "@/lib/dashboard-data"
import { OPPORTUNITY_KIND_LABEL, longDate, opportunityKind, type OpportunityKind } from "@/lib/ddni-content"
import { cn } from "@/lib/utils"
import { DdniButton, EmptyPanel, LoadingBlock, Pill, SearchBox, SelectField, UnderlineTabs, type TabItem } from "@/components/dashboard/ddni-ui"
import { ViewContainer, ViewHeader } from "@/components/dashboard/dashboard-ui"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

type TabId = "all" | OpportunityKind | "saved"

const KIND_ICON = { jobs: BriefcaseBusiness, volunteering: UsersRound, collaboration: Handshake }
const DAY = 24 * 60 * 60 * 1000

function Thumb({ kind }: { kind: OpportunityKind }) {
  const Icon = KIND_ICON[kind]
  return (
    <div aria-hidden className="relative grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_30%_20%,#1c3f73,#081a36_70%)] sm:h-auto sm:w-40 sm:self-stretch">
      <div className="absolute -right-8 -bottom-10 size-32 rounded-full border border-[#c9a14f]/40" />
      <Icon className="size-10 text-[#e4c276]" />
    </div>
  )
}

export function OpportunitiesView({ data }: DashboardViewProps) {
  const [query, setQuery] = useState("")
  const [posted, setPosted] = useState("any")
  const [sort, setSort] = useState("newest")
  const [tab, setTab] = useState<TabId>("all")
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const now = useMemo(() => Date.now(), [])

  const counts = {
    all: data.opportunities.length,
    jobs: data.opportunities.filter((item) => opportunityKind(item) === "jobs").length,
    volunteering: data.opportunities.filter((item) => opportunityKind(item) === "volunteering").length,
    collaboration: data.opportunities.filter((item) => opportunityKind(item) === "collaboration").length,
    saved: data.opportunities.filter((item) => saved.has(item.id)).length,
  }
  const tabs: TabItem<TabId>[] = [
    { id: "all", label: "All Opportunities" },
    { id: "jobs", label: OPPORTUNITY_KIND_LABEL.jobs },
    { id: "volunteering", label: OPPORTUNITY_KIND_LABEL.volunteering },
    { id: "collaboration", label: OPPORTUNITY_KIND_LABEL.collaboration },
    { id: "saved", label: "Saved", count: counts.saved },
  ]

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data.opportunities.filter((item) => {
      if (q && !`${item.title} ${item.description}`.toLowerCase().includes(q)) return false
      if (posted !== "any" && now - new Date(item.createdAt).getTime() > Number(posted) * DAY) return false
      if (tab === "saved") return saved.has(item.id)
      if (tab !== "all") return opportunityKind(item) === tab
      return true
    })
    return list.sort((a, b) => (sort === "newest" ? 1 : -1) * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [data.opportunities, query, posted, sort, tab, saved, now])

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clear() {
    setQuery("")
    setPosted("any")
    setTab("all")
  }

  const filtering = query !== "" || posted !== "any" || tab !== "all"

  return (
    <ViewContainer>
      <ViewHeader kicker="Member opportunities" title="Opportunities" description="Put your gifts, skills and learning into action." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
            <SearchBox value={query} onChange={setQuery} placeholder="Search opportunities..." label="Search opportunities" className="self-center" />
            <SelectField id="opp-posted" label="Posted" value={posted} onChange={setPosted} options={[{ value: "any", label: "Any date" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }]} />
            <SelectField id="opp-sort" label="Sort by" value={sort} onChange={setSort} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} />
          </div>

          <UnderlineTabs label="Opportunity categories" items={tabs} value={tab} onChange={setTab} />
          {!data.loading && <p className="text-xs text-muted-foreground" aria-live="polite">{visible.length} {visible.length === 1 ? "opportunity" : "opportunities"}</p>}

          {data.errors.opportunities && <p role="alert" className="text-sm text-[#b3261e]">{data.errors.opportunities}</p>}

          {data.loading ? (
            <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <LoadingBlock key={i} className="h-36" />)}</div>
          ) : visible.length === 0 ? (
            <EmptyPanel
              icon={BriefcaseBusiness}
              title={data.opportunities.length ? "No opportunities match your filters" : "No opportunities posted yet"}
              description={data.opportunities.length ? "Try a different search or category." : "New roles, volunteering and collaborations will appear here."}
              action={filtering ? <DdniButton variant="outline" onClick={clear}>Clear filters</DdniButton> : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((item) => {
                const kind = opportunityKind(item)
                const isSaved = saved.has(item.id)
                return (
                  <li key={item.id}>
                    <article className="ddni-card ddni-card-hover flex flex-col gap-6 p-6 sm:flex-row">
                      <Thumb kind={kind} />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <h3 className="ddni-serif text-xl leading-snug font-bold text-foreground">{item.title}</h3>
                        <div className="flex flex-wrap gap-2"><Pill tone="gold">DDNI Opportunity</Pill><Pill tone="gray">{OPPORTUNITY_KIND_LABEL[kind]}</Pill></div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">{item.description || "Open the opportunity for more details."}</p>
                      </div>
                      <div className="flex min-w-0 shrink-0 flex-col items-stretch gap-3 border-t border-border pt-3 sm:w-52 sm:flex-col sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                        <div className="flex flex-1 items-start justify-between gap-2">
                          <p className="flex items-start gap-2 text-sm text-foreground/85"><CalendarDays className="mt-0.5 size-5 shrink-0" aria-hidden /><span><span className="block text-xs text-muted-foreground">Posted</span>{longDate(item.createdAt)}</span></p>
                          <button
                            type="button"
                            onClick={() => toggleSaved(item.id)}
                            aria-pressed={isSaved}
                            aria-label={isSaved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
                            className={cn("ddni-btn grid size-10 shrink-0 place-items-center rounded-md border border-[#e2cf9f] transition-colors hover:bg-[#fbf3df]", isSaved ? "bg-[#f5ecd6] text-[#8a6420]" : "bg-white text-[#a9792a]")}
                          >
                            <Bookmark className={cn("size-5", isSaved && "fill-current")} />
                          </button>
                        </div>
                        <DdniButton size="lg" className="w-full" onClick={() => setSelected(item)}>View Opportunity<ArrowRight /></DdniButton>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Opportunity tools">
          <button type="button" onClick={() => setTab("saved")} className="ddni-card ddni-card-hover flex min-h-11 items-center gap-4 p-6 text-left">
            <span className="grid size-14 shrink-0 place-items-center text-[#a9792a]"><Bookmark className="size-11" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="ddni-serif flex items-center justify-between text-base font-bold text-foreground">Saved Opportunities<ArrowRight className="size-4 text-[#a9792a]" aria-hidden /></span>
              <span className="mt-1 flex items-center gap-3"><span className="ddni-serif text-4xl leading-none font-bold text-foreground">{counts.saved}</span><span className="text-xs text-muted-foreground">{counts.saved === 1 ? "Opportunity" : "Opportunities"} saved for later.</span></span>
            </span>
          </button>

          <section className="ddni-card p-6">
            <h3 className="ddni-serif flex items-center gap-3 text-lg font-bold text-foreground"><Megaphone className="size-8 text-[#a9792a]" aria-hidden />Share an Opportunity</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">Know of a role, project or partnership that aligns with DDNI&apos;s mission?</p>
            <DdniButton variant="outline" size="lg" className="mt-4 w-full" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Share an opportunity")}`}>Share Opportunity<ArrowRight /></DdniButton>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-[linear-gradient(160deg,#10294d,#071428)] p-6 text-white shadow-[0_18px_40px_-20px_rgba(8,26,54,0.7)]">
            <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 size-64 rounded-full border border-[#c9a14f]/30" />
            <p className="text-xs font-semibold tracking-[0.2em] text-[#e4c276] uppercase">Explore your potential</p>
            <h3 className="ddni-serif mt-3 text-3xl leading-tight font-bold">Make an Impact Beyond the Classroom</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/85">Find opportunities to serve, collaborate and use your gifts to advance the Kingdom.</p>
            <Sprout className="relative my-5 size-14 text-[#e4c276]" aria-hidden />
            <DdniButton size="lg" className="relative w-full" onClick={clear}>Explore Opportunities<ArrowRight /></DdniButton>
          </section>
        </aside>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="gap-2">
                <Pill tone="gold" className="w-fit">{OPPORTUNITY_KIND_LABEL[opportunityKind(selected)]}</Pill>
                <SheetTitle className="font-display text-xl">{selected.title}</SheetTitle>
                <SheetDescription>Posted {longDate(selected.createdAt)}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-6">
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{selected.description || "More details will be shared by the DDNI team."}</p>
                <DdniButton href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Opportunity: ${selected.title}`)}`}>Express interest</DdniButton>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ViewContainer>
  )
}
