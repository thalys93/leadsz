import {
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react"
import { Link } from "react-router-dom"
import { Check } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import PublicLayout from "@/layouts/public-layout"
import { cn } from "@/lib/utils"

const TEMP_CHIPS = [
  {
    label: "Frio",
    className:
      "bg-slate-200/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200",
  },
  {
    label: "Morno",
    className:
      "bg-amber-100/90 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200",
  },
  {
    label: "Quente",
    className:
      "bg-orange-100/90 text-orange-800 dark:bg-orange-950/90 dark:text-orange-200",
  },
] as const

type AuthShellProps = {
  headline: string
  subheadline: string
  bullets: string[]
  formTitle?: string
  footer?: ReactNode
  children: ReactNode
}

function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Leadz"
      className="inline-flex transition-opacity hover:opacity-80"
    >
      <BrandLogo
        variant="lockup"
        className={cn("h-8 w-auto max-w-[11rem]", className)}
      />
    </Link>
  )
}

function BrandPanel({
  headline,
  subheadline,
  bullets,
}: Pick<AuthShellProps, "headline" | "subheadline" | "bullets">) {
  const panelRef = useRef<HTMLElement>(null)

  function moveSpotlight(event: MouseEvent<HTMLElement>) {
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`)
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`)
  }

  return (
    <aside
      ref={panelRef}
      onMouseMove={moveSpotlight}
      className={cn(
        "relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between",
        "border-r border-border/60 bg-muted/40 px-10 py-12 xl:px-14",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-500"
      )}
      style={
        {
          "--spot-x": "40%",
          "--spot-y": "30%",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, hsl(var(--ember) / 0.16), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 75%, hsl(22 90% 55% / 0.1), transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 motion-reduce:hidden dark:opacity-90"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x) var(--spot-y), hsl(var(--ember) / 0.28), transparent 55%)",
        }}
      />

      <div className="relative z-10 space-y-10">
        <BrandMark className="h-10 max-w-[14rem]" />
        <div className="space-y-4 max-w-md">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground xl:text-4xl">
            {headline}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground xl:text-lg">
            {subheadline}
          </p>
        </div>
        <ul className="space-y-3 max-w-md">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm text-foreground/90">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-ember">
                <Check className="size-3" strokeWidth={2.5} />
              </span>
              <span className="leading-snug">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-12 flex flex-wrap gap-2">
        {TEMP_CHIPS.map((chip) => (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
              chip.className
            )}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </aside>
  )
}

export function AuthShell({
  headline,
  subheadline,
  bullets,
  formTitle,
  footer,
  children,
}: AuthShellProps) {
  return (
    <PublicLayout fullBleed>
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel
          headline={headline}
          subheadline={subheadline}
          bullets={bullets}
        />

        <div
          className={cn(
            "flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-12",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-500 motion-safe:delay-100"
          )}
        >
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-1 lg:hidden">
              <BrandMark />
              {formTitle ? (
                <h1 className="font-display text-xl font-semibold tracking-tight">
                  {formTitle}
                </h1>
              ) : (
                <h1 className="font-display text-xl font-semibold tracking-tight">
                  {headline}
                </h1>
              )}
            </div>

            {formTitle ? (
              <h2 className="hidden font-display text-xl font-semibold tracking-tight lg:block">
                {formTitle}
              </h2>
            ) : null}

            {children}

            {footer ? (
              <div className="text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
