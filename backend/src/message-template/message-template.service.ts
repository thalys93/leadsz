import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from './entities/message-template.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { User } from 'src/user/entities/user.entity';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';
import { TimelineEventType } from 'src/enums/TimelineEventType';
import { GroqClient, GroqSenderContext } from './groq.client';
import { TimelineService } from 'src/timeline/timeline.service';
import { MailService } from 'src/mail/mail.service';
import { GenerateLibraryTemplateDto } from './dto/generate-library-template.dto';
import {
  buildLeadPlaceholderValues,
  interpolateTemplate,
} from './template-placeholders';

const RECENT_TIMELINE_LIMIT = 5;

@Injectable()
export class MessageTemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepository: Repository<MessageTemplate>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly groqClient: GroqClient,
    private readonly timelineService: TimelineService,
    private readonly mailService: MailService,
  ) {}

  private requireCompanyId(authUser: AuthUser): string {
    if (!authUser.companyId) {
      throw new ForbiddenException('api.company.required');
    }
    return authUser.companyId;
  }

  private async requireLead(companyId: string, leadId: string) {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId, companyId },
      relations: ['channels'],
    });
    if (!lead) {
      throw new NotFoundException('api.lead.not.found');
    }
    return lead;
  }

  private async requireTemplate(companyId: string, id: string) {
    const template = await this.templateRepository.findOne({
      where: { id, companyId },
    });
    if (!template) {
      throw new NotFoundException('api.message_template.not.found');
    }
    return template;
  }

  private async resolveSender(authUser: AuthUser): Promise<GroqSenderContext> {
    const user = await this.userRepository.findOne({
      where: { id: authUser.id },
      relations: ['company'],
    });

    return {
      name: user?.name ?? authUser.name ?? authUser.email,
      companyName: user?.company?.name ?? null,
      jobTitle: user?.jobTitle ?? null,
      website: user?.website ?? null,
    };
  }

  private draftInspirationFromDto(
    dto: GenerateTemplateDto | GenerateLibraryTemplateDto,
  ) {
    return {
      title: dto.title,
      currentSubject: dto.currentSubject,
      currentBody: dto.currentBody,
      extraContext: dto.extraContext,
    };
  }

  async create(authUser: AuthUser, dto: CreateMessageTemplateDto) {
    const companyId = this.requireCompanyId(authUser);
    let leadId: string | null = null;

    if (dto.leadId) {
      await this.requireLead(companyId, dto.leadId);
      leadId = dto.leadId;
    }

    return this.templateRepository.save(
      this.templateRepository.create({
        companyId,
        leadId,
        title: dto.title.trim(),
        channel: dto.channel,
        purpose: dto.purpose,
        subject: dto.subject?.trim() || null,
        body: dto.body,
        aiGenerated: dto.aiGenerated ?? false,
        createdById: authUser.id,
      }),
    );
  }

  async findAll(
    authUser: AuthUser,
    filters: {
      channel?: ChannelType;
      purpose?: TemplatePurpose;
      leadId?: string;
    } = {},
  ) {
    const companyId = this.requireCompanyId(authUser);
    const where: {
      companyId: string;
      channel?: ChannelType;
      purpose?: TemplatePurpose;
      leadId?: string;
    } = { companyId };

    if (filters.channel) where.channel = filters.channel;
    if (filters.purpose) where.purpose = filters.purpose;
    if (filters.leadId) where.leadId = filters.leadId;

    return this.templateRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findByLead(authUser: AuthUser, leadId: string) {
    const companyId = this.requireCompanyId(authUser);
    await this.requireLead(companyId, leadId);
    return this.templateRepository.find({
      where: { companyId, leadId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    return this.requireTemplate(companyId, id);
  }

  async update(authUser: AuthUser, id: string, dto: UpdateMessageTemplateDto) {
    const companyId = this.requireCompanyId(authUser);
    const template = await this.requireTemplate(companyId, id);

    if (dto.title !== undefined) template.title = dto.title.trim();
    if (dto.channel !== undefined) template.channel = dto.channel;
    if (dto.purpose !== undefined) template.purpose = dto.purpose;
    if (dto.subject !== undefined)
      template.subject = dto.subject?.trim() || null;
    if (dto.body !== undefined) template.body = dto.body;
    if (dto.aiGenerated !== undefined) template.aiGenerated = dto.aiGenerated;

    return this.templateRepository.save(template);
  }

  async remove(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    await this.requireTemplate(companyId, id);
    await this.templateRepository.delete({ id, companyId });
    return { message: 'api.message_template.deleted', templateId: id };
  }

  async generateDraft(
    authUser: AuthUser,
    leadId: string,
    dto: GenerateTemplateDto,
  ) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, leadId);
    const sender = await this.resolveSender(authUser);
    const recentEvents = await this.timelineService.recent(
      companyId,
      leadId,
      RECENT_TIMELINE_LIMIT,
    );

    const draft = await this.groqClient.generateDraft({
      channel: dto.channel,
      purpose: dto.purpose,
      sender,
      ...this.draftInspirationFromDto(dto),
      lead: {
        contactName: lead.contactName,
        companyName: lead.companyName,
        service: lead.service,
        dealValue: lead.dealValue,
        stage: lead.stage,
        primaryChannel: lead.primaryChannel,
        nextAction: lead.nextAction,
        nextActionAt: lead.nextActionAt,
        checkpoints: Object.entries(lead.checkpoints)
          .filter(([, checked]) => checked)
          .map(([key]) => key),
        recentTimeline: recentEvents.map((event) =>
          `${event.type}: ${event.content}`.slice(0, 200),
        ),
      },
    });

    return {
      channel: dto.channel,
      purpose: dto.purpose,
      subject: draft.subject,
      body: draft.body,
      aiGenerated: true,
    };
  }

  async generateLibraryDraft(
    authUser: AuthUser,
    dto: GenerateLibraryTemplateDto,
  ) {
    this.requireCompanyId(authUser);
    const sender = await this.resolveSender(authUser);

    const draft = await this.groqClient.generateLibraryDraft({
      channel: dto.channel,
      purpose: dto.purpose,
      sender,
      ...this.draftInspirationFromDto(dto),
    });

    return {
      channel: dto.channel,
      purpose: dto.purpose,
      subject: draft.subject,
      body: draft.body,
      aiGenerated: true,
    };
  }

  async useTemplate(
    authUser: AuthUser,
    leadId: string,
    templateId: string,
    dto: UseTemplateDto,
  ) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, leadId);
    const template = await this.requireTemplate(companyId, templateId);
    const values = buildLeadPlaceholderValues(lead);
    const subject = template.subject
      ? interpolateTemplate(template.subject, values)
      : null;
    const body = interpolateTemplate(template.body, values);

    const snapshot = subject ? `${subject}\n\n${body}` : body;

    const event = await this.timelineService.record({
      companyId,
      leadId,
      authorId: authUser.id,
      type: TimelineEventType.TEMPLATE_USED,
      content: snapshot,
      metadata: { templateId },
      templateId,
    });

    if (dto.sendEmail) {
      if (template.channel !== ChannelType.EMAIL) {
        throw new BadRequestException('api.template.channel.not.email');
      }
      const emailChannel = lead.channels?.find(
        (channel) => channel.type === ChannelType.EMAIL,
      );
      if (!emailChannel) {
        throw new BadRequestException('api.lead.email.channel.required');
      }

      await this.mailService.sendMail(
        emailChannel.value,
        subject || template.title,
        body,
      );

      await this.timelineService.record({
        companyId,
        leadId,
        authorId: authUser.id,
        type: TimelineEventType.EMAIL_SENT,
        content: body,
        metadata: { subject, to: emailChannel.value },
      });
    }

    return {
      subject,
      body,
      timelineEventId: event.id,
    };
  }
}
