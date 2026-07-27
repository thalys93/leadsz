import type { ChannelType } from "@/types/lead"

export type TemplatePurpose =
  | "PRIMEIRO_CONTATO"
  | "FOLLOW_UP"
  | "PROPOSTA"
  | "REUNIAO"
  | "FECHAMENTO"
  | "OUTRO"

export type MessageTemplate = {
  id: string
  companyId: string
  leadId?: string | null
  title: string
  channel: ChannelType
  purpose: TemplatePurpose
  subject: string | null
  body: string
  aiGenerated: boolean
  createdById: string
  createdAt: string
  updatedAt: string
}

export type MessageTemplateFilters = {
  channel?: ChannelType | ""
  purpose?: TemplatePurpose | ""
  leadId?: string
}

export type MessageTemplatePayload = {
  title: string
  channel: ChannelType
  purpose: TemplatePurpose
  subject?: string | null
  body: string
  leadId?: string | null
  aiGenerated?: boolean
}

export type GeneratedTemplateDraft = {
  subject: string | null
  body: string
}

export type GenerateTemplatePayload = {
  channel: ChannelType
  purpose: TemplatePurpose
  title?: string
  currentSubject?: string
  currentBody?: string
  extraContext?: string
}
