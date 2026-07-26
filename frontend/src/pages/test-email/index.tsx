import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendTestMail, type TestMailTemplate } from "@/services/mail"
import { useAuthStore } from "@/store/use-auth-store"

const schema = z.object({
  to: z.email("E-mail inválido"),
  template: z.enum(["welcome", "password-reset", "notification"]),
  code: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type TestMailHistoryEntry = {
  id: string
  to: string
  template: TestMailTemplate
  status: "success" | "error"
  at: string
}

const HISTORY_KEY = "leadz-mail-test-history"
const HISTORY_LIMIT = 30

const TEMPLATE_OPTIONS: { value: TestMailTemplate; label: string }[] = [
  { value: "welcome", label: "Boas-vindas" },
  { value: "password-reset", label: "Recuperação de senha" },
  { value: "notification", label: "Notificação" },
]

const templateLabel: Record<TestMailTemplate, string> = {
  welcome: "Boas-vindas",
  "password-reset": "Recuperação de senha",
  notification: "Notificação",
}

function loadHistory(): TestMailHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TestMailHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(entries: TestMailHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)))
}

export default function TestEmailPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<TestMailHistoryEntry[]>(() => loadHistory())
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      to: user?.email ?? "",
      template: "welcome",
      code: "123456",
      title: "Notificação de teste",
      message: "Este é um e-mail de teste do Leadz.",
    },
  })

  const template = watch("template")

  const mutation = useMutation({
    mutationFn: sendTestMail,
  })

  if (user?.companyRole !== "ADMIN") {
    return <Navigate to="/app/dashboard" replace />
  }

  function pushHistory(entry: Omit<TestMailHistoryEntry, "id" | "at">) {
    const next: TestMailHistoryEntry[] = [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
      },
      ...history,
    ].slice(0, HISTORY_LIMIT)
    setHistory(next)
    saveHistory(next)
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await mutation.mutateAsync({
        to: values.to,
        template: values.template,
        code: values.template === "password-reset" ? values.code : undefined,
        title: values.template === "notification" ? values.title : undefined,
        message:
          values.template === "notification" ? values.message : undefined,
      })
      pushHistory({
        to: values.to,
        template: values.template,
        status: "success",
      })
      toast.success("E-mail de teste enviado")
    } catch {
      pushHistory({
        to: values.to,
        template: values.template,
        status: "error",
      })
      toast.error("Falha ao enviar e-mail de teste")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Testar e-mail
        </h1>
        <p className="mx-auto mt-1 max-w-md text-muted-foreground">
          Envie os templates do sistema para validar branding e SMTP.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-xl border border-border bg-card/70 p-6 sm:p-8"
      >
        <div className="space-y-2">
          <Label htmlFor="to">Destinatário</Label>
          <Input
            id="to"
            type="email"
            placeholder="voce@empresa.com"
            {...register("to")}
          />
          {errors.to ? (
            <p className="text-xs text-destructive">{errors.to.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <select
            id="template"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("template")}
          >
            {TEMPLATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {template === "password-reset" ? (
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" {...register("code")} />
          </div>
        ) : null}

        {template === "notification" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Input id="message" {...register("message")} />
            </div>
          </>
        ) : null}

        <div className="flex justify-center pt-1">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar e-mail de teste"
            )}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Destinatário</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Quando</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="px-4 py-3">{entry.to}</td>
                <td className="px-4 py-3">
                  {templateLabel[entry.template] ?? entry.template}
                </td>
                <td
                  className={`px-4 py-3 ${
                    entry.status === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                >
                  {entry.status === "success" ? "Enviado" : "Falhou"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(entry.at).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
            {history.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum teste ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
