import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { deleteTemplate, listTemplates } from "@/services/templates"
import { CHANNEL_LABELS, TEMPLATE_PURPOSE_LABELS } from "@/lib/crm"
import type { ChannelType } from "@/types/lead"
import type { TemplatePurpose } from "@/types/template"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]
const PURPOSES: TemplatePurpose[] = [
  "PRIMEIRO_CONTATO",
  "FOLLOW_UP",
  "PROPOSTA",
  "REUNIAO",
  "FECHAMENTO",
  "OUTRO",
]

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<ChannelType | "">("")
  const [purpose, setPurpose] = useState<TemplatePurpose | "">("")

  const templatesQuery = useQuery({
    queryKey: ["templates", { channel, purpose }],
    queryFn: () => listTemplates({ channel, purpose }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Template removido")
    },
    onError: () => toast.error("Falha ao remover template"),
  })

  const templates = templatesQuery.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Templates
          </h1>
          <p className="mt-1 text-muted-foreground">
            Biblioteca de mensagens com variáveis [[lead]] da sua empresa.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/templates/new">
            <Plus className="size-4" />
            Novo template
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card/70 p-4">
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={channel}
          onChange={(e) => setChannel(e.target.value as ChannelType | "")}
        >
          <option value="">Todos os canais</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as TemplatePurpose | "")}
        >
          <option value="">Todos os propósitos</option>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              {TEMPLATE_PURPOSE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {templatesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando templates...</p>
      ) : !templates.length ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum template cadastrado ainda.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/app/templates/new">Criar primeiro template</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card/70 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {template.title}
                </h3>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {template.leadId ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Lead
                    </span>
                  ) : null}
                  {template.aiGenerated ? (
                    <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-ember">
                      <Sparkles className="size-3" />
                      IA
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{CHANNEL_LABELS[template.channel]}</span>
                <span>·</span>
                <span>{TEMPLATE_PURPOSE_LABELS[template.purpose]}</span>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                {template.body}
              </p>
              <div className="mt-auto flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/templates/${template.id}/edit`}>
                    <Pencil className="size-3.5" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Remover este template?")) {
                      deleteMutation.mutate(template.id)
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
