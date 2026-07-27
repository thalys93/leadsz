import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LayoutGrid, Pencil, Plus, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrencyBRL } from "@/lib/crm"
import {
  resolveServiceIcon,
  SERVICE_ICON_OPTIONS,
} from "@/lib/service-icons"
import { ServiceLabel } from "@/components/service-label"
import {
  createService,
  deactivateService,
  listServices,
  updateService,
} from "@/services/catalog-services"
import type {
  CatalogService,
  CatalogServiceFilter,
  CatalogServicePayload,
} from "@/types/service"
import { parseCatalogPrice } from "@/types/service"
import { cn } from "@/lib/utils"

const selectClassName =
  "flex h-10 rounded-md border border-input bg-background px-3 text-sm"

const TYPICAL_DEADLINE_OPTIONS = [
  "1–2 dias úteis",
  "3–5 dias úteis",
  "1 semana",
  "2 semanas",
  "3–4 semanas",
  "1 mês",
  "A combinar",
] as const

const SERVICES_VIEW_STORAGE_KEY = "services-view"

type ViewMode = "table" | "grid"

type FormState = {
  name: string
  translateKey: string
  icon: string
  minPrice: string
  idealPrice: string
  maxPrice: string
  scopeIn: string
  scopeOut: string
  typicalDeadline: string
  active: boolean
}

const emptyForm = (): FormState => ({
  name: "",
  translateKey: "",
  icon: "Briefcase",
  minPrice: "",
  idealPrice: "",
  maxPrice: "",
  scopeIn: "",
  scopeOut: "",
  typicalDeadline: "",
  active: true,
})

function readStoredView(): ViewMode {
  try {
    const stored = localStorage.getItem(SERVICES_VIEW_STORAGE_KEY)
    if (stored === "grid" || stored === "table") return stored
  } catch {}
  return "table"
}

function toForm(service: CatalogService): FormState {
  return {
    name: service.name,
    translateKey: service.translateKey ?? "",
    icon: service.icon || "Briefcase",
    minPrice: service.minPrice ?? "",
    idealPrice: service.idealPrice ?? "",
    maxPrice: service.maxPrice ?? "",
    scopeIn: service.scopeIn ?? "",
    scopeOut: service.scopeOut ?? "",
    typicalDeadline: service.typicalDeadline ?? "",
    active: service.active,
  }
}

function toPayload(form: FormState): CatalogServicePayload {
  const num = (v: string) => (v.trim() === "" ? null : Number(v))
  return {
    name: form.name.trim(),
    translateKey: form.translateKey.trim() || null,
    icon: form.icon.trim() || null,
    minPrice: num(form.minPrice),
    idealPrice: num(form.idealPrice),
    maxPrice: num(form.maxPrice),
    scopeIn: form.scopeIn.trim() || null,
    scopeOut: form.scopeOut.trim() || null,
    typicalDeadline: form.typicalDeadline.trim() || null,
    active: form.active,
  }
}

function priceLabel(value: string | null) {
  return formatCurrencyBRL(parseCatalogPrice(value))
}

function ServiceActions({
  service,
  onEdit,
  onDeactivate,
  onReactivate,
  deactivating,
  reactivating,
}: {
  service: CatalogService
  onEdit: () => void
  onDeactivate: () => void
  onReactivate: () => void
  deactivating: boolean
  reactivating: boolean
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="size-3.5" />
        Editar
      </Button>
      {service.active ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={deactivating}
          onClick={onDeactivate}
        >
          Desativar
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={reactivating}
          onClick={onReactivate}
        >
          Reativar
        </Button>
      )}
    </div>
  )
}

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<CatalogServiceFilter>("true")
  const [view, setView] = useState<ViewMode>(readStoredView)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogService | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [baseline, setBaseline] = useState<FormState | null>(null)

  const servicesQuery = useQuery({
    queryKey: ["services", filter],
    queryFn: () => listServices(filter),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form)
      if (!payload.name) throw new Error("name")
      if (editing) return updateService(editing.id, payload)
      return createService(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast.success(editing ? "Serviço atualizado" : "Serviço criado")
      setDialogOpen(false)
    },
    onError: () => toast.error("Falha ao salvar serviço"),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast.success("Serviço desativado")
    },
    onError: () => toast.error("Falha ao desativar serviço"),
  })

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => updateService(id, { active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast.success("Serviço reativado")
    },
    onError: () => toast.error("Falha ao reativar serviço"),
  })

  useEffect(() => {
    if (!dialogOpen) {
      setEditing(null)
      setForm(emptyForm())
      setBaseline(null)
      setDiscardOpen(false)
    }
  }, [dialogOpen])

  function selectView(next: ViewMode) {
    setView(next)
    try {
      localStorage.setItem(SERVICES_VIEW_STORAGE_KEY, next)
    } catch {}
  }

  function openCreate() {
    const initial = emptyForm()
    setEditing(null)
    setForm(initial)
    setBaseline(initial)
    setDiscardOpen(false)
    setDialogOpen(true)
  }

  function openEdit(service: CatalogService) {
    const initial = toForm(service)
    setEditing(service)
    setForm(initial)
    setBaseline(initial)
    setDiscardOpen(false)
    setDialogOpen(true)
  }

  const isDirty =
    baseline != null && JSON.stringify(form) !== JSON.stringify(baseline)

  function requestClose() {
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setDiscardOpen(false)
    setDialogOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setDialogOpen(true)
      return
    }
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setDiscardOpen(false)
    setDialogOpen(false)
  }

  function confirmDiscard() {
    setDiscardOpen(false)
    setDialogOpen(false)
  }

  function blockDismissIfDirty(event: Event) {
    if (!isDirty) return
    event.preventDefault()
    setDiscardOpen(true)
  }

  function confirmDeactivate(service: CatalogService) {
    if (
      window.confirm(
        `Desativar «${service.name}»? Leads vinculados mantêm o histórico.`
      )
    ) {
      deactivateMutation.mutate(service.id)
    }
  }

  const services = servicesQuery.data ?? []
  const FormIcon = resolveServiceIcon(form.icon)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Serviços
          </h1>
          <p className="mt-1 text-muted-foreground">
            Catálogo com âncoras de preço (min / ideal / max) e escopo fechado.
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
              onClick={() => selectView("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
              Grid
            </button>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            Novo serviço
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card/70 p-4">
        <select
          className={selectClassName}
          value={filter}
          onChange={(e) => setFilter(e.target.value as CatalogServiceFilter)}
        >
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {servicesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando serviços...</p>
      ) : !services.length ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum serviço neste filtro.
          </p>
          <Button type="button" className="mt-4" size="sm" onClick={openCreate}>
            Criar primeiro serviço
          </Button>
        </div>
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/70">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium">Ideal</th>
                <th className="px-4 py-3 font-medium">Max</th>
                <th className="px-4 py-3 font-medium">Prazo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      <ServiceLabel
                        name={service.name}
                        icon={service.icon}
                        size="md"
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {priceLabel(service.minPrice)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {priceLabel(service.idealPrice)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {priceLabel(service.maxPrice)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {service.typicalDeadline || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          service.active
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {service.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ServiceActions
                        service={service}
                        onEdit={() => openEdit(service)}
                        onDeactivate={() => confirmDeactivate(service)}
                        onReactivate={() =>
                          reactivateMutation.mutate(service.id)
                        }
                        deactivating={deactivateMutation.isPending}
                        reactivating={reactivateMutation.isPending}
                      />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = resolveServiceIcon(service.icon)
            return (
              <div
                key={service.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-semibold tracking-tight">
                        {service.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {service.typicalDeadline || "Prazo a combinar"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                      service.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/40 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Min
                    </p>
                    <p className="mt-0.5 text-xs font-medium tabular-nums">
                      {priceLabel(service.minPrice)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Ideal
                    </p>
                    <p className="mt-0.5 text-xs font-medium tabular-nums">
                      {priceLabel(service.idealPrice)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Max
                    </p>
                    <p className="mt-0.5 text-xs font-medium tabular-nums">
                      {priceLabel(service.maxPrice)}
                    </p>
                  </div>
                </div>

                {service.scopeIn ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {service.scopeIn}
                  </p>
                ) : null}

                <div className="mt-auto pt-1">
                  <ServiceActions
                    service={service}
                    onEdit={() => openEdit(service)}
                    onDeactivate={() => confirmDeactivate(service)}
                    onReactivate={() => reactivateMutation.mutate(service.id)}
                    deactivating={deactivateMutation.isPending}
                    reactivating={reactivateMutation.isPending}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0"
          onCloseClick={requestClose}
          onPointerDownOutside={blockDismissIfDirty}
          onInteractOutside={blockDismissIfDirty}
          onEscapeKeyDown={(event) => {
            if (discardOpen) {
              event.preventDefault()
              setDiscardOpen(false)
              return
            }
            blockDismissIfDirty(event)
          }}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 pr-12">
              <DialogTitle>
                {editing ? "Editar serviço" : "Novo serviço"}
              </DialogTitle>
              <DialogDescription>
                Defina nome, ícone, âncoras de preço e escopo para precificar sem
                improviso.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="svc-name">Nome *</Label>
                <Input
                  id="svc-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex.: Landing page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-translate-key">Translate key</Label>
                <Input
                  id="svc-translate-key"
                  value={form.translateKey}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, translateKey: e.target.value }))
                  }
                  placeholder="Ex.: services.landingPage"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Chave opcional para traduzir o serviço em outros lugares (i18n).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FormIcon className="size-5" />
                  </span>
                  <div className="grid flex-1 grid-cols-6 gap-1 sm:grid-cols-8">
                    {SERVICE_ICON_OPTIONS.map(({ name, icon: OptionIcon }) => (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-md border transition-colors",
                          form.icon === name
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setForm((f) => ({ ...f, icon: name }))}
                      >
                        <OptionIcon className="size-4" />
                        <span className="sr-only">{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="svc-min">Min (R$)</Label>
                  <Input
                    id="svc-min"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minPrice: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svc-ideal">Ideal (R$)</Label>
                  <Input
                    id="svc-ideal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.idealPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, idealPrice: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svc-max">Max (R$)</Label>
                  <Input
                    id="svc-max"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-deadline">Prazo típico</Label>
                <select
                  id="svc-deadline"
                  className={cn(selectClassName, "w-full")}
                  value={form.typicalDeadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, typicalDeadline: e.target.value }))
                  }
                >
                  <option value="">Sem prazo definido</option>
                  {TYPICAL_DEADLINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {form.typicalDeadline &&
                  !(TYPICAL_DEADLINE_OPTIONS as readonly string[]).includes(
                    form.typicalDeadline
                  ) ? (
                    <option value={form.typicalDeadline}>
                      {form.typicalDeadline}
                    </option>
                  ) : null}
                </select>
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-medium">Texto para proposta</p>
                  <p className="text-xs text-muted-foreground">
                    Frases curtas para colar na proposta — não é especificação
                    técnica. Foque no pacote comercial.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svc-in">Inclui</Label>
                  <textarea
                    id="svc-in"
                    className={cn(
                      "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    value={form.scopeIn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scopeIn: e.target.value }))
                    }
                    placeholder="Ex.: layout responsivo, formulário, deploy e 1 rodada de ajuste"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svc-out">Não inclui</Label>
                  <textarea
                    id="svc-out"
                    className={cn(
                      "min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    value={form.scopeOut}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scopeOut: e.target.value }))
                    }
                    placeholder="Ex.: copy longa, SEO, integração com CRM, manutenção mensal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-active">Status</Label>
                <select
                  id="svc-active"
                  className={cn(selectClassName, "w-full")}
                  value={form.active ? "true" : "false"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      active: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" onClick={requestClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={saveMutation.isPending || !form.name.trim()}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>

            {discardOpen ? (
              <div className="absolute inset-0 z-[70] flex items-center justify-center bg-background/60 p-6 backdrop-blur-sm">
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="svc-discard-title"
                  aria-describedby="svc-discard-desc"
                  className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg"
                >
                  <div className="space-y-1">
                    <p
                      id="svc-discard-title"
                      className="text-base font-semibold"
                    >
                      Descartar alterações?
                    </p>
                    <p
                      id="svc-discard-desc"
                      className="text-sm text-muted-foreground"
                    >
                      As informações preenchidas serão perdidas.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDiscardOpen(false)}
                    >
                      Continuar editando
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={confirmDiscard}
                    >
                      Descartar
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
