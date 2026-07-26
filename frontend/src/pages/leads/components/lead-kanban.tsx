import { useMemo, useState } from "react"
import type { DragEvent } from "react"
import type { Lead, LeadStage } from "@/types/lead"
import {
  CHANNEL_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  formatCurrencyBRL,
  formatDatePtBR,
} from "@/lib/crm"
import { TemperatureBadge } from "./temperature-badge"
import { cn } from "@/lib/utils"

export function LeadKanban({
  leads,
  onSelect,
  onStageChange,
}: {
  leads: Lead[]
  onSelect: (lead: Lead) => void
  onStageChange: (leadId: string, stage: LeadStage) => void
}) {
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null)

  const leadsByStage = useMemo(() => {
    const grouped = Object.fromEntries(
      STAGE_ORDER.map((stage) => [stage, [] as Lead[]])
    ) as Record<LeadStage, Lead[]>

    for (const lead of leads) {
      grouped[lead.stage].push(lead)
    }

    return grouped
  }, [leads])

  function finishDrag() {
    setDragOverStage(null)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, stage: LeadStage) {
    event.preventDefault()
    const leadId = event.dataTransfer.getData("text/lead-id")
    finishDrag()
    if (leadId) onStageChange(leadId, stage)
  }

  if (!leads.length) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum lead para exibir no kanban.
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
      {STAGE_ORDER.map((stage) => {
        const stageLeads = leadsByStage[stage]
        const isEmpty = stageLeads.length === 0
        const isCollapsed = isEmpty && dragOverStage !== stage
        const isPerdido = stage === "PERDIDO"
        const isDropTarget = dragOverStage === stage

        return (
          <div
            key={stage}
            className={cn(
              "flex min-h-[280px] shrink-0 flex-col rounded-xl border transition-all duration-200",
              isCollapsed
                ? "w-11 items-center gap-3 px-1.5 py-3"
                : "w-72 max-w-sm gap-2.5 p-3 sm:min-w-[220px] sm:flex-1 sm:basis-0",
              isPerdido
                ? "border-dashed border-destructive/40 bg-destructive/5"
                : "border-border bg-card/50",
              isCollapsed && "opacity-70 hover:opacity-100",
              isDropTarget && "opacity-100 ring-2 ring-ring"
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOverStage(stage)
            }}
            onDragLeave={() =>
              setDragOverStage((prev) => (prev === stage ? null : prev))
            }
            onDrop={(event) => handleDrop(event, stage)}
          >
            {isCollapsed ? (
              <>
                <span
                  className={cn(
                    "inline-flex min-w-6 items-center justify-center rounded-md px-1 py-0.5 text-[11px] font-medium tabular-nums",
                    isPerdido
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  0
                </span>
                <h3 className="flex-1 font-display text-xs font-semibold tracking-wide text-muted-foreground [writing-mode:vertical-rl]">
                  {STAGE_LABELS[stage]}
                </h3>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <h3 className="truncate font-display text-sm font-semibold tracking-tight">
                    {STAGE_LABELS[stage]}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                      isPerdido
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/lead-id", lead.id)
                      }}
                      onDragEnd={finishDrag}
                      onClick={() => onSelect(lead)}
                      className="cursor-pointer space-y-1.5 rounded-lg border border-border bg-background p-3 text-sm shadow-sm transition hover:border-ring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">
                          {lead.contactName}
                        </p>
                        <TemperatureBadge temperature={lead.temperature} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {lead.companyName ||
                          CHANNEL_LABELS[lead.primaryChannel]}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {formatCurrencyBRL(lead.dealValue)}
                        </span>
                        <span className="truncate">
                          {formatDatePtBR(lead.nextActionAt)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isEmpty ? (
                    <div
                      className={cn(
                        "flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground transition-colors",
                        isDropTarget
                          ? "border-ring bg-accent/40 text-foreground"
                          : "border-border/60"
                      )}
                    >
                      Solte aqui
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
