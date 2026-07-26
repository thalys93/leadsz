import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ExternalLink, Mail, MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendLeadEmail } from "@/services/emails"
import type { Lead } from "@/types/lead"
import { cn } from "@/lib/utils"

type ContactMode = "EMAIL" | "WHATSAPP"

function toWhatsAppDigits(phone: string) {
  return phone.replace(/\D/g, "")
}

function buildWhatsAppUrl(phone: string, message: string) {
  const digits = toWhatsAppDigits(phone)
  const params = new URLSearchParams()
  if (message.trim()) params.set("text", message.trim())
  const query = params.toString()
  return `https://wa.me/${digits}${query ? `?${query}` : ""}`
}

function resolveDefaultMode(lead: Lead): ContactMode {
  if (lead.primaryChannel === "WHATSAPP") return "WHATSAPP"
  if (lead.channels?.some((c) => c.type === "EMAIL")) return "EMAIL"
  if (lead.channels?.some((c) => c.type === "WHATSAPP")) return "WHATSAPP"
  return "EMAIL"
}

export function LeadContactPanel({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient()
  const emailChannel = lead.channels?.find((c) => c.type === "EMAIL")?.value ?? ""
  const whatsappChannel =
    lead.channels?.find((c) => c.type === "WHATSAPP")?.value ?? ""

  const [mode, setMode] = useState<ContactMode>(() => resolveDefaultMode(lead))
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [whatsappMessage, setWhatsappMessage] = useState("")

  const sendMutation = useMutation({
    mutationFn: () =>
      sendLeadEmail(lead.id, {
        subject,
        body,
        to: emailChannel || undefined,
      }),
    onSuccess: () => {
      setSubject("")
      setBody("")
      queryClient.invalidateQueries({ queryKey: ["leads", lead.id, "timeline"] })
      toast.success("E-mail enviado")
    },
    onError: () => toast.error("Falha ao enviar e-mail"),
  })

  const canSendEmail =
    emailChannel.trim().length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0

  const whatsappUrl = useMemo(() => {
    if (!whatsappChannel.trim() || !whatsappMessage.trim()) return null
    return buildWhatsAppUrl(whatsappChannel, whatsappMessage)
  }, [whatsappChannel, whatsappMessage])

  function openWhatsApp() {
    if (!whatsappUrl) return
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">
            Contato
          </h3>
          <p className="text-sm text-muted-foreground">
            Escolha o canal e envie a mensagem pelo meio cadastrado.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Canal de contato"
          className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "EMAIL"}
            onClick={() => setMode("EMAIL")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              mode === "EMAIL"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="size-4" />
            E-mail
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "WHATSAPP"}
            onClick={() => setMode("WHATSAPP")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              mode === "WHATSAPP"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </button>
        </div>
      </div>

      {mode === "EMAIL" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (canSendEmail) sendMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Mail className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Enviar e-mail</p>
              <p className="text-xs text-muted-foreground">
                O destinatário vem do canal de e-mail cadastrado e não pode ser
                alterado aqui.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email-to">Para</Label>
            <Input
              id="contact-email-to"
              type="email"
              value={emailChannel}
              readOnly
              disabled
              placeholder="Nenhum e-mail cadastrado"
            />
            {!emailChannel ? (
              <p className="text-xs text-muted-foreground">
                Cadastre um canal de e-mail na aba Canais para enviar mensagens.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email-subject">Assunto *</Label>
            <Input
              id="contact-email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto da mensagem"
              required
              disabled={!emailChannel}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email-body">Mensagem *</Label>
            <textarea
              id="contact-email-body"
              className={cn(
                "min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
              required
              disabled={!emailChannel}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={sendMutation.isPending || !canSendEmail}
          >
            <Send className="size-3.5" />
            {sendMutation.isPending ? "Enviando..." : "Enviar e-mail"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Abrir no WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Montamos um link com a mensagem pronta para abrir a conversa no
                WhatsApp Web ou no app.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-whatsapp-to">Telefone</Label>
            <Input
              id="contact-whatsapp-to"
              type="tel"
              value={whatsappChannel}
              readOnly
              disabled
              placeholder="Nenhum WhatsApp cadastrado"
            />
            {!whatsappChannel ? (
              <p className="text-xs text-muted-foreground">
                Cadastre um canal de WhatsApp na aba Canais para gerar o link.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-whatsapp-body">Mensagem *</Label>
            <textarea
              id="contact-whatsapp-body"
              className={cn(
                "min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder="Escreva a mensagem que vai abrir no WhatsApp..."
              disabled={!whatsappChannel}
            />
          </div>

          {whatsappUrl ? (
            <div className="space-y-2">
              <Label htmlFor="contact-whatsapp-link">Link gerado</Label>
              <Input
                id="contact-whatsapp-link"
                value={whatsappUrl}
                readOnly
                className="font-mono text-xs"
              />
            </div>
          ) : null}

          <Button
            type="button"
            size="sm"
            disabled={!whatsappUrl}
            onClick={openWhatsApp}
          >
            <ExternalLink className="size-3.5" />
            Abrir no WhatsApp
          </Button>
        </div>
      )}
    </div>
  )
}
