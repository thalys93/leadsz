import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CHANNEL_LABELS, TEMPLATE_PURPOSE_LABELS } from "@/lib/crm"
import {
  buildLeadPlaceholderValues,
  interpolateTemplate,
} from "@/lib/template-placeholders"
import {
  listTemplates,
  listLeadTemplates,
  generateTemplateDraft,
  createTemplate,
  applyTemplateToLead,
} from "@/services/templates"
import type { ChannelType, Lead } from "@/types/lead"
import type { MessageTemplate, TemplatePurpose } from "@/types/template"
import { cn } from "@/lib/utils"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]
const PURPOSES: TemplatePurpose[] = [
  "PRIMEIRO_CONTATO",
  "FOLLOW_UP",
  "PROPOSTA",
  "REUNIAO",
  "FECHAMENTO",
  "OUTRO",
]

function formatTemplateDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function LeadTemplatePanel({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState<ChannelType>(lead.primaryChannel)
  const [purpose, setPurpose] = useState<TemplatePurpose>("PRIMEIRO_CONTATO")
  const [extraContext, setExtraContext] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null)
  const [sendEmail, setSendEmail] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)

  const libraryQuery = useQuery({
    queryKey: ["templates"],
    queryFn: () => listTemplates(),
  })

  const leadTemplatesQuery = useQuery({
    queryKey: ["leads", lead.id, "templates"],
    queryFn: () => listLeadTemplates(lead.id),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      generateTemplateDraft(lead.id, {
        channel,
        purpose,
        title: `${TEMPLATE_PURPOSE_LABELS[purpose]} · ${lead.contactName}`,
        currentSubject: subject || undefined,
        currentBody: body || undefined,
        extraContext: extraContext || undefined,
      }),
    onSuccess: (draft) => {
      setSubject(draft.subject ?? "")
      setBody(draft.body)
      setSavedTemplateId(null)
      setAiGenerated(true)
      toast.success("Rascunho gerado com IA")
    },
    onError: () => toast.error("Falha ao gerar template com IA"),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      createTemplate({
        title: `${TEMPLATE_PURPOSE_LABELS[purpose]} · ${lead.contactName}`,
        channel,
        purpose,
        subject: subject || null,
        body,
        leadId: lead.id,
        aiGenerated,
      }),
    onSuccess: (template) => {
      setSavedTemplateId(template.id)
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id, "templates"] })
      toast.success("Template salvo para este lead")
    },
    onError: () => toast.error("Falha ao salvar template"),
  })

  const applyMutation = useMutation({
    mutationFn: (templateId: string) =>
      applyTemplateToLead(lead.id, templateId, sendEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id, "timeline"] })
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id] })
      toast.success("Template registrado na timeline")
    },
    onError: () => toast.error("Falha ao usar template"),
  })

  function selectTemplate(template: MessageTemplate) {
    const values = buildLeadPlaceholderValues(lead)
    setSubject(interpolateTemplate(template.subject ?? "", values))
    setBody(interpolateTemplate(template.body, values))
    setChannel(template.channel)
    setPurpose(template.purpose)
    setSavedTemplateId(template.id)
    setAiGenerated(template.aiGenerated)
  }

  function selectLibraryTemplate(id: string) {
    const template = libraryQuery.data?.find((item) => item.id === id)
    if (!template) return
    selectTemplate(template)
  }

  async function copyToClipboard() {
    const text = subject ? `${subject}\n\n${body}` : body
    await navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência")
  }

  const leadTemplates = leadTemplatesQuery.data ?? []
  const libraryTemplates = libraryQuery.data ?? []

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-semibold">Templates deste lead</h3>
          <p className="text-xs text-muted-foreground">
            Mensagens salvas especificamente para {lead.contactName}.
          </p>
        </div>
        {leadTemplatesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : leadTemplates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum template vinculado a este lead ainda.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {leadTemplates.map((template) => {
              const selected = savedTemplateId === template.id
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => selectTemplate(template)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "border-ember/50 bg-accent/50"
                        : "border-border bg-card/60 hover:border-ember/30 hover:bg-accent/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {template.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {CHANNEL_LABELS[template.channel]} ·{" "}
                          {TEMPLATE_PURPOSE_LABELS[template.purpose]}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {template.aiGenerated ? (
                          <Sparkles className="size-3.5 text-ember" />
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatTemplateDate(template.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="existing-template">Usar template da biblioteca</Label>
        <select
          id="existing-template"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={savedTemplateId ?? ""}
          onChange={(e) => selectLibraryTemplate(e.target.value)}
        >
          <option value="">Selecionar...</option>
          {libraryTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title} · {CHANNEL_LABELS[template.channel]}
              {template.leadId === lead.id ? " · este lead" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gen-channel">Canal</Label>
          <select
            id="gen-channel"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value as ChannelType)}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gen-purpose">Propósito</Label>
          <select
            id="gen-purpose"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as TemplatePurpose)}
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {TEMPLATE_PURPOSE_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="extra-context">Contexto extra (opcional)</Label>
        <Input
          id="extra-context"
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
          placeholder="Ex.: mencionar desconto de fechamento"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={generateMutation.isPending}
        onClick={() => generateMutation.mutate()}
      >
        <Sparkles className="size-3.5" />
        {generateMutation.isPending ? "Gerando..." : "Gerar com IA"}
      </Button>

      {channel === "EMAIL" ? (
        <div className="space-y-1.5">
          <Label htmlFor="draft-subject">Assunto</Label>
          <Input
            id="draft-subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setSavedTemplateId(null)
            }}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="draft-body">Mensagem</Label>
        <textarea
          id="draft-body"
          className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            setSavedTemplateId(null)
          }}
          placeholder="Gere com IA, selecione um template ou escreva do zero"
        />
        <p className="text-xs text-muted-foreground">
          Templates da biblioteca com [[variavel]] são preenchidos com os dados deste lead ao selecionar.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!body}
          onClick={copyToClipboard}
        >
          Copiar
        </Button>
        {!savedTemplateId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!body || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar para este lead"}
          </Button>
        ) : null}
        {channel === "EMAIL" ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 accent-ember"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Enviar por e-mail agora
          </label>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!savedTemplateId || applyMutation.isPending}
          onClick={() => savedTemplateId && applyMutation.mutate(savedTemplateId)}
        >
          Usar template
        </Button>
      </div>
    </div>
  )
}
