import { useEffect, useRef } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CHANNEL_LABELS, TEMPLATE_PURPOSE_LABELS } from "@/lib/crm"
import {
  TEMPLATE_PLACEHOLDER_KEYS,
  TEMPLATE_PLACEHOLDER_LABELS,
  TEMPLATE_PURPOSE_PRESETS,
  wrapPlaceholder,
  type TemplatePlaceholderKey,
} from "@/lib/template-placeholders"
import {
  createTemplate,
  generateLibraryTemplateDraft,
  getTemplate,
  updateTemplate,
} from "@/services/templates"
import type { ChannelType } from "@/types/lead"
import type { MessageTemplatePayload, TemplatePurpose } from "@/types/template"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]
const PURPOSES: TemplatePurpose[] = [
  "PRIMEIRO_CONTATO",
  "FOLLOW_UP",
  "PROPOSTA",
  "REUNIAO",
  "FECHAMENTO",
  "OUTRO",
]

const schema = z.object({
  title: z.string().min(2, "Informe um título"),
  channel: z.enum(["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]),
  purpose: z.enum([
    "PRIMEIRO_CONTATO",
    "FOLLOW_UP",
    "PROPOSTA",
    "REUNIAO",
    "FECHAMENTO",
    "OUTRO",
  ]),
  subject: z.string().optional(),
  body: z.string().min(1, "Escreva o conteúdo"),
  aiGenerated: z.boolean(),
})

type FormValues = z.infer<typeof schema>

function applyPurposePreset(purpose: TemplatePurpose): Partial<FormValues> {
  const preset = TEMPLATE_PURPOSE_PRESETS[purpose]
  return {
    purpose,
    title: preset.title,
    subject: preset.subject,
    body: preset.body,
    aiGenerated: false,
  }
}

export default function TemplateFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const subjectRef = useRef<HTMLInputElement | null>(null)
  const insertTargetRef = useRef<"body" | "subject">("body")

  const templateQuery = useQuery({
    queryKey: ["templates", id],
    queryFn: () => getTemplate(id!),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel: "WHATSAPP",
      aiGenerated: false,
      ...applyPurposePreset("PRIMEIRO_CONTATO"),
    },
  })

  const { ref: bodyRegisterRef, ...bodyRegister } = register("body")
  const { ref: subjectRegisterRef, ...subjectRegister } = register("subject")

  useEffect(() => {
    if (!templateQuery.data) return
    const template = templateQuery.data
    reset({
      title: template.title,
      channel: template.channel,
      purpose: template.purpose,
      subject: template.subject ?? "",
      body: template.body,
      aiGenerated: template.aiGenerated,
    })
  }, [templateQuery.data, reset])

  const channel = watch("channel")
  const purpose = watch("purpose")
  const body = watch("body")

  const saveMutation = useMutation({
    mutationFn: (payload: MessageTemplatePayload) =>
      isEditing ? updateTemplate(id!, payload) : createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success(isEditing ? "Template atualizado" : "Template criado")
      navigate("/app/templates")
    },
    onError: () =>
      toast.error(isEditing ? "Falha ao atualizar template" : "Falha ao criar template"),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      generateLibraryTemplateDraft({
        channel: getValues("channel"),
        purpose: getValues("purpose"),
      }),
    onSuccess: (draft) => {
      setValue("body", draft.body, { shouldDirty: true })
      if (draft.subject) {
        setValue("subject", draft.subject, { shouldDirty: true })
      }
      setValue("aiGenerated", true, { shouldDirty: true })
      toast.success("Rascunho gerado com IA")
    },
    onError: () => toast.error("Falha ao gerar template com IA"),
  })

  function insertPlaceholder(key: TemplatePlaceholderKey) {
    const token = wrapPlaceholder(key)
    const target = insertTargetRef.current
    const field = target === "subject" ? subjectRef.current : bodyRef.current
    const current = getValues(target) ?? ""

    if (!field) {
      setValue(target, `${current}${token}`, { shouldDirty: true })
      return
    }

    const start = field.selectionStart ?? current.length
    const end = field.selectionEnd ?? current.length
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`
    setValue(target, next, { shouldDirty: true })

    requestAnimationFrame(() => {
      field.focus()
      const cursor = start + token.length
      field.setSelectionRange(cursor, cursor)
    })
  }

  function applyPreset(nextPurpose: TemplatePurpose) {
    const preset = applyPurposePreset(nextPurpose)
    setValue("purpose", nextPurpose)
    setValue("title", preset.title ?? "", { shouldDirty: true })
    setValue("subject", preset.subject ?? "", { shouldDirty: true })
    setValue("body", preset.body ?? "", { shouldDirty: true })
    setValue("aiGenerated", false, { shouldDirty: true })
  }

  async function submit(values: FormValues) {
    await saveMutation.mutateAsync({
      title: values.title,
      channel: values.channel,
      purpose: values.purpose,
      subject: values.channel === "EMAIL" ? values.subject || null : null,
      body: values.body,
      aiGenerated: values.aiGenerated,
    })
  }

  if (isEditing && templateQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando template...</p>
  }

  if (isEditing && templateQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">Template não encontrado.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/templates">Voltar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 hidden w-fit md:inline-flex"
          >
            <Link to="/app/templates">
              <ArrowLeft className="size-4" />
              Templates
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {isEditing ? "Editar template" : "Novo template"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Use [[variavel]] para preencher dados do lead ao aplicar a mensagem.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card/70 p-4">
        <p className="text-sm font-medium">Começar por propósito</p>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={purpose === item ? "default" : "outline"}
              onClick={() => applyPreset(item)}
            >
              {TEMPLATE_PURPOSE_LABELS[item]}
            </Button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-5 rounded-xl border border-border bg-card/70 p-4 sm:p-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register("title")} />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="channel">Canal</Label>
            <select
              id="channel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("channel")}
            >
              {CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {CHANNEL_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purpose">Propósito</Label>
            <select
              id="purpose"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("purpose")}
            >
              {PURPOSES.map((item) => (
                <option key={item} value={item}>
                  {TEMPLATE_PURPOSE_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {channel === "EMAIL" ? (
          <div className="space-y-1.5">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              {...subjectRegister}
              ref={(element) => {
                subjectRegisterRef(element)
                subjectRef.current = element
              }}
              onFocus={() => {
                insertTargetRef.current = "subject"
              }}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="body">Conteúdo</Label>
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
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_PLACEHOLDER_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-ember/40 hover:text-foreground"
                title={TEMPLATE_PLACEHOLDER_LABELS[key]}
                onClick={() => insertPlaceholder(key)}
              >
                {wrapPlaceholder(key)}
              </button>
            ))}
          </div>
          <textarea
            id="body"
            className="min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            {...bodyRegister}
            ref={(element) => {
              bodyRegisterRef(element)
              bodyRef.current = element
            }}
            onFocus={() => {
              insertTargetRef.current = "body"
            }}
          />
          {errors.body ? (
            <p className="text-xs text-destructive">{errors.body.message}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Ao usar o template em um lead, [[contactName]] e as demais variáveis são
            substituídas pelos dados dele.
          </p>
        </div>

        {body ? (
          <div className="space-y-1.5 rounded-lg border border-dashed border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Prévia bruta</p>
            <p className="whitespace-pre-wrap text-sm">{body}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Criar template"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/app/templates">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
