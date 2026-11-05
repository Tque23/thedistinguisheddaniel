"use client"

import Link from "next/link"
import { Award, ArrowUpRight, GraduationCap, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState, StatusMessage, ViewContainer, ViewHeader } from "@/components/dashboard/dashboard-ui"
import { formatDate, type CourseCertificate } from "@/lib/dashboard-data"
import type { DashboardViewProps } from "@/components/dashboard/dashboard-shell"

export function CertificatesView({ data, onNavigate }: DashboardViewProps) {
  return (
    <ViewContainer>
      <ViewHeader
        kicker="Member achievements"
        title="Certificates"
        description="A record of courses you have completed and certificates issued in your name."
      />

      {data.errors.certificates ? (
        <StatusMessage tone="error">{data.errors.certificates}</StatusMessage>
      ) : data.loading ? (
        <div className="grid gap-6 md:grid-cols-2" aria-label="Loading certificates">
          {[0, 1].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border border-border/60 bg-card shadow-sm" />)}
        </div>
      ) : data.certificates.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Your certificates will appear here"
          description="Once the DDNI team confirms course completion and issues a certificate, you can view and print it from this page."
          action={<Button className="btn-gold min-h-11 px-4" onClick={() => onNavigate("courses")}>Explore my courses</Button>}
        />
      ) : (
        <section aria-label="Earned certificates" className="grid min-w-0 gap-6 md:grid-cols-2">
          {data.certificates.map((certificate) => <CertificateCard key={certificate.id} certificate={certificate} />)}
        </section>
      )}
    </ViewContainer>
  )
}

function CertificateCard({ certificate }: { certificate: CourseCertificate }) {
  return (
    <Card className="group min-w-0 overflow-hidden border border-border/60 bg-card p-0 shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-primary/40">
      <div className="relative overflow-hidden border-b border-primary/15 bg-muted/30 p-6">
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-14 size-44 rounded-full border border-primary/15" />
        <div aria-hidden className="pointer-events-none absolute -end-5 -top-9 size-32 rounded-full border border-primary/15" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Course certificate</p>
            <h3 className="mt-3 break-words font-display text-xl font-semibold leading-snug tracking-tight text-foreground">{certificate.courseTitle}</h3>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/30 bg-card text-primary shadow-sm">
            <Award className="size-6" aria-hidden="true" />
          </span>
        </div>
        <p className="relative mt-5 text-sm text-muted-foreground">Awarded to</p>
        <p className="relative mt-1 break-words text-lg font-semibold text-foreground">{certificate.memberName}</p>
        <p className="relative mt-1 text-sm text-muted-foreground">{certificate.instructor ? `With ${certificate.instructor}` : "The Distinguished Daniel Institute"}</p>
      </div>
      <CardContent className="flex flex-col gap-5 p-6">
        <dl className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Date issued</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{formatDate(certificate.issuedAt)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">Certificate ID</dt>
            <dd className="mt-1 break-all font-mono text-xs font-medium text-foreground">{certificate.certificateCode}</dd>
          </div>
        </dl>
        <Button className="btn-gold min-h-11 w-full px-4" render={<Link href={`/dashboard/certificates/${certificate.id}`} />}>
          <Printer data-icon="inline-start" />
          View and print
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  )
}
