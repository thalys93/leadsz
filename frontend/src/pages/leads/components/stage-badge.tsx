import { cn } from "@/lib/utils"
import { STAGE_LABELS } from "@/lib/crm"
import type { LeadStage } from "@/types/lead"

const stageClassNames: Record<LeadStage, string> = {
  LEAD: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  CONTATADO: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  PROPOSTA: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  REUNIAO: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  FECHADO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ENTREGA: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  PAGO: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  PERDIDO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
}

export function StageBadge({
  stage,
  className,
}: {
  stage: LeadStage
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        stageClassNames[stage],
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  )
}
