import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ViewHeader({ kicker, title, description, actions }: { kicker: string; title: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f3d27a]">
          <span aria-hidden className="h-px w-8 bg-[#dcb567]/60" />
          {kicker}
        </p>
        <h2 className="mt-3 font-display text-2xl leading-tight text-foreground sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-[#dcb567]/10 text-[#f3d27a]">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}

export function Field({ id, label, error, hint, children, className }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-[#ef7182]">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        checked ? "bg-[#970024]" : "bg-muted"
      )}
    >
      <span className={cn("absolute top-1 size-4 rounded-full bg-white transition-transform", checked ? "left-6" : "left-1")} />
    </button>
  )
}

export function StatusMessage({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("text-sm", tone === "error" ? "text-[#ef7182]" : tone === "success" ? "text-[#f3d27a]" : "text-muted-foreground")}
    >
      {children}
    </p>
  )
}

export const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
