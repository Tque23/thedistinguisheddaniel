"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EmptyState, StatusMessage, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { SUPPORT_EMAIL, formatDate, type Course, type Resource } from "@/lib/dashboard-data"
import { BookOpen, CalendarDays, Clock, ExternalLink, FileText, PlayCircle, Search, UserRound } from "lucide-react"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

const isMedia = (type: string) => /video|recording|audio|podcast|webinar/i.test(type)

function FilterChips({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  if (options.length <= 2) return null
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
      {options.map((option) => (
        <Button key={option} size="sm" variant={value === option ? "default" : "outline"} aria-pressed={value === option} className={value === option ? "btn-gold h-7 text-xs" : "h-7 text-xs"} onClick={() => onChange(option)}>
          {option}
        </Button>
      ))}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-8 pl-8 text-sm" />
    </div>
  )
}

function ResourceAction({ resource }: { resource: Resource }) {
  if (!resource.url) return <span className="text-xs text-muted-foreground">Link coming soon</span>
  const Icon = isMedia(resource.type) ? PlayCircle : ExternalLink
  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" render={<a href={resource.url} target="_blank" rel="noopener noreferrer" />}>
      <Icon data-icon="inline-start" />{isMedia(resource.type) ? "Watch" : "Open"}
    </Button>
  )
}

export function InstituteView({ data }: DashboardViewProps) {
  const [courseQuery, setCourseQuery] = useState("")
  const [courseCategory, setCourseCategory] = useState("All")
  const [resourceQuery, setResourceQuery] = useState("")
  const [resourceType, setResourceType] = useState("All")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const courseCategories = useMemo(() => ["All", ...Array.from(new Set(data.courses.map((c) => c.category)))], [data.courses])
  const resourceTypes = useMemo(() => ["All", ...Array.from(new Set(data.resources.map((r) => r.type)))], [data.resources])

  const courses = data.courses.filter((c) => {
    const q = courseQuery.trim().toLowerCase()
    return (courseCategory === "All" || c.category === courseCategory) && (!q || [c.title, c.instructor, c.description].some((v) => v.toLowerCase().includes(q)))
  })
  const resources = data.resources.filter((r) => {
    const q = resourceQuery.trim().toLowerCase()
    return (resourceType === "All" || r.type === resourceType) && (!q || [r.title, r.description].some((v) => v.toLowerCase().includes(q)))
  })

  return (
    <div className="flex flex-col gap-6">
      <ViewHeader kicker="The Institute" title="Grow in wisdom and understanding" description="Courses, teachings and resources published by the Distinguished Daniel Institute." />

      <Tabs defaultValue="courses" className="gap-4">
        <TabsList>
          <TabsTrigger value="courses">Courses{!data.loading && ` (${data.courses.length})`}</TabsTrigger>
          <TabsTrigger value="resources">Resource library{!data.loading && ` (${data.resources.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={courseQuery} onChange={setCourseQuery} placeholder="Search courses" />
            <FilterChips options={courseCategories} value={courseCategory} onChange={setCourseCategory} />
          </div>
          {data.errors.courses && <StatusMessage tone="error">{data.errors.courses}</StatusMessage>}
          {data.loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title={data.courses.length ? "No courses match your search" : "Courses are being prepared"} description={data.courses.length ? "Try a different search or category." : "New courses from the Institute will appear here as soon as they're published."} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="dashboard-card-hover flex flex-col overflow-hidden pt-0">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
                    {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><BookOpen className="size-8 text-[#f3d27a]/60" /></div>}
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-2">
                    <Badge variant="outline" className="w-fit text-[10px]">{course.category}</Badge>
                    <p className="text-sm leading-snug font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{[course.instructor, course.duration].filter(Boolean).join(" · ")}</p>
                    <Button size="sm" className="btn-gold mt-auto" onClick={() => setSelectedCourse(course)}>View details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={resourceQuery} onChange={setResourceQuery} placeholder="Search resources" />
            <FilterChips options={resourceTypes} value={resourceType} onChange={setResourceType} />
          </div>
          {data.errors.resources && <StatusMessage tone="error">{data.errors.resources}</StatusMessage>}
          {data.loading ? <Skeleton className="h-48 rounded-xl" /> : resources.length === 0 ? (
            <EmptyState icon={FileText} title={data.resources.length ? "No resources match your search" : "The library is being curated"} description={data.resources.length ? "Try a different search or type." : "Guides, recordings and downloads will appear here once published."} />
          ) : (
            <>
              <Card className="hidden py-0 md:block">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="max-w-md whitespace-normal">
                          <p className="font-medium text-foreground">{resource.title}</p>
                          {resource.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{resource.description}</p>}
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{resource.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(resource.createdAt)}</TableCell>
                        <TableCell className="text-right"><ResourceAction resource={resource} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <div className="flex flex-col gap-3 md:hidden">
                {resources.map((resource) => (
                  <Card key={resource.id} size="sm">
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-foreground">{resource.title}</p><Badge variant="secondary" className="shrink-0 text-[10px]">{resource.type}</Badge></div>
                      {resource.description && <p className="text-xs text-muted-foreground">{resource.description}</p>}
                      <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{formatDate(resource.createdAt)}</span><ResourceAction resource={resource} /></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={selectedCourse !== null} onOpenChange={(open) => { if (!open) setSelectedCourse(null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selectedCourse && (
            <>
              <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
                {selectedCourse.thumbnailUrl ? <img src={selectedCourse.thumbnailUrl} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><BookOpen className="size-10 text-[#f3d27a]/60" /></div>}
              </div>
              <SheetHeader className="gap-2">
                <Badge variant="outline" className="w-fit text-[10px]">{selectedCourse.category}</Badge>
                <SheetTitle className="font-display text-xl">{selectedCourse.title}</SheetTitle>
                <SheetDescription className="whitespace-pre-line">{selectedCourse.description || "Full course details will be shared by the Institute team."}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
                {selectedCourse.instructor && <p className="flex items-center gap-2"><UserRound className="size-4 text-[#f3d27a]" />{selectedCourse.instructor}</p>}
                {selectedCourse.eventDate && <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#f3d27a]" />{formatDate(selectedCourse.eventDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>}
                {selectedCourse.duration && <p className="flex items-center gap-2"><Clock className="size-4 text-[#f3d27a]" />{selectedCourse.duration}</p>}
              </div>
              <SheetFooter>
                <Button className="btn-gold" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Course enquiry: ${selectedCourse.title}`)}`} />}>Enquire about this course</Button>
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>Close</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
