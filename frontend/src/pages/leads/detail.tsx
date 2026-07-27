import { useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getLead, deleteLead, updateLead } from "@/services/leads"
import { listServices } from "@/services/catalog-services"
import {
  CHANNEL_LABELS,
  formatDatePtBR,
} from "@/lib/crm"
import type { LeadPayload, LeadStage } from "@/types/lead"
import { StageSelect } from "./components/stage-badge"
import { TemperatureBadge } from "./components/temperature-badge"
import { LeadFormDialog } from "./components/lead-form-dialog"
import { LeadCheckpoints } from "./components/lead-checkpoints"
import { LeadTimeline } from "./components/lead-timeline"
import { LeadChannels } from "./components/lead-channels"
import { LeadTemplatePanel } from "./components/lead-template-panel"
import { LeadContactPanel } from "./components/lead-contact-panel"
import { ServiceLabel } from "@/components/service-label"
import { DealValueDisplay } from "./components/deal-value-display"

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

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

  const servicesQuery = useQuery({
    queryKey: ["services", "all"],
    queryFn: () => listServices("all"),
  })

  const lead = leadQuery.data
  const catalogService = lead?.serviceId
    ? servicesQuery.data?.find((service) => service.id === lead.serviceId)
    : null

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<LeadPayload>) => updateLead(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", id] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: ["lead-suggestions"] })
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

  const notes = lead.notes?.trim() || null

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

      <div className="flex flex-wrap items-start justify-between gap-6 rounded-xl border border-border bg-card/70 p-5">
        <div className="min-w-0 flex-1 space-y-5">
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
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              <DealValueDisplay
                dealValue={lead.dealValue}
                anchors={catalogService}
                className="text-lg font-semibold"
              />
            </p>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Empresa">
              {lead.companyName || "—"}
            </DetailField>
            <DetailField label="Serviço de interesse">
              <ServiceLabel
                name={lead.service}
                icon={catalogService?.icon}
                size="md"
              />
            </DetailField>
            <DetailField label="Canal principal">
              {CHANNEL_LABELS[lead.primaryChannel]}
            </DetailField>
            <DetailField label="Próxima ação">
              {lead.nextAction || "—"}
            </DetailField>
            <DetailField label="Data da próxima ação">
              {lead.nextActionAt ? formatDatePtBR(lead.nextActionAt) : "—"}
            </DetailField>
            {lead.owner?.name ? (
              <DetailField label="Responsável">{lead.owner.name}</DetailField>
            ) : null}
          </dl>

          <div className="border-t border-border/70 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Notas
            </p>
            {notes ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {notes}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma nota registrada. Edite o lead para adicionar contexto.
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <StageSelect
            value={lead.stage}
            disabled={stageMutation.isPending}
            onChange={(stage) => stageMutation.mutate(stage)}
          />
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
