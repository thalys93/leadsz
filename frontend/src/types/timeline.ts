export type TimelineEventType =
  | "NOTE"
  | "TEMPLATE_USED"
  | "STAGE_CHANGE"
  | "CHECKPOINT"
  | "EMAIL_SENT"

export type TimelineEvent = {
  id: string
  leadId: string
  type: TimelineEventType
  content: string
  metadata: Record<string, unknown> | null
  templateId: string | null
  authorId: string
  authorName?: string | null
  createdAt: string
}
