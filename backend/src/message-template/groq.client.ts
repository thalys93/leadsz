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

export type GroqGenerateInput = {
  channel: ChannelType;
  purpose: TemplatePurpose;
  extraContext?: string;
  lead: GroqLeadContext;
};

export type GroqLibraryGenerateInput = {
  channel: ChannelType;
  purpose: TemplatePurpose;
  extraContext?: string;
};

export type GroqDraft = {
  subject: string | null;
  body: string;
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

  private buildLeadSystemPrompt(): string {
    return [
      'Você escreve mensagens de contato comercial em português do Brasil, tom profissional e direto.',
      'Para canais LINKEDIN, WHATSAPP e INSTAGRAM, escreva uma mensagem curta.',
      'Para canal EMAIL, pode incluir um assunto.',
      'Personalize com os dados do lead informados; não invente fatos.',
      'Se faltar informação, use um texto genérico e útil.',
      'Responda apenas com um JSON no formato {"subject": string ou null, "body": string}, sem markdown.',
    ].join(' ');
  }

  private buildLibrarySystemPrompt(): string {
    const keys = TEMPLATE_PLACEHOLDER_KEYS.map((key) => `[[${key}]]`).join(
      ', ',
    );
    return [
      'Você cria templates reutilizáveis de mensagem comercial em português do Brasil.',
      'Tom profissional e direto.',
      'Para canais LINKEDIN, WHATSAPP e INSTAGRAM, escreva uma mensagem curta.',
      'Para canal EMAIL, inclua um assunto quando fizer sentido.',
      `Use placeholders no formato [[chave]] para dados do lead. Chaves disponíveis: ${keys}.`,
      'NÃO substitua placeholders por nomes ou valores reais — deixe [[chave]] no texto.',
      'Use pelo menos [[contactName]] quando o texto se dirigir à pessoa.',
      'Responda apenas com um JSON no formato {"subject": string ou null, "body": string}, sem markdown.',
    ].join(' ');
  }

  private buildLeadUserPrompt(input: GroqGenerateInput): string {
    const { lead } = input;
    const lines = [
      `Canal solicitado: ${input.channel}`,
      `Propósito: ${input.purpose}`,
      `Nome do contato: ${lead.contactName}`,
      lead.companyName ? `Empresa: ${lead.companyName}` : null,
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
      input.extraContext ? `Contexto adicional: ${input.extraContext}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private buildLibraryUserPrompt(input: GroqLibraryGenerateInput): string {
    const lines = [
      `Canal solicitado: ${input.channel}`,
      `Propósito: ${input.purpose}`,
      'Crie um template reutilizável para esse propósito, com placeholders [[chave]].',
      input.extraContext ? `Contexto adicional: ${input.extraContext}` : null,
    ].filter(Boolean);

    return lines.join('\n');
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
      this.buildLeadSystemPrompt(),
      this.buildLeadUserPrompt(input),
    );
  }

  async generateLibraryDraft(
    input: GroqLibraryGenerateInput,
  ): Promise<GroqDraft> {
    return this.complete(
      this.buildLibrarySystemPrompt(),
      this.buildLibraryUserPrompt(input),
    );
  }
}
