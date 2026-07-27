import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/crm"
import type { LeadStage } from "@/types/lead"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const STAGE_CLASSNAMES: Record<LeadStage, string> = {
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
        STAGE_CLASSNAMES[stage],
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  )
}

export function StageSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: LeadStage
  onChange: (stage: LeadStage) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label="Stage do lead"
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            STAGE_CLASSNAMES[value],
            className
          )}
        >
          {STAGE_LABELS[value]}
          <ChevronDown className="size-3.5 opacity-70" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem] p-1.5">
        {STAGE_ORDER.map((stage) => {
          const selected = stage === value
          return (
            <DropdownMenuItem
              key={stage}
              onSelect={() => {
                if (stage !== value) onChange(stage)
              }}
              className="cursor-pointer p-1 focus:bg-transparent"
            >
              <span
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold",
                  STAGE_CLASSNAMES[stage]
                )}
              >
                <span className="flex-1">{STAGE_LABELS[stage]}</span>
                {selected ? <Check className="size-3.5 shrink-0 opacity-80" /> : null}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
