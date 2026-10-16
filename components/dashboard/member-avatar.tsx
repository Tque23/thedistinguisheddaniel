"use client"

import { useState } from "react"
import type { DashboardMember } from "@/components/dashboard/dashboard-shell"

export function MemberAvatarContent({ member, imageClassName = "rounded-full" }: { member: Pick<DashboardMember, "avatarUrl" | "initials">; imageClassName?: string }) {
  const [failed, setFailed] = useState(false)

  if (!member.avatarUrl || failed) return <>{member.initials}</>

  return (
    <img
      src={member.avatarUrl}
      alt=""
      referrerPolicy="no-referrer"
      className={`size-full object-cover ${imageClassName}`}
      onError={() => setFailed(true)}
    />
  )
}
