import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { CHANNEL_LABELS } from "@/lib/crm"
import {
  formatPhone,
  isValidPhone,
  PHONE_INVALID_MESSAGE,
} from "@/lib/phone"
import { updateLeadChannels } from "@/services/leads"
import type { ChannelType, ContactChannel } from "@/types/lead"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]

function toDraftChannels(channels: ContactChannel[]): ContactChannel[] {
  return channels.map((channel) => ({
    ...channel,
    value:
      channel.type === "WHATSAPP" ? formatPhone(channel.value) : channel.value,
  }))
}

export function LeadChannels({
  leadId,
  channels,
}: {
  leadId: string
  channels: ContactChannel[]
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ContactChannel[]>(() =>
    toDraftChannels(channels)
  )
  const [errors, setErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!editing) setDraft(toDraftChannels(channels))
  }, [channels, editing])

  const saveMutation = useMutation({
    mutationFn: (payload: ContactChannel[]) => updateLeadChannels(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", leadId] })
      toast.success("Canais atualizados")
      setEditing(false)
      setErrors({})
    },
    onError: () => toast.error("Falha ao atualizar canais"),
  })

  function updateChannelValue(index: number, value: string) {
    setDraft((prev) =>
      prev.map((channel, i) => {
        if (i !== index) return channel
        return {
          ...channel,
          value: channel.type === "WHATSAPP" ? formatPhone(value) : value,
        }
      })
    )
    setErrors((prev) => {
      if (!prev[index]) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  function handleSave() {
    const nextErrors: Record<number, string> = {}
    draft.forEach((channel, index) => {
      if (!channel.value.trim()) {
        nextErrors[index] = "Informe o valor do canal"
        return
      }
      if (channel.type === "WHATSAPP" && !isValidPhone(channel.value)) {
        nextErrors[index] = PHONE_INVALID_MESSAGE
      }
    })
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    saveMutation.mutate(
      draft
        .filter((channel) => channel.value.trim())
        .map((channel) => ({
          ...channel,
          value:
            channel.type === "WHATSAPP"
              ? formatPhone(channel.value)
              : channel.value.trim(),
        }))
    )
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        {channels.length ? (
          <ul className="space-y-2">
            {channels.map((channel, index) => (
              <li
                key={channel.id ?? index}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{CHANNEL_LABELS[channel.type]}</p>
                  <p className="truncate text-muted-foreground">
                    {channel.type === "WHATSAPP"
                      ? formatPhone(channel.value) || channel.value
                      : channel.value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum canal cadastrado.</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft(toDraftChannels(channels))
            setErrors({})
            setEditing(true)
          }}
        >
          <Pencil className="size-3.5" />
          Editar canais
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {draft.map((channel, index) => (
        <div key={index} className="space-y-1">
          <div className="flex gap-2">
            <select
              className="flex h-10 w-32 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
              value={channel.type}
              onChange={(e) => {
                const nextType = e.target.value as ChannelType
                setDraft((prev) =>
                  prev.map((item, i) => {
                    if (i !== index) return item
                    return {
                      ...item,
                      type: nextType,
                      value:
                        nextType === "WHATSAPP"
                          ? formatPhone(item.value)
                          : item.value,
                    }
                  })
                )
                setErrors((prev) => {
                  if (!prev[index]) return prev
                  const next = { ...prev }
                  delete next[index]
                  return next
                })
              }}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
            {channel.type === "WHATSAPP" ? (
              <PhoneInput
                className="flex-1"
                value={channel.value}
                onChange={(value) => updateChannelValue(index, value)}
                aria-invalid={Boolean(errors[index])}
              />
            ) : (
              <Input
                value={channel.value}
                placeholder="Valor do contato"
                className="flex-1"
                onChange={(e) => updateChannelValue(index, e.target.value)}
                aria-invalid={Boolean(errors[index])}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setDraft((prev) => prev.filter((_, i) => i !== index))
                setErrors((prev) => {
                  const next: Record<number, string> = {}
                  Object.entries(prev).forEach(([key, message]) => {
                    const current = Number(key)
                    if (current === index) return
                    next[current > index ? current - 1 : current] = message
                  })
                  return next
                })
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          {errors[index] ? (
            <p className="text-xs text-destructive">{errors[index]}</p>
          ) : null}
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setDraft((prev) => [...prev, { type: "WHATSAPP", value: "" }])
          }
        >
          <Plus className="size-3.5" />
          Adicionar canal
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false)
              setErrors({})
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
