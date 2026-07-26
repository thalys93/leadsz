import api from "@/services/api"
import type { ChannelType } from "@/types/lead"
import type {
  GeneratedTemplateDraft,
  MessageTemplate,
  MessageTemplateFilters,
  MessageTemplatePayload,
  TemplatePurpose,
} from "@/types/template"

export async function listTemplates(filters: MessageTemplateFilters = {}) {
  const { data } = await api.get<MessageTemplate[]>("templates", {
    params: {
      channel: filters.channel || undefined,
      purpose: filters.purpose || undefined,
      leadId: filters.leadId || undefined,
    },
  })
  return data
}

export async function listLeadTemplates(leadId: string) {
  const { data } = await api.get<MessageTemplate[]>(
    `leads/${leadId}/templates`
  )
  return data
}

export async function getTemplate(id: string) {
  const { data } = await api.get<MessageTemplate>(`templates/${id}`)
  return data
}

export async function createTemplate(payload: MessageTemplatePayload) {
  const { data } = await api.post<MessageTemplate>("templates", payload)
  return data
}

export async function updateTemplate(
  id: string,
  payload: Partial<MessageTemplatePayload>
) {
  const { data } = await api.patch<MessageTemplate>(`templates/${id}`, payload)
  return data
}

export async function deleteTemplate(id: string) {
  await api.delete(`templates/${id}`)
}

export async function generateTemplateDraft(
  leadId: string,
  payload: { channel: ChannelType; purpose: TemplatePurpose; extraContext?: string }
) {
  const { data } = await api.post<GeneratedTemplateDraft>(
    `leads/${leadId}/templates/generate`,
    payload
  )
  return data
}

export async function generateLibraryTemplateDraft(payload: {
  channel: ChannelType
  purpose: TemplatePurpose
  extraContext?: string
}) {
  const { data } = await api.post<GeneratedTemplateDraft>(
    "templates/generate",
    payload
  )
  return data
}

export async function applyTemplateToLead(
  leadId: string,
  templateId: string,
  sendEmail = false
) {
  const { data } = await api.post(
    `leads/${leadId}/templates/${templateId}/use`,
    { sendEmail }
  )
  return data
}
