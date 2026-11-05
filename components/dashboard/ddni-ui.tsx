"use client"

import type { ComponentProps, ComponentType, ReactNode } from "react"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type IconType = ComponentType<{ className?: string }>

type DdniButtonProps = Omit<ComponentProps<"button">, "type"> & {
  variant?: "gold" | "outline"
  size?: "sm" | "md" | "lg"
  href?: string
  target?: string
  rel?: string
  download?: boolean | string
  type?: "button" | "submit"
}

const buttonSizes = {
  sm: "min-h-11 gap-2 px-4 text-sm",
  md: "min-h-11 gap-2 px-4 text-sm",
  lg: "min-h-11 gap-2 px-4 text-sm",
}

export function DdniButton({ variant = "gold", size = "md", href, target, rel, download, className, children, type = "button", ...rest }: DdniButtonProps) {
  const classes = buttonVariants({
    variant: variant === "gold" ? "default" : "outline",
    className: cn(buttonSizes[size], variant === "gold" && "btn-gold", className),
  })
  if (href && !rest.disabled) {
    return (
      <a href={href} target={target} rel={rel} download={download} className={classes} aria-label={rest["aria-label"]} title={rest.title}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

const pillTones = {
  gold: "bg-[#f3ead4] text-[#634710]",
  blue: "bg-[#e7eef6] text-[#274969]",
  green: "bg-[#e7f2eb] text-[#23613b]",
  navy: "bg-[#0c1d3a] text-white",
  gray: "bg-[#eeebe3] text-[#4c566a]",
}

export function Pill({ tone = "gray", children, className }: { tone?: keyof typeof pillTones; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", pillTones[tone], className)}>{children}</span>
}

export function SelectField({ id, label, value, onChange, options, icon: Icon, className }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: IconType
  className?: string
}) {
  return (
    <div className={cn("relative flex min-h-14 items-center gap-3 rounded-xl border border-border/80 bg-card px-3 py-2 transition-[border-color,box-shadow] duration-150 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15", className)}>
      {Icon && <Icon className="size-5 shrink-0 text-primary" aria-hidden />}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs font-semibold leading-none text-foreground">{label}</label>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block min-h-6 w-full cursor-pointer appearance-none truncate bg-transparent pe-6 text-sm text-foreground outline-none">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <ChevronDown className="pointer-events-none absolute end-3 size-4 text-muted-foreground" aria-hidden />
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder, label, className }: { value: string; onChange: (value: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-xl border border-input bg-card pe-3 ps-10 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm"
      />
    </div>
  )
}

export type TabItem<T extends string> = { id: T; label: string; icon?: IconType; count?: number }

export const underlineTabClassName =
  "flex h-12 min-h-11 items-center gap-2 border-x-0 border-t-0 border-b-2 px-3 py-0 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:px-4"

export function SegmentedTabs<T extends string>({ items, value, onChange, label }: { items: TabItem<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex max-w-full gap-2 overflow-x-auto rounded-xl border border-border/60 bg-card p-1.5 shadow-sm">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={cn(
              buttonVariants({
                variant: active ? "default" : "outline",
                className: cn("h-auto min-h-11 flex-1 gap-2.5 px-4", active && "btn-gold"),
              }),
              "rounded-lg text-sm font-medium transition-colors duration-150",
            )}
          >
            {item.icon && <item.icon className="size-4 shrink-0" aria-hidden />}
            <span>{item.label}{item.count !== undefined && ` (${item.count})`}</span>
          </button>
        )
      })}
    </div>
  )
}

export function UnderlineTabs<T extends string>({ items, value, onChange, label }: { items: TabItem<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div className="w-full min-w-0 border-b border-border/60">
      <div role="group" aria-label={label} className="-mb-px flex w-fit max-w-full gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={cn(
                underlineTabClassName,
                active ? "border-primary font-semibold text-accent-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.icon && <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden />}
              {item.label}{item.count !== undefined && ` (${item.count})`}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CourseCover({ title, code, image, className }: { title: string; code?: string; image?: string; className?: string }) {
  if (image) {
    return <img src={image} alt={`${title} course cover`} className={cn("aspect-[4/5] w-full rounded-md object-cover shadow-md", className)} />
  }
  return (
    <div role="img" aria-label={`${title} course cover`} className={cn("flex aspect-[4/5] w-full flex-col items-center justify-between rounded-md bg-[linear-gradient(160deg,#10294d,#071428)] p-3 text-center shadow-md ring-1 ring-[#c9a14f]/30", className)}>
      <span />
      <span className="ddni-serif line-clamp-4 text-sm font-semibold uppercase leading-tight tracking-wide text-[#e4c276]">{title}</span>
      <span className="text-xs font-semibold tracking-[0.2em] text-[#e4c276]/80 uppercase">{code ? `Course ${code}` : "DDNI"}</span>
    </div>
  )
}

export function Panel({ title, icon: Icon, action, children, className }: { title: string; icon?: IconType; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("ddni-card min-w-0 p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2.5 text-base font-semibold leading-snug tracking-tight text-foreground">
          {Icon && <Icon className="size-5 shrink-0 text-primary" aria-hidden />}
          <span className="truncate">{title}</span>
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function TextLink({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex min-h-11 items-center gap-1 rounded-sm px-1 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]", className)}>
      {children}
    </button>
  )
}

export function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn("motion-safe:animate-pulse rounded-2xl border border-border/60 bg-muted/70", className)} aria-hidden />
}

export function EmptyPanel({ icon: Icon, title, description, action }: { icon: IconType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" /></span>
      <div className="max-w-md space-y-1">
        <p className="ddni-serif text-lg font-semibold tracking-tight text-foreground">{title}</p>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
