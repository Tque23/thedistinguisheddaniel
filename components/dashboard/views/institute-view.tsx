"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  certifications,
  learningPath,
  resourceLibrary,
  type Resource,
} from "@/lib/dashboard-data"
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  PlayCircle,
  Search,
} from "lucide-react"

const resourceTypeIcon: Record<Resource["type"], typeof FileText> = {
  Guide: FileText,
  Template: Download,
  Recording: PlayCircle,
  Whitepaper: FileText,
}

export function InstituteView() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(resourceLibrary.map((r) => r.category)))],
    []
  )

  const filteredResources = resourceLibrary.filter((r) => {
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === "All" || r.category === category
    return matchesQuery && matchesCategory
  })

  return (
    <div className="flex flex-col gap-8">
      {/* My Learning Path */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">My Learning Path</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {learningPath.map((module) => (
            <Card key={module.id} className="flex flex-col overflow-hidden">
              <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#132c40] to-[#0c1e2c]">
                {module.progress === 100 ? (
                  <CheckCircle2 className="size-8 text-[#f3d27a]" />
                ) : (
                  <PlayCircle className="size-8 text-[#f3d27a]/70" />
                )}
              </div>
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit text-[10px]">
                  {module.track}
                </Badge>
                <CardTitle className="text-sm leading-snug">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {module.completedLessons}/{module.totalLessons} lessons
                  </span>
                  <span>{module.progress}%</span>
                </div>
                <Progress value={module.progress} className="h-1.5" />
                <Button
                  size="sm"
                  variant={module.progress === 100 ? "outline" : "default"}
                  className={module.progress === 100 ? "" : "btn-gold"}
                >
                  {module.progress === 100 ? "Review Course" : "Continue"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Resource Library + Certifications */}
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">Resource Library</TabsTrigger>
          <TabsTrigger value="certifications">Certifications Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources..."
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  className={category === cat ? "btn-gold h-7 text-xs" : "h-7 text-xs"}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => {
                  const Icon = resourceTypeIcon[resource.type]
                  return (
                    <TableRow key={resource.id}>
                      <TableCell className="flex items-center gap-2 font-medium text-foreground">
                        <Icon className="size-3.5 text-muted-foreground" />
                        {resource.title}
                        {resource.duration && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {resource.duration}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {resource.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {resource.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {resource.date}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          {resource.type === "Recording" ? "Watch" : "Download"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredResources.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No resources match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-full bg-[#dcb567]/10 text-[#f3d27a]">
                      <Award className="size-5" />
                    </div>
                    <Badge
                      variant={cert.status === "Earned" ? "outline" : "secondary"}
                      className="text-[10px]"
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {cert.title}
                  </span>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span>Issued: {cert.issued}</span>
                    <span>Credential ID: {cert.credentialId}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
