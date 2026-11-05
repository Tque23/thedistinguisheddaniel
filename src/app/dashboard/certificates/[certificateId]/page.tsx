import { notFound, redirect } from "next/navigation"
import { Award, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { CertificatePrintButton } from "@/components/dashboard/certificate-print-button"

export const dynamic = "force-dynamic"

export default async function CertificatePage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(certificateId)) notFound()
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect("/auth")

  const { data: certificate, error } = await supabase
    .from("course_certificates")
    .select("id, member_name, course_title, instructor, certificate_code, issued_at")
    .eq("id", certificateId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (error) throw new Error("Unable to load this certificate.")
  if (!certificate) notFound()

  const issuedDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(certificate.issued_at))

  return (
    <div className="tdd-dashboard min-h-dvh">
      <main className="ddni-light ddni-certificate-print-page min-h-dvh bg-background p-4 text-foreground sm:p-8">
        <div className="ddni-certificate-print-chrome mx-auto mb-5 flex w-full max-w-5xl items-center justify-between gap-4">
          <Link href="/dashboard?view=certificates" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />Back to certificates
          </Link>
          <CertificatePrintButton />
        </div>
        <article className="ddni-certificate-document mx-auto grid w-full max-w-5xl place-items-center border border-primary/35 bg-card p-3 shadow-sm sm:p-5">
          <div className="grid min-h-full w-full place-items-center border border-primary/25 p-6 text-center sm:p-12">
            <div className="max-w-3xl">
              <div className="mx-auto grid size-16 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary">
                <Award className="size-8" aria-hidden="true" />
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-primary">The Distinguished Daniel Network &amp; Institute</p>
              <h1 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">Certificate of Completion</h1>
              <p className="mt-7 text-sm leading-relaxed text-muted-foreground sm:text-base">This certificate is awarded to</p>
              <p className="mt-3 break-words font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{certificate.member_name}</p>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">in recognition of completing</p>
              <p className="mt-2 break-words text-xl font-semibold leading-snug text-foreground sm:text-2xl">{certificate.course_title}</p>
              {certificate.instructor && <p className="mt-2 text-sm text-muted-foreground">Facilitated by {certificate.instructor}</p>}
              <div className="mx-auto mt-8 h-px w-32 bg-primary/40" />
              <p className="mt-5 text-sm font-medium text-foreground">Issued {issuedDate}</p>
              <p className="mt-2 font-mono text-xs tracking-wide text-muted-foreground">{certificate.certificate_code}</p>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
