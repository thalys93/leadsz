import { resolveServiceIcon } from "@/lib/service-icons"
import { cn } from "@/lib/utils"

type ServiceLabelProps = {
  name: string | null | undefined
  icon?: string | null
  size?: "sm" | "md"
  className?: string
  iconClassName?: string
}

const SIZE = {
  sm: {
    wrap: "gap-2",
    iconWrap: "size-7 rounded-md",
    icon: "size-3.5",
    text: "text-sm",
  },
  md: {
    wrap: "gap-2.5",
    iconWrap: "size-8 rounded-md",
    icon: "size-4",
    text: "text-sm",
  },
} as const

export function ServiceLabel({
  name,
  icon,
  size = "sm",
  className,
  iconClassName,
}: ServiceLabelProps) {
  const label = name?.trim() || "—"
  const Icon = resolveServiceIcon(icon)
  const tokens = SIZE[size]

  return (
    <span className={cn("inline-flex min-w-0 items-center", tokens.wrap, className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary/10 text-primary",
          tokens.iconWrap,
          iconClassName
        )}
      >
        <Icon className={tokens.icon} />
      </span>
      <span className={cn("min-w-0 truncate font-medium", tokens.text)}>
        {label}
      </span>
    </span>
  )
}
