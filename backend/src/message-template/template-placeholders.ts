import { Lead } from 'src/lead/entities/lead.entity';

export const TEMPLATE_PLACEHOLDER_KEYS = [
  'contactName',
  'companyName',
  'service',
  'dealValue',
  'stage',
  'primaryChannel',
  'nextAction',
  'nextActionAt',
] as const;

export type TemplatePlaceholderKey =
  (typeof TEMPLATE_PLACEHOLDER_KEYS)[number];

const PLACEHOLDER_RE = /\[\[([a-zA-Z0-9_]+)\]\]/g;

export function buildLeadPlaceholderValues(
  lead: Lead,
): Record<string, string> {
  return {
    contactName: lead.contactName ?? '',
    companyName: lead.companyName ?? '',
    service: lead.service ?? '',
    dealValue: lead.dealValue != null ? String(lead.dealValue) : '',
    stage: lead.stage ?? '',
    primaryChannel: lead.primaryChannel ?? '',
    nextAction: lead.nextAction ?? '',
    nextActionAt: lead.nextActionAt ?? '',
  };
}

export function interpolateTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(PLACEHOLDER_RE, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key] ?? '';
    }
    return `[[${key}]]`;
  });
}

if (process.env.NODE_ENV === 'test' || process.argv.includes('--self-check')) {
  const sample = interpolateTemplate(
    'Oi [[contactName]] da [[companyName]]',
    { contactName: 'Ana', companyName: 'Acme' },
  );
  if (sample !== 'Oi Ana da Acme') {
    throw new Error('template-placeholders self-check failed');
  }
}
