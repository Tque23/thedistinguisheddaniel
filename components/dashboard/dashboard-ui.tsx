import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ViewContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6", className)} {...props} />
}

export function ViewHeader({ kicker, title, description, actions }: { kicker: string; title: ReactNode; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <span aria-hidden className="h-px w-8 bg-[#dcb567]/60" />
          {kicker}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
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
        <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>
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
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/50"
      )}
    >
      <span className={cn("absolute top-1 size-4 rounded-full bg-white transition-transform duration-150 ease-out motion-reduce:transition-none", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  )
}

export function StatusMessage({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("text-sm leading-relaxed", tone === "error" ? "text-destructive" : tone === "success" ? "text-primary" : "text-muted-foreground")}
    >
      {children}
    </p>
  )
}

export const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
