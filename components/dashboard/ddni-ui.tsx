"use client"

import type { ComponentProps, ComponentType, ReactNode } from "react"
import { ChevronDown, House, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type IconType = ComponentType<{ className?: string }>

export function PageHeading({ title, subtitle, crumb, onHome, className }: { title: string; subtitle: string; crumb?: string; onHome: () => void; className?: string }) {
  return (
    <header className={cn("flex flex-col", className)}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <button type="button" onClick={onHome} className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-[#9a6b1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a]">
          <House className="size-3.5" aria-hidden />
          Home
        </button>
        <span aria-hidden>/</span>
        <span aria-current="page">{crumb ?? title}</span>
      </nav>
      <h2 className="ddni-serif mt-3 text-4xl font-bold leading-tight text-foreground sm:text-5xl">{title}</h2>
      <p className="ddni-serif mt-1 text-base text-foreground/85 sm:text-lg">{subtitle}</p>
    </header>
  )
}

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
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
}

export function DdniButton({ variant = "gold", size = "md", href, target, rel, download, className, children, type = "button", ...rest }: DdniButtonProps) {
  const classes = cn(
    "ddni-btn inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0",
    variant === "gold" ? "ddni-btn-gold" : "ddni-btn-outline",
    buttonSizes[size],
    className,
  )
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
  gold: "bg-[#f5ecd6] text-[#8a6420]",
  blue: "bg-[#e6eefb] text-[#2f568f]",
  green: "bg-[#e3f3e8] text-[#1f7a43]",
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
    <div className={cn("relative flex items-center gap-3 rounded-lg border border-input bg-card px-3 py-2 shadow-sm transition-colors focus-within:border-[#b8893a] focus-within:ring-2 focus-within:ring-[#c9a14f]/30", className)}>
      {Icon && <Icon className="size-5 shrink-0 text-[#a9792a]" aria-hidden />}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-xs font-semibold leading-none text-foreground">{label}</label>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm text-muted-foreground outline-none">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-foreground/70" aria-hidden />
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder, label, className }: { value: string; onChange: (value: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground/70" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-lg border border-input bg-card pr-3 pl-10 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-[#b8893a] focus-visible:ring-2 focus-visible:ring-[#c9a14f]/30"
      />
    </div>
  )
}

export type TabItem<T extends string> = { id: T; label: string; icon?: IconType; count?: number }

export function SegmentedTabs<T extends string>({ items, value, onChange, label }: { items: TabItem<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="ddni-card flex gap-1 overflow-x-auto p-1.5">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2.5 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a] sm:text-base",
              active ? "ddni-btn-gold shadow-sm" : "text-foreground hover:bg-[#f7efdc]",
            )}
          >
            {item.icon && <item.icon className="size-5 shrink-0" aria-hidden />}
            <span className="ddni-serif">{item.label}{item.count !== undefined && ` (${item.count})`}</span>
          </button>
        )
      })}
    </div>
  )
}

export function UnderlineTabs<T extends string>({ items, value, onChange, label, trailing }: { items: TabItem<T>[]; value: T; onChange: (value: T) => void; label: string; trailing?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 border-b border-border">
      <div role="tablist" aria-label={label} className="-mb-px flex max-w-full gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c1d3a] sm:px-4",
                active ? "border-[#b8893a] font-semibold text-[#8a6420]" : "border-transparent text-foreground/80 hover:text-foreground",
              )}
            >
              {item.icon && <item.icon className={cn("size-5 shrink-0", active ? "text-[#a9792a]" : "text-foreground/70")} aria-hidden />}
              {item.label}{item.count !== undefined && ` (${item.count})`}
            </button>
          )
        })}
      </div>
      {trailing && <div className="pb-3 text-xs text-muted-foreground">{trailing}</div>}
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
      <span className="text-[9px] font-semibold tracking-[0.2em] text-[#e4c276]/80 uppercase">{code ? `Course ${code}` : "DDNI"}</span>
    </div>
  )
}

export function Panel({ title, icon: Icon, action, children, className }: { title: string; icon?: IconType; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("ddni-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="ddni-serif flex min-w-0 items-center gap-2.5 text-xl font-bold text-foreground">
          {Icon && <Icon className="size-6 shrink-0 text-[#a9792a]" aria-hidden />}
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
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1 rounded-sm text-sm font-medium text-[#0c1d3a] transition-colors hover:text-[#9a6b1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c1d3a]", className)}>
      {children}
    </button>
  )
}

export function LoadingBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[#ece7d9]", className)} aria-hidden />
}

export function EmptyPanel({ icon: Icon, title, description, action }: { icon: IconType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#d9cfb6] bg-white/60 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[#f5ecd6] text-[#a9792a]"><Icon className="size-6" /></span>
      <p className="ddni-serif text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}
