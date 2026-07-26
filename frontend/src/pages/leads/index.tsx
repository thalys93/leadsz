import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LayoutGrid, Plus, Table2 } from "lucide-react"
import { listLeads, createLead, updateLead, deleteLead } from "@/services/leads"
import type { Lead, LeadListFilters, LeadPayload, LeadStage } from "@/types/lead"
import { LeadFilters } from "./components/lead-filters"
import { LeadTable } from "./components/lead-table"
import { LeadKanban } from "./components/lead-kanban"
import { LeadFormDialog } from "./components/lead-form-dialog"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type ViewMode = "table" | "kanban"

const LEADS_VIEW_STORAGE_KEY = "leads-view"

function readStoredLeadsView(): ViewMode {
  try {
    const stored = localStorage.getItem(LEADS_VIEW_STORAGE_KEY)
    if (stored === "kanban" || stored === "table") return stored
  } catch {}
  return "table"
}

export default function LeadsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [view, setView] = useState<ViewMode>(readStoredLeadsView)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [filters, setFilters] = useState<LeadListFilters>({
    page: 1,
    limit: 50,
    sort: "nextActionAt:ASC",
    search: "",
    stage: "",
    channel: "",
  })

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: filters.search?.trim() || undefined,
    }),
    [filters]
  )

  const leadsQuery = useQuery({
    queryKey: ["leads", queryFilters],
    queryFn: () => listLeads(queryFilters),
  })

  const leads = leadsQuery.data?.items ?? []
  const meta = leadsQuery.data?.meta

  const createMutation = useMutation({
    mutationFn: (payload: LeadPayload) => createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead criado")
      setFormOpen(false)
    },
    onError: () => toast.error("Falha ao criar lead"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LeadPayload> }) =>
      updateLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead atualizado")
      setEditingLead(null)
    },
    onError: () => toast.error("Falha ao atualizar lead"),
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      updateLead(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Status atualizado")
    },
    onError: () => toast.error("Falha ao mover o lead"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead removido")
      setDeletingLead(null)
    },
    onError: () => toast.error("Falha ao remover lead"),
  })

  function openLead(lead: Lead) {
    navigate(`/app/leads/${lead.id}`)
  }

  function selectView(next: ViewMode) {
    setView(next)
    try {
      localStorage.setItem(LEADS_VIEW_STORAGE_KEY, next)
    } catch {}
  }

  function openCreateForm() {
    setEditingLead(null)
    setFormOpen(true)
  }

  function openEditForm(lead: Lead) {
    setFormOpen(false)
    setEditingLead(lead)
  }

  const formIsEdit = !!editingLead
  const dialogOpen = formOpen || !!editingLead

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Leads
          </h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe cada negociação e a próxima ação a tomar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => selectView("table")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                view === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="size-4" />
              Tabela
            </button>
            <button
              type="button"
              onClick={() => selectView("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                view === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
              Kanban
            </button>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="size-4" />
            Novo lead
          </Button>
        </div>
      </div>

      <LeadFilters value={filters} onChange={setFilters} />

      {leadsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando leads...</p>
      ) : leadsQuery.isError ? (
        <p className="text-sm text-destructive">Erro ao carregar leads.</p>
      ) : view === "table" ? (
        <LeadTable
          leads={leads}
          onSelect={openLead}
          onEdit={openEditForm}
          onDelete={setDeletingLead}
          onStageChange={(lead, stage) => stageMutation.mutate({ id: lead.id, stage })}
        />
      ) : (
        <LeadKanban
          leads={leads}
          onSelect={openLead}
          onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
        />
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {meta.totalItems} leads · página {meta.currentPage} de{" "}
            {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage <= 1}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.max(1, (prev.page ?? 1) - 1),
                }))
              }
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage >= meta.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) + 1,
                }))
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      ) : null}

      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditingLead(null)
          }
        }}
        lead={editingLead}
        onSubmit={async (payload) => {
          if (formIsEdit && editingLead) {
            const { channels, ...rest } = payload
            void channels
            await updateMutation.mutateAsync({ id: editingLead.id, payload: rest })
          } else {
            await createMutation.mutateAsync(payload)
          }
        }}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingLead}
        onOpenChange={(open) => {
          if (!open) setDeletingLead(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">
                {deletingLead?.contactName}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingLead) deleteMutation.mutate(deletingLead.id)
              }}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
