import { cn } from "@/lib/utils"
import { TEMPERATURE_CLASSNAMES, TEMPERATURE_LABELS } from "@/lib/crm"
import type { LeadTemperature } from "@/types/lead"

export function TemperatureBadge({
  temperature,
  className,
}: {
  temperature: LeadTemperature
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        TEMPERATURE_CLASSNAMES[temperature],
        className
      )}
    >
      {TEMPERATURE_LABELS[temperature]}
    </span>
  )
}
