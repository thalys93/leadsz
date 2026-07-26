import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Mail, MessageSquare, Repeat, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listTimeline, createTimelineNote } from "@/services/timeline"
import { formatDateTimePtBR } from "@/lib/crm"
import type { TimelineEventType } from "@/types/timeline"

const INITIAL_VISIBLE_ACTIONS = 5
const LOAD_MORE_STEP = 10

const eventIcon: Record<TimelineEventType, typeof StickyNote> = {
  NOTE: StickyNote,
  TEMPLATE_USED: MessageSquare,
  STAGE_CHANGE: Repeat,
  CHECKPOINT: CheckCircle2,
  EMAIL_SENT: Mail,
}

const eventLabel: Record<TimelineEventType, string> = {
  NOTE: "Nota",
  TEMPLATE_USED: "Template usado",
  STAGE_CHANGE: "Mudança de stage",
  CHECKPOINT: "Checkpoint",
  EMAIL_SENT: "E-mail enviado",
}

export function LeadTimeline({ leadId }: { leadId: string }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState("")
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ACTIONS)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ACTIONS)
  }, [leadId])

  const timelineQuery = useQuery({
    queryKey: ["leads", leadId, "timeline"],
    queryFn: () => listTimeline(leadId),
  })

  const noteMutation = useMutation({
    mutationFn: (content: string) => createTimelineNote(leadId, content),
    onSuccess: () => {
      setNote("")
      setVisibleCount(INITIAL_VISIBLE_ACTIONS)
      queryClient.invalidateQueries({ queryKey: ["leads", leadId, "timeline"] })
      toast.success("Nota adicionada")
    },
    onError: () => toast.error("Falha ao adicionar nota"),
  })

  const events = useMemo(() => {
    const items = [...(timelineQuery.data ?? [])]
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return items
  }, [timelineQuery.data])

  const visibleEvents = events.slice(0, visibleCount)
  const hasMore = visibleCount < events.length

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          noteMutation.mutate(note.trim())
        }}
        className="flex gap-2"
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Adicionar nota na timeline..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button type="submit" size="sm" disabled={noteMutation.isPending || !note.trim()}>
          Adicionar
        </Button>
      </form>

      {timelineQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando timeline...</p>
      ) : !events.length ? (
        <p className="text-sm text-muted-foreground">Sem eventos ainda.</p>
      ) : (
        <div className="space-y-3">
          <ol className="space-y-3">
            {visibleEvents.map((event) => {
              const Icon = eventIcon[event.type]
              return (
                <li
                  key={event.id}
                  className="relative rounded-md border border-border px-3 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                      <Icon className="size-3.5" />
                      {eventLabel[event.type]}
                    </span>
                    <span className="ml-auto">{formatDateTimePtBR(event.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{event.content}</p>
                </li>
              )
            })}
          </ol>

          {hasMore ? (
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleCount((count) => count + LOAD_MORE_STEP)
                }
              >
                Carregar mais ações
              </Button>
              <p className="text-xs text-muted-foreground">
                Mostrando {visibleEvents.length} de {events.length}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
