export type LeadStage =
  | "LEAD"
  | "CONTATADO"
  | "PROPOSTA"
  | "REUNIAO"
  | "FECHADO"
  | "ENTREGA"
  | "PAGO"
  | "PERDIDO"

export type ChannelType = "EMAIL" | "WHATSAPP" | "LINKEDIN" | "INSTAGRAM" | "OUTRO"

export type LeadTemperature = "FRIO" | "MORNO" | "QUENTE"

export type CheckpointKey =
  | "DEMONSTROU_INTERESSE"
  | "PEDIU_PROPOSTA"
  | "AGENDOU_REUNIAO"
  | "ORCAMENTO_ALINHADO"
  | "DECISOR_ENVOLVIDO"
  | "URGENCIA_PRAZO"

export type LeadCheckpoint = {
  key: CheckpointKey
  checked: boolean
  checkedAt: string | null
}

export type ContactChannel = {
  id?: string
  type: ChannelType
  value: string
}

export type LeadOwner = {
  id: string
  name: string
  email: string
}

export type Lead = {
  id: string
  companyId: string
  ownerId: string | null
  contactName: string
  companyName: string | null
  primaryChannel: ChannelType
  service: string | null
  dealValue: number | null
  stage: LeadStage
  nextAction: string | null
  nextActionAt: string | null
  score: number
  temperature: LeadTemperature
  notes: string | null
  channels?: ContactChannel[]
  checkpoints?: LeadCheckpoint[]
  owner?: LeadOwner | null
  createdAt: string
  updatedAt: string
}

export type LeadListFilters = {
  page?: number
  limit?: number
  stage?: LeadStage | ""
  channel?: ChannelType | ""
  search?: string
  sort?: string
}

export type PaginatedLeads = {
  items: Lead[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type LeadPayload = {
  contactName: string
  companyName?: string | null
  primaryChannel: ChannelType
  service?: string | null
  dealValue?: number | null
  stage?: LeadStage
  nextAction?: string | null
  nextActionAt?: string | null
  notes?: string | null
  channels?: ContactChannel[]
}
