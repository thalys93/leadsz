import type { Lead, LeadStage } from "@/types/lead"
import {
  CHANNEL_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  formatCurrencyBRL,
  formatDatePtBR,
  isOverdue,
} from "@/lib/crm"
import { StageBadge } from "./stage-badge"
import { TemperatureBadge } from "./temperature-badge"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ExternalLink, Pencil, Trash2, GitBranch } from "lucide-react"

type Props = {
  leads: Lead[]
  onSelect: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  onStageChange: (lead: Lead, stage: LeadStage) => void
}

export function LeadTable({ leads, onSelect, onEdit, onDelete, onStageChange }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Canal</th>
            <th className="px-4 py-3 font-medium">Serviço</th>
            <th className="px-4 py-3 font-medium">Valor</th>
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3 font-medium">Próx. ação</th>
            <th className="px-4 py-3 font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const overdue = isOverdue(lead.nextActionAt, lead.stage)
            return (
              <ContextMenu key={lead.id}>
                <ContextMenuTrigger asChild>
                  <tr
                    className="cursor-pointer border-t border-border transition-colors hover:bg-accent/40"
                    onClick={() => onSelect(lead)}
                  >
                    <td className="px-4 py-3 font-medium">
                      <p>{lead.contactName}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.companyName || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{CHANNEL_LABELS[lead.primaryChannel]}</td>
                    <td className="px-4 py-3">{lead.service || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrencyBRL(lead.dealValue)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StageBadge stage={lead.stage} />
                        <TemperatureBadge temperature={lead.temperature} />
                      </div>
                    </td>
                    <td className="px-4 py-3">{lead.nextAction || "—"}</td>
                    <td
                      className={cn(
                        "px-4 py-3",
                        overdue ? "font-semibold text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {formatDatePtBR(lead.nextActionAt)}
                    </td>
                  </tr>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <ContextMenuItem onSelect={() => onSelect(lead)}>
                    <ExternalLink className="size-4" />
                    Abrir detalhe
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onEdit(lead)}>
                    <Pencil className="size-4" />
                    Editar
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onDelete(lead)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      <GitBranch className="size-4" />
                      Alterar status
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                      {STAGE_ORDER.map((stage) => (
                        <ContextMenuItem
                          key={stage}
                          disabled={lead.stage === stage}
                          onSelect={() => onStageChange(lead, stage)}
                        >
                          {STAGE_LABELS[stage]}
                          {lead.stage === stage ? (
                            <span className="ml-auto text-xs text-muted-foreground">atual</span>
                          ) : null}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
          {!leads.length ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-muted-foreground"
              >
                Nenhum lead encontrado.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
