import api from "@/services/api"
import type { TimelineEvent } from "@/types/timeline"

export async function listTimeline(leadId: string) {
  const { data } = await api.get<TimelineEvent[]>(`leads/${leadId}/timeline`)
  return data
}

export async function createTimelineNote(leadId: string, content: string) {
  const { data } = await api.post<TimelineEvent>(`leads/${leadId}/timeline`, {
    content,
  })
  return data
}
