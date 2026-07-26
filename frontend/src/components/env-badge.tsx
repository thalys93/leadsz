import { cn } from "@/lib/utils"
import { getLocalEnvBadge, type LocalEnvBadge } from "@/lib/app-env"

const badgeClassNames: Record<LocalEnvBadge, string> = {
  dev: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  prod: "bg-[hsl(var(--ember)/0.15)] text-[hsl(var(--ember))] dark:bg-[hsl(var(--ember)/0.25)]",
}

const badgeLabels: Record<LocalEnvBadge, string> = {
  dev: "DEV",
  prod: "PROD",
}

export function EnvBadge({ className }: { className?: string }) {
  const badge = getLocalEnvBadge()
  if (!badge) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
        badgeClassNames[badge],
        className
      )}
    >
      {badgeLabels[badge]}
    </span>
  )
}
