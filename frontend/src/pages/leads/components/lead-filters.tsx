import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHANNEL_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/crm"
import type { ChannelType, LeadListFilters, LeadStage } from "@/types/lead"

type Props = {
  value: LeadListFilters
  onChange: (next: LeadListFilters) => void
}

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]

export function LeadFilters({ value, onChange }: Props) {
  function patch(partial: Partial<LeadListFilters>) {
    onChange({ ...value, ...partial, page: 1 })
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/70 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={!value.stage ? "default" : "outline"}
          onClick={() => patch({ stage: "" })}
        >
          Todos
        </Button>
        {STAGE_ORDER.map((stage: LeadStage) => (
          <Button
            key={stage}
            type="button"
            size="sm"
            variant={value.stage === stage ? "default" : "outline"}
            onClick={() => patch({ stage })}
          >
            {STAGE_LABELS[stage]}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 lg:col-span-2">
          <Label htmlFor="search">Busca</Label>
          <Input
            id="search"
            placeholder="Nome do lead ou empresa"
            value={value.search ?? ""}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="channel">Canal</Label>
          <select
            id="channel"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            )}
            value={value.channel ?? ""}
            onChange={(e) => patch({ channel: e.target.value as ChannelType | "" })}
          >
            <option value="">Todos</option>
            {CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sort">Ordenar</Label>
          <select
            id="sort"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={value.sort ?? "nextActionAt:ASC"}
            onChange={(e) => patch({ sort: e.target.value })}
          >
            <option value="nextActionAt:ASC">Próxima ação</option>
            <option value="score:DESC">Score ↓</option>
            <option value="dealValue:DESC">Valor ↓</option>
          </select>
        </div>
      </div>
    </div>
  )
}
