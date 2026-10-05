"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  businessProfile,
  memberDirectory,
  opportunities,
  type MemberTier,
  type Opportunity,
} from "@/lib/dashboard-data"
import {
  Briefcase,
  Building2,
  Globe,
  Handshake,
  Lightbulb,
  Mic,
  Search,
  TrendingUp,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categoryIcon: Record<Opportunity["category"], typeof Briefcase> = {
  Investment: TrendingUp,
  Partnership: Handshake,
  Mentorship: Lightbulb,
  Speaking: Mic,
}

const tierStyles: Record<MemberTier, string> = {
  Patron: "border-[#dcb567]/40 text-[#f3d27a]",
  Fellow: "border-[#a9c7f3]/40 text-[#a9c7f3]",
  Ambassador: "border-border text-muted-foreground",
}

export function NetworkView() {
  const [memberQuery, setMemberQuery] = useState("")

  const filteredMembers = useMemo(
    () =>
      memberDirectory.filter((m) => {
        const q = memberQuery.toLowerCase()
        return (
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }),
    [memberQuery]
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-base font-semibold text-foreground">Opportunity Board</h2>
          <div className="flex flex-col gap-3">
            {opportunities.map((op) => {
              const Icon = categoryIcon[op.category]
              return (
                <Card key={op.id}>
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#dcb567]/10 text-[#f3d27a]">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium leading-snug text-foreground">
                            {op.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {op.postedBy} · {op.postedByTitle}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {op.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{op.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {op.location} · {op.postedAt}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Respond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Business profile manager */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-[#f3d27a]" />
              My Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">
                {businessProfile.company}
              </span>
              <span className="text-xs text-muted-foreground">
                {businessProfile.tagline}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {businessProfile.industry}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Globe className="size-3" />
                {businessProfile.website}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium text-foreground">
                  {businessProfile.completion}%
                </span>
              </div>
              <Progress value={businessProfile.completion} className="h-1.5" />
              {businessProfile.missingFields.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Missing: {businessProfile.missingFields.join(", ")}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
              <span>Profile views</span>
              <span className="font-medium text-foreground">
                {businessProfile.profileViews}
              </span>
            </div>
            <Button size="sm" className="btn-gold w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Member directory */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">Member Directory</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search by name, company, or focus..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#132c40] text-xs font-semibold text-[#f3d27a]">
                    {member.initials}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {member.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {member.title}, {member.company}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", tierStyles[member.tier])}
                  >
                    {member.tier}
                  </Badge>
                  {member.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {member.location}
                  </span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <UserPlus data-icon="inline-start" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No members match your search.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
