import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getLead, deleteLead, updateLead } from "@/services/leads"
import { STAGE_LABELS, STAGE_ORDER, formatCurrencyBRL, formatDatePtBR } from "@/lib/crm"
import type { LeadPayload, LeadStage } from "@/types/lead"
import { StageBadge } from "./components/stage-badge"
import { TemperatureBadge } from "./components/temperature-badge"
import { LeadFormDialog } from "./components/lead-form-dialog"
import { LeadCheckpoints } from "./components/lead-checkpoints"
import { LeadTimeline } from "./components/lead-timeline"
import { LeadChannels } from "./components/lead-channels"
import { LeadTemplatePanel } from "./components/lead-template-panel"
import { LeadContactPanel } from "./components/lead-contact-panel"

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const leadQuery = useQuery({
    queryKey: ["leads", id],
    queryFn: () => getLead(id!),
    enabled: !!id,
  })

  const lead = leadQuery.data

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<LeadPayload>) => updateLead(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", id] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead atualizado")
    },
    onError: () => toast.error("Falha ao atualizar lead"),
  })

  const stageMutation = useMutation({
    mutationFn: (stage: LeadStage) => updateLead(id!, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", id] })
      queryClient.invalidateQueries({ queryKey: ["leads", id, "timeline"] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: () => toast.error("Falha ao mudar o stage"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead removido")
      navigate("/app/leads")
    },
    onError: () => toast.error("Falha ao remover lead"),
  })

  if (leadQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando lead...</p>
  }

  if (leadQuery.isError || !lead) {
    return <p className="text-sm text-destructive">Não foi possível carregar o lead.</p>
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="hidden md:inline-flex"
        onClick={() => navigate("/app/leads")}
      >
        <ArrowLeft className="size-4" />
        Voltar para leads
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card/70 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {lead.contactName}
            </h1>
            <TemperatureBadge temperature={lead.temperature} />
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              Score {lead.score}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.companyName || "—"} {lead.service ? `· ${lead.service}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            Próxima ação: {lead.nextAction || "—"}{" "}
            {lead.nextActionAt ? `(${formatDatePtBR(lead.nextActionAt)})` : ""}
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrencyBRL(lead.dealValue)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={lead.stage}
            disabled={stageMutation.isPending}
            onChange={(e) => stageMutation.mutate(e.target.value as LeadStage)}
          >
            {STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <StageBadge stage={lead.stage} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm("Remover este lead?")) deleteMutation.mutate()
              }}
            >
              <Trash2 className="size-3.5" />
              Remover
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="rounded-xl border border-border p-4">
          <LeadTimeline leadId={lead.id} />
        </TabsContent>
        <TabsContent value="checkpoints" className="rounded-xl border border-border p-4">
          <LeadCheckpoints leadId={lead.id} checkpoints={lead.checkpoints ?? []} />
        </TabsContent>
        <TabsContent value="channels" className="rounded-xl border border-border p-4">
          <LeadChannels leadId={lead.id} channels={lead.channels ?? []} />
        </TabsContent>
        <TabsContent value="templates" className="rounded-xl border border-border p-4">
          <LeadTemplatePanel lead={lead} />
        </TabsContent>
        <TabsContent value="contact" className="rounded-xl border border-border p-4">
          <LeadContactPanel lead={lead} />
        </TabsContent>
      </Tabs>

      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        submitting={updateMutation.isPending}
        onSubmit={async (payload) => {
          const { channels, ...rest } = payload
          void channels
          await updateMutation.mutateAsync(rest)
          setEditOpen(false)
        }}
      />
    </div>
  )
}
