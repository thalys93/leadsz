import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';
import { TEMPLATE_PLACEHOLDER_KEYS } from './template-placeholders';

export type GroqLeadContext = {
  contactName: string;
  companyName: string | null;
  service: string;
  dealValue: string | null;
  stage: string;
  primaryChannel: string;
  nextAction: string | null;
  nextActionAt: string | null;
  checkpoints: string[];
  recentTimeline: string[];
};

export type GroqSenderContext = {
  name: string;
  companyName: string | null;
  jobTitle: string | null;
  website: string | null;
};

export type GroqDraftInspiration = {
  title?: string;
  currentSubject?: string;
  currentBody?: string;
  extraContext?: string;
};

export type GroqGenerateInput = {
  channel: ChannelType;
  purpose: TemplatePurpose;
  sender: GroqSenderContext;
  lead: GroqLeadContext;
} & GroqDraftInspiration;

export type GroqLibraryGenerateInput = {
  channel: ChannelType;
  purpose: TemplatePurpose;
  sender: GroqSenderContext;
} & GroqDraftInspiration;

export type GroqDraft = {
  subject: string | null;
  body: string;
};

const CHANNEL_GUIDANCE: Record<ChannelType, string> = {
  [ChannelType.WHATSAPP]:
    'Canal WHATSAPP: mensagem curta, linguagem simples e conversacional, sem jargão técnico nem formalidade excessiva. Sem saudação corporativa longa.',
  [ChannelType.EMAIL]:
    'Canal EMAIL: inclua assunto claro e útil. Corpo com parágrafos bem separados. Tom profissional, mas humano.',
  [ChannelType.LINKEDIN]:
    'Canal LINKEDIN: tom de rede profissional, direto e respeitoso. Mensagem curta, sem soar como spam.',
  [ChannelType.INSTAGRAM]:
    'Canal INSTAGRAM: tom leve e próximo, mensagem curta. Evite texto longo ou corporativo.',
  [ChannelType.OUTRO]:
    'Canal OUTRO: tom neutro e claro, adaptável a mensagem comercial escrita.',
};

const PURPOSE_GUIDANCE: Record<TemplatePurpose, string> = {
  [TemplatePurpose.PRIMEIRO_CONTATO]:
    'Propósito PRIMEIRO_CONTATO: cumprimente [[contactName]], apresente-se em UMA frase curta (só neste propósito), conecte [[service]] ao contexto e peça um ok leve para conversar. Sem pressão.',
  [TemplatePurpose.FOLLOW_UP]:
    'Propósito FOLLOW_UP: retome a conversa sem se apresentar de novo. Lembre o assunto ([[service]]), seja breve e facilite a resposta. NÃO diga seu nome, cargo nem empresa.',
  [TemplatePurpose.PROPOSTA]:
    'Propósito PROPOSTA: envie a proposta de forma direta. Cumprimente, diga que segue a proposta de [[service]] para [[companyName]], mencione [[dealValue]] se fizer sentido, e ofereça ajuste. NÃO se apresente. NÃO diga seu nome, cargo nem empresa. NÃO peça horário de reunião (isso é REUNIAO).',
  [TemplatePurpose.REUNIAO]:
    'Propósito REUNIAO: convide para uma conversa sobre [[service]] com pedido simples de horário. NÃO se apresente. NÃO diga seu nome, cargo nem empresa.',
  [TemplatePurpose.FECHAMENTO]:
    'Propósito FECHAMENTO: avance os próximos passos de [[service]] de forma objetiva. NÃO se apresente. NÃO diga seu nome, cargo nem empresa.',
  [TemplatePurpose.OUTRO]:
    'Propósito OUTRO: mensagem útil e objetiva. NÃO se apresente salvo se o contexto adicional pedir isso explicitamente.',
};

@Injectable()
export class GroqClient {
  private readonly logger = new Logger(GroqClient.name);
  private client: Groq | null = null;

  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new BadGatewayException('api.groq.api_key.missing');
    }

    if (!this.client) {
      this.client = new Groq({
        apiKey,
        baseURL: 'https://api.groq.com',
      });
    }

    return this.client;
  }

  private buildFormattingRules(): string {
    return [
      'Formatação: separe parágrafos com uma linha em branco (\\n\\n).',
      'Nunca entregue o body como um bloco único sem quebras.',
      'Não comece linhas com espaços em branco.',
      'Responda apenas com um JSON no formato {"subject": string ou null, "body": string}, sem markdown.',
    ].join(' ');
  }

  private buildPortugueseCopyRules(purpose: TemplatePurpose): string {
    const introRule =
      purpose === TemplatePurpose.PRIMEIRO_CONTATO
        ? [
            'Só neste propósito você pode se apresentar, e no máximo em uma frase.',
            'Use "Sou", "Me chamo" ou "Aqui é". Nunca "Estou" + nome.',
          ].join(' ')
        : [
            'PROIBIDO se apresentar ou mencionar nome, cargo ou empresa do remetente neste propósito.',
            'O destinatário já conhece quem escreve. Vá direto ao ponto.',
          ].join(' ');

    return [
      'Português do Brasil natural, claro e humano. Frases curtas.',
      introRule,
      'Dados do remetente no pedido são só contexto interno. Não force-os na mensagem.',
      'Não invente jargão vazio nem frases genéricas.',
      'Encaixe placeholders de forma fluida: "proposta de [[service]]", "para a [[companyName]]", "Olá [[contactName]]".',
      'Evite construções engessadas tipo "para você, [[contactName]], na [[companyName]]".',
      'Nunca escreva "serviço de [[service]]" nem "serviço personalizado de [[service]]".',
      'Não empilhe cumprimento + apresentação + oferta + CTA de reunião na mesma mensagem quando o propósito não pedir isso.',
    ].join(' ');
  }

  private buildInspirationRules(
    hasInspiration: boolean,
    purpose: TemplatePurpose,
  ): string {
    if (!hasInspiration) {
      return 'Gere uma mensagem nova do zero.';
    }
    const lines = [
      'Há um rascunho ou texto de referência no pedido.',
      'Inspire-se no tom, nos pontos e na intenção desse texto.',
      'Escreva sempre uma mensagem nova do zero: não copie estrutura, frases ou formatação do rascunho.',
      'Se o rascunho tiver erro de português ou apresentação estranha, corrija na versão nova.',
    ];
    if (purpose !== TemplatePurpose.PRIMEIRO_CONTATO) {
      lines.push(
        'Se o rascunho mencionar nome, cargo ou empresa do remetente, ignore isso e não reproduza.',
      );
    }
    return lines.join(' ');
  }

  private hasInspiration(input: GroqDraftInspiration): boolean {
    return Boolean(
      input.title?.trim() ||
        input.currentSubject?.trim() ||
        input.currentBody?.trim() ||
        input.extraContext?.trim(),
    );
  }

  private buildLeadSystemPrompt(
    channel: ChannelType,
    purpose: TemplatePurpose,
    hasInspiration: boolean,
  ): string {
    return [
      'Você escreve mensagens de contato comercial em português do Brasil.',
      CHANNEL_GUIDANCE[channel],
      PURPOSE_GUIDANCE[purpose],
      this.buildPortugueseCopyRules(purpose),
      'Personalize com os dados do lead informados; não invente fatos.',
      'Se faltar informação, use um texto genérico e útil.',
      this.buildInspirationRules(hasInspiration, purpose),
      this.buildFormattingRules(),
    ].join(' ');
  }

  private buildLibrarySystemPrompt(
    channel: ChannelType,
    purpose: TemplatePurpose,
    hasInspiration: boolean,
  ): string {
    const keys = TEMPLATE_PLACEHOLDER_KEYS.map((key) => `[[${key}]]`).join(
      ', ',
    );
    return [
      'Você cria templates reutilizáveis de mensagem comercial em português do Brasil.',
      CHANNEL_GUIDANCE[channel],
      PURPOSE_GUIDANCE[purpose],
      this.buildPortugueseCopyRules(purpose),
      `Use placeholders no formato [[chave]] para dados do lead. Chaves disponíveis: ${keys}.`,
      'NÃO substitua placeholders por nomes ou valores reais do lead: deixe [[chave]] no texto.',
      'Use [[contactName]] no cumprimento quando fizer sentido.',
      'Não escreva o nome do remetente fora do propósito PRIMEIRO_CONTATO.',
      this.buildInspirationRules(hasInspiration, purpose),
      this.buildFormattingRules(),
    ].join(' ');
  }

  private appendSenderLines(
    lines: Array<string | null>,
    sender: GroqSenderContext,
    purpose: TemplatePurpose,
  ): void {
    lines.push(
      'Dados do remetente (contexto interno; só use na mensagem se o propósito for PRIMEIRO_CONTATO):',
    );
    lines.push(`Nome: ${sender.name}`);
    if (sender.companyName) lines.push(`Empresa: ${sender.companyName}`);
    if (sender.jobTitle) lines.push(`Cargo: ${sender.jobTitle}`);
    if (sender.website) lines.push(`Website/portfólio: ${sender.website}`);
    if (purpose !== TemplatePurpose.PRIMEIRO_CONTATO) {
      lines.push(
        'Neste propósito, NÃO inclua nome, cargo nem empresa do remetente no texto gerado.',
      );
    }
  }

  private appendInspirationLines(
    lines: Array<string | null>,
    input: GroqDraftInspiration,
  ): void {
    if (input.title?.trim()) {
      lines.push(`Título de referência: ${input.title.trim()}`);
    }
    if (input.currentSubject?.trim()) {
      lines.push(
        `Assunto de referência (inspire-se, não copie): ${input.currentSubject.trim()}`,
      );
    }
    if (input.currentBody?.trim()) {
      lines.push(
        `Texto de referência (inspire-se, escreva do zero):\n${input.currentBody.trim()}`,
      );
    }
    if (input.extraContext?.trim()) {
      lines.push(`Contexto adicional: ${input.extraContext.trim()}`);
    }
  }

  private buildLeadUserPrompt(input: GroqGenerateInput): string {
    const { lead } = input;
    const lines: Array<string | null> = [
      `Canal solicitado: ${input.channel}`,
      `Propósito: ${input.purpose}`,
    ];

    this.appendSenderLines(lines, input.sender, input.purpose);

    lines.push(
      `Nome do contato: ${lead.contactName}`,
      lead.companyName ? `Empresa do lead: ${lead.companyName}` : null,
      `Serviço oferecido: ${lead.service}`,
      lead.dealValue ? `Valor do negócio: ${lead.dealValue}` : null,
      `Stage atual: ${lead.stage}`,
      `Canal principal do lead: ${lead.primaryChannel}`,
      lead.nextAction ? `Próxima ação: ${lead.nextAction}` : null,
      lead.nextActionAt ? `Data da próxima ação: ${lead.nextActionAt}` : null,
      lead.checkpoints.length
        ? `Checkpoints marcados: ${lead.checkpoints.join(', ')}`
        : null,
      lead.recentTimeline.length
        ? `Últimos eventos: ${lead.recentTimeline.join(' | ')}`
        : null,
    );

    this.appendInspirationLines(lines, input);

    return lines.filter(Boolean).join('\n');
  }

  private buildLibraryUserPrompt(input: GroqLibraryGenerateInput): string {
    const lines: Array<string | null> = [
      `Canal solicitado: ${input.channel}`,
      `Propósito: ${input.purpose}`,
      'Crie um template reutilizável para esse propósito, com placeholders [[chave]].',
    ];

    this.appendSenderLines(lines, input.sender, input.purpose);
    this.appendInspirationLines(lines, input);

    return lines.filter(Boolean).join('\n');
  }

  private parseDraft(raw: string): GroqDraft {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');

    try {
      const parsed = JSON.parse(cleaned) as Partial<GroqDraft>;
      if (typeof parsed.body === 'string') {
        return {
          subject: typeof parsed.subject === 'string' ? parsed.subject : null,
          body: parsed.body,
        };
      }
    } catch {
      // ponytail: modelo pode não retornar JSON válido; cai no fallback abaixo
    }

    return { subject: null, body: cleaned };
  }

  private async complete(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<GroqDraft> {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    try {
      const completion = await this.getClient().chat.completions.create({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new BadGatewayException('api.groq.empty.response');
      }

      return this.parseDraft(content);
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      this.logger.error('Falha ao chamar Groq', error as Error);
      throw new BadGatewayException('api.groq.request.failed');
    }
  }

  async generateDraft(input: GroqGenerateInput): Promise<GroqDraft> {
    return this.complete(
      this.buildLeadSystemPrompt(
        input.channel,
        input.purpose,
        this.hasInspiration(input),
      ),
      this.buildLeadUserPrompt(input),
    );
  }

  async generateLibraryDraft(
    input: GroqLibraryGenerateInput,
  ): Promise<GroqDraft> {
    return this.complete(
      this.buildLibrarySystemPrompt(
        input.channel,
        input.purpose,
        this.hasInspiration(input),
      ),
      this.buildLibraryUserPrompt(input),
    );
  }
}
