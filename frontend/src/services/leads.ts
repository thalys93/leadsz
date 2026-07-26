import api from "@/services/api"
import type {
  CheckpointKey,
  ContactChannel,
  Lead,
  LeadCheckpoint,
  LeadListFilters,
  LeadPayload,
  PaginatedLeads,
} from "@/types/lead"

function normalizeCheckpoints(raw: unknown): LeadCheckpoint[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([key, checked]) => ({
      key: key as CheckpointKey,
      checked: Boolean(checked),
      checkedAt: null,
    }))
  }
  return []
}

function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    checkpoints: normalizeCheckpoints(lead.checkpoints),
  }
}

export async function listLeads(filters: LeadListFilters = {}) {
  const { data } = await api.get<PaginatedLeads>("leads", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      stage: filters.stage || undefined,
      channel: filters.channel || undefined,
      search: filters.search || undefined,
      sort: filters.sort || "nextActionAt:ASC",
    },
  })
  return {
    ...data,
    items: data.items.map(normalizeLead),
  }
}

export async function getLead(id: string) {
  const { data } = await api.get<Lead>(`leads/${id}`)
  return normalizeLead(data)
}

export async function createLead(payload: LeadPayload) {
  const { data } = await api.post<Lead>("leads", payload)
  return normalizeLead(data)
}

export async function updateLead(id: string, payload: Partial<LeadPayload>) {
  const { data } = await api.patch<Lead>(`leads/${id}`, payload)
  return normalizeLead(data)
}

export async function deleteLead(id: string) {
  await api.delete(`leads/${id}`)
}

export async function updateLeadCheckpoint(
  id: string,
  key: CheckpointKey,
  checked: boolean
) {
  const { data } = await api.put<Lead>(`leads/${id}/checkpoints`, {
    key,
    checked,
  })
  return normalizeLead(data)
}

export async function updateLeadChannels(id: string, channels: ContactChannel[]) {
  const { data } = await api.put<Lead>(`leads/${id}/channels`, { channels })
  return normalizeLead(data)
}
