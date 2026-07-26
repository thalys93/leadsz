import type { ChannelType, CheckpointKey, LeadStage, LeadTemperature } from "@/types/lead"
import type { TemplatePurpose } from "@/types/template"

export const STAGE_ORDER: LeadStage[] = [
  "LEAD",
  "CONTATADO",
  "PROPOSTA",
  "REUNIAO",
  "FECHADO",
  "ENTREGA",
  "PAGO",
  "PERDIDO",
]

export const STAGE_LABELS: Record<LeadStage, string> = {
  LEAD: "Lead",
  CONTATADO: "Contatado",
  PROPOSTA: "Proposta",
  REUNIAO: "Reunião",
  FECHADO: "Fechado",
  ENTREGA: "Entrega",
  PAGO: "Pago",
  PERDIDO: "Perdido",
}

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
}

export const CHECKPOINT_POINTS: Record<CheckpointKey, number> = {
  DEMONSTROU_INTERESSE: 15,
  PEDIU_PROPOSTA: 20,
  AGENDOU_REUNIAO: 20,
  ORCAMENTO_ALINHADO: 15,
  DECISOR_ENVOLVIDO: 15,
  URGENCIA_PRAZO: 15,
}

export const CHECKPOINT_LABELS: Record<CheckpointKey, string> = {
  DEMONSTROU_INTERESSE: "Cliente demonstrou interesse",
  PEDIU_PROPOSTA: "Pediu proposta",
  AGENDOU_REUNIAO: "Agendou reunião",
  ORCAMENTO_ALINHADO: "Orçamento alinhado",
  DECISOR_ENVOLVIDO: "Decisor envolvido",
  URGENCIA_PRAZO: "Urgência / prazo definido",
}

export const CHECKPOINT_ORDER: CheckpointKey[] = [
  "DEMONSTROU_INTERESSE",
  "PEDIU_PROPOSTA",
  "AGENDOU_REUNIAO",
  "ORCAMENTO_ALINHADO",
  "DECISOR_ENVOLVIDO",
  "URGENCIA_PRAZO",
]

export const TEMPLATE_PURPOSE_LABELS: Record<TemplatePurpose, string> = {
  PRIMEIRO_CONTATO: "Primeiro contato",
  FOLLOW_UP: "Follow-up",
  PROPOSTA: "Proposta",
  REUNIAO: "Reunião",
  FECHAMENTO: "Fechamento",
  OUTRO: "Outro",
}

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  FRIO: "Frio",
  MORNO: "Morno",
  QUENTE: "Quente",
}

export const TEMPERATURE_CLASSNAMES: Record<LeadTemperature, string> = {
  FRIO: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  MORNO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  QUENTE: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
}

export function computeTemperature(score: number): LeadTemperature {
  if (score >= 70) return "QUENTE"
  if (score >= 40) return "MORNO"
  return "FRIO"
}

export function formatCurrencyBRL(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseApiDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
    return new Date(`${value}Z`)
  }
  return new Date(value)
}

export function formatDatePtBR(value: string | null | undefined) {
  if (!value) return "—"
  return parseApiDate(value).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  })
}

export function formatDateTimePtBR(value: string | null | undefined) {
  if (!value) return "—"
  return parseApiDate(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

export function isOverdue(nextActionAt: string | null | undefined, stage: LeadStage) {
  if (!nextActionAt) return false
  if (stage === "PAGO" || stage === "PERDIDO") return false
  return new Date(nextActionAt).getTime() < new Date().setHours(0, 0, 0, 0)
}
