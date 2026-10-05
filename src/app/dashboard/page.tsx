import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import "./dashboard.css"

export const metadata: Metadata = {
  title: "Member Dashboard | The Distinguished Daniel Network and Institute",
  description:
    "Your Institute learning path, certifications, and Network opportunities in one place.",
}

export default function Page() {
  return <DashboardShell />
}
