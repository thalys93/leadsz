import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowUpRight,
  FileText,
  Flame,
  ListChecks,
  UserPlus,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboardSummary } from "@/services/dashboard"
import { createLead } from "@/services/leads"
import { useAuthStore } from "@/store/use-auth-store"
import { STAGE_LABELS, STAGE_ORDER, formatCurrencyBRL } from "@/lib/crm"
import { cn } from "@/lib/utils"
import type { LeadPayload, LeadStage } from "@/types/lead"
import { LeadFormDialog } from "@/pages/leads/components/lead-form-dialog"

const STAGE_CHART_COLORS: Record<LeadStage, string> = {
  LEAD: "hsl(210 12% 58%)",
  CONTATADO: "hsl(38 72% 52%)",
  PROPOSTA: "hsl(18 85% 48%)",
  REUNIAO: "hsl(8 72% 44%)",
  FECHADO: "hsl(162 42% 38%)",
  ENTREGA: "hsl(188 48% 36%)",
  PAGO: "hsl(148 48% 34%)",
  PERDIDO: "hsl(0 48% 50%)",
}

function buildConicGradient(counts: Record<LeadStage, number>, total: number) {
  if (total <= 0) return "hsl(var(--muted))"

  let cursor = 0
  const stops: string[] = []

  for (const stage of STAGE_ORDER) {
    const count = counts[stage] ?? 0
    if (count <= 0) continue
    const start = (cursor / total) * 100
    cursor += count
    const end = (cursor / total) * 100
    stops.push(`${STAGE_CHART_COLORS[stage]} ${start}% ${end}%`)
  }

  return stops.length ? `conic-gradient(${stops.join(", ")})` : "hsl(var(--muted))"
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [leadDialogOpen, setLeadDialogOpen] = useState(false)
  const [hoveredStage, setHoveredStage] = useState<LeadStage | null>(null)

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
  })

  const createLeadMutation = useMutation({
    mutationFn: (payload: LeadPayload) => createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead criado")
      setLeadDialogOpen(false)
    },
    onError: () => toast.error("Falha ao criar lead"),
  })

  const summary = summaryQuery.data
  const byStage = summary?.byStage
  const totalLeads = STAGE_ORDER.reduce(
    (sum, stage) => sum + (byStage?.[stage] ?? 0),
    0
  )
  const chartGradient = byStage
    ? buildConicGradient(byStage, totalLeads)
    : "hsl(var(--muted))"

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,hsl(var(--ember)_/_0.12),transparent_70%)] blur-2xl"
      />

      <div className="relative flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Olá, {user?.name?.split(" ")[0]}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            Visão geral do seu funil de negócios.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/app/leads">
            Ver leads
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      {summaryQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-52 animate-pulse rounded-xl border border-border bg-muted/50" />
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="h-14 animate-pulse rounded-xl border border-border bg-muted/50" />
            <div className="h-14 animate-pulse rounded-xl border border-border bg-muted/50" />
            <div className="h-14 animate-pulse rounded-xl border border-border bg-muted/50" />
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <div className="h-11 animate-pulse rounded-xl border border-border bg-muted/50" />
            <div className="h-11 animate-pulse rounded-xl border border-border bg-muted/50" />
          </div>
        </div>
      ) : summaryQuery.isError ? (
        <p className="text-sm text-destructive">Erro ao carregar dashboard.</p>
      ) : (
        <>
          <section className="shrink-0 space-y-2 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Distribuição por stage
              </h2>
              <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
                {totalLeads} {totalLeads === 1 ? "lead" : "leads"}
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-5 rounded-xl border border-border bg-card/80 p-4 sm:gap-8 sm:p-5">
              <div
                className={cn(
                  "relative size-36 shrink-0 rounded-full transition-[filter] duration-200 sm:size-48",
                  totalLeads > 0 && "shadow-[0_0_0_1px_hsl(var(--border))]"
                )}
                style={{
                  background: chartGradient,
                  filter:
                    hoveredStage && totalLeads > 0
                      ? "saturate(1.05) brightness(1.02)"
                      : undefined,
                }}
                role="img"
                aria-label={`Distribuição de ${totalLeads} leads por stage`}
              >
                <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border border-border/60 bg-card shadow-sm">
                  <p className="font-display text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                    {hoveredStage
                      ? (byStage?.[hoveredStage] ?? 0)
                      : totalLeads}
                  </p>
                  <p className="mt-0.5 max-w-[6rem] truncate text-center text-xs text-muted-foreground">
                    {hoveredStage
                      ? STAGE_LABELS[hoveredStage]
                      : "no funil"}
                  </p>
                </div>
              </div>

              {totalLeads === 0 ? (
                <div className="flex flex-col items-start justify-center gap-2">
                  <p className="font-display text-base font-semibold tracking-tight">
                    Nenhum lead no funil
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Crie o primeiro lead para visualizar a distribuição.
                  </p>
                  <Button size="sm" onClick={() => setLeadDialogOpen(true)}>
                    <UserPlus className="size-4" />
                    Criar lead
                  </Button>
                </div>
              ) : (
                <ul className="grid gap-0.5 sm:grid-cols-2">
                  {STAGE_ORDER.map((stage) => {
                    const count = byStage?.[stage] ?? 0
                    const percent =
                      totalLeads > 0
                        ? Math.round((count / totalLeads) * 100)
                        : 0
                    const active = hoveredStage === stage

                    return (
                      <li key={stage}>
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredStage(stage)}
                          onMouseLeave={() => setHoveredStage(null)}
                          onFocus={() => setHoveredStage(stage)}
                          onBlur={() => setHoveredStage(null)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                            active
                              ? "bg-accent/70"
                              : "hover:bg-muted/70",
                            count === 0 && "opacity-45"
                          )}
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: STAGE_CHART_COLORS[stage] }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {STAGE_LABELS[stage]}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {percent}%
                          </span>
                          <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums">
                            {count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="mb-1 flex items-center justify-between gap-1">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                  Atrasadas
                </p>
                <ListChecks className="size-3.5 shrink-0 text-destructive" />
              </div>
              <p className="font-display text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {summary?.overdueNextAction ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="mb-1 flex items-center justify-between gap-1">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                  Quentes
                </p>
                <Flame className="size-3.5 shrink-0 text-ember" />
              </div>
              <p className="font-display text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {summary?.hotStuck ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/80 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="mb-1 flex items-center justify-between gap-1">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                  Pipeline
                </p>
                <Wallet className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="truncate font-display text-lg font-semibold tabular-nums tracking-tight sm:text-2xl">
                {formatCurrencyBRL(summary?.pipelineValue ?? 0)}
              </p>
            </div>
          </section>
        </>
      )}

      <section className="hidden shrink-0 grid-cols-2 gap-2 md:grid">
        <button
          type="button"
          onClick={() => setLeadDialogOpen(true)}
          className="group flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-card/80 px-3 py-2.5 text-left transition-all hover:border-ember/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ember/10 text-ember transition-transform duration-200 group-hover:scale-105">
            <UserPlus className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 font-display text-sm font-semibold tracking-tight">
              Novo lead
              <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Contato e próxima ação.
            </span>
          </span>
        </button>

        <Link
          to="/app/templates/new"
          className="group flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-card/80 px-3 py-2.5 text-left transition-all hover:border-ember/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-transform duration-200 group-hover:scale-105">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 font-display text-sm font-semibold tracking-tight">
              Novo template
              <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Mensagem para follow-up.
            </span>
          </span>
        </Link>
      </section>

      <nav
        aria-label="Ações rápidas"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2">
          <button
            type="button"
            onClick={() => setLeadDialogOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-ember transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <UserPlus className="size-5" />
            <span className="text-[11px] font-medium leading-none">Novo lead</span>
          </button>
          <Link
            to="/app/templates/new"
            className="flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-foreground transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <FileText className="size-5" />
            <span className="text-[11px] font-medium leading-none">
              Novo template
            </span>
          </Link>
        </div>
      </nav>

      <div className="h-16 shrink-0 md:hidden" aria-hidden />

      <LeadFormDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        submitting={createLeadMutation.isPending}
        onSubmit={(payload) => createLeadMutation.mutateAsync(payload)}
      />
    </div>
  )
}
