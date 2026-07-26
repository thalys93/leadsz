import type { Lead } from "@/types/lead"
import type { TemplatePurpose } from "@/types/template"

export const TEMPLATE_PLACEHOLDER_KEYS = [
  "contactName",
  "companyName",
  "service",
  "dealValue",
  "stage",
  "primaryChannel",
  "nextAction",
  "nextActionAt",
] as const

export type TemplatePlaceholderKey = (typeof TEMPLATE_PLACEHOLDER_KEYS)[number]

export const TEMPLATE_PLACEHOLDER_LABELS: Record<TemplatePlaceholderKey, string> = {
  contactName: "Nome do contato",
  companyName: "Empresa do lead",
  service: "Serviço",
  dealValue: "Valor do negócio",
  stage: "Stage",
  primaryChannel: "Canal principal",
  nextAction: "Próxima ação",
  nextActionAt: "Data da próxima ação",
}

const PLACEHOLDER_RE = /\[\[([a-zA-Z0-9_]+)\]\]/g

export type TemplatePurposePreset = {
  title: string
  subject: string
  body: string
}

export const TEMPLATE_PURPOSE_PRESETS: Record<TemplatePurpose, TemplatePurposePreset> = {
  PRIMEIRO_CONTATO: {
    title: "Primeiro contato",
    subject: "Olá [[contactName]], posso te ajudar com [[service]]?",
    body: "Olá [[contactName]], tudo bem?\n\nVi que vocês na [[companyName]] podem se beneficiar de [[service]].\n\nPosso te enviar uma visão rápida de como funciona?",
  },
  FOLLOW_UP: {
    title: "Follow-up",
    subject: "Follow-up: [[service]] para [[companyName]]",
    body: "Oi [[contactName]], passando para retomar nossa conversa sobre [[service]].\n\nAinda faz sentido olharmos isso juntos esta semana?",
  },
  PROPOSTA: {
    title: "Envio de proposta",
    subject: "Proposta de [[service]] — [[companyName]]",
    body: "Olá [[contactName]],\n\nSegue a proposta de [[service]] para [[companyName]]. Valor de referência: [[dealValue]].\n\nQualquer ajuste, é só me dizer.",
  },
  REUNIAO: {
    title: "Convite de reunião",
    subject: "Reunião sobre [[service]]",
    body: "Oi [[contactName]], tudo bem?\n\nQueria alinhar uma conversa rápida sobre [[service]] para [[companyName]].\n\nQual horário funciona melhor para você?",
  },
  FECHAMENTO: {
    title: "Fechamento",
    subject: "Próximos passos — [[service]]",
    body: "Olá [[contactName]],\n\nPara avançarmos com [[service]] na [[companyName]], falta só confirmarmos os próximos passos.\n\nPosso te enviar o acordo para assinatura?",
  },
  OUTRO: {
    title: "Mensagem personalizada",
    subject: "Sobre [[service]]",
    body: "Olá [[contactName]],\n\n[[nextAction]]\n\nFico à disposição.",
  },
}

export function wrapPlaceholder(key: TemplatePlaceholderKey) {
  return `[[${key}]]`
}

export function buildLeadPlaceholderValues(lead: Lead): Record<string, string> {
  return {
    contactName: lead.contactName ?? "",
    companyName: lead.companyName ?? "",
    service: lead.service ?? "",
    dealValue:
      lead.dealValue != null ? String(lead.dealValue) : "",
    stage: lead.stage ?? "",
    primaryChannel: lead.primaryChannel ?? "",
    nextAction: lead.nextAction ?? "",
    nextActionAt: lead.nextActionAt ?? "",
  }
}

export function interpolateTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(PLACEHOLDER_RE, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key] ?? ""
    }
    return `[[${key}]]`
  })
}
