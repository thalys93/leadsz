import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { ContactChannel } from './entities/contact-channel.entity';
import { Service } from 'src/service/entities/service.entity';
import { CreateLeadDto, CreateLeadChannelDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ToggleCheckpointDto } from './dto/toggle-checkpoint.dto';
import { UpdateChannelsDto } from './dto/update-channels.dto';
import { SendLeadEmailDto } from './dto/send-lead-email.dto';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { ChannelType } from 'src/enums/ChannelType';
import { LeadStage } from 'src/enums/LeadStage';
import { CHECKPOINT_POINTS } from 'src/enums/CheckpointKey';
import { TimelineEventType } from 'src/enums/TimelineEventType';
import { computeLeadScore, computeLeadTemperature } from './lead-score';
import { TimelineService } from 'src/timeline/timeline.service';
import { MailService } from 'src/mail/mail.service';

export type LeadListFilters = {
  stage?: LeadStage;
  channel?: ChannelType;
  search?: string;
  sort?: string;
};

const SORTABLE_FIELDS = new Set([
  'nextActionAt',
  'score',
  'dealValue',
  'createdAt',
]);

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(ContactChannel)
    private readonly channelRepository: Repository<ContactChannel>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly timelineService: TimelineService,
    private readonly mailService: MailService,
  ) {}

  private requireCompanyId(authUser: AuthUser): string {
    if (!authUser.companyId) {
      throw new ForbiddenException('api.company.required');
    }
    return authUser.companyId;
  }

  private async resolveCatalogService(
    companyId: string,
    serviceId: string | null | undefined,
  ): Promise<Service | null> {
    if (serviceId == null) return null;
    const catalog = await this.serviceRepository.findOne({
      where: { id: serviceId, companyId },
    });
    if (!catalog) {
      throw new NotFoundException('api.service.not.found');
    }
    return catalog;
  }

  private uniqueChannels(channels: CreateLeadChannelDto[] = []) {
    const byType = new Map<ChannelType, string>();
    for (const channel of channels) {
      const value = channel.value?.trim();
      if (!value) continue;
      byType.set(channel.type, value);
    }
    return [...byType.entries()].map(([type, value]) => ({ type, value }));
  }

  private toResponse(lead: Lead) {
    return { ...lead, temperature: computeLeadTemperature(lead.score) };
  }

  private async requireLead(
    companyId: string,
    id: string,
    relations: string[] = ['channels', 'owner'],
  ) {
    const lead = await this.leadRepository.findOne({
      where: { id, companyId },
      relations,
    });
    if (!lead) {
      throw new NotFoundException('api.lead.not.found');
    }
    return lead;
  }

  async create(authUser: AuthUser, dto: CreateLeadDto) {
    const companyId = this.requireCompanyId(authUser);
    const channels = this.uniqueChannels(dto.channels);
    const catalog = await this.resolveCatalogService(companyId, dto.serviceId);
    const serviceName = catalog?.name ?? dto.service?.trim() ?? '';
    if (!serviceName) {
      throw new BadRequestException('api.lead.service.required');
    }

    const lead = this.leadRepository.create({
      companyId,
      ownerId: dto.ownerId ?? authUser.id,
      contactName: dto.contactName.trim(),
      companyName: dto.companyName?.trim() || null,
      primaryChannel: dto.primaryChannel,
      serviceId: catalog?.id ?? null,
      service: serviceName,
      dealValue: dto.dealValue != null ? String(dto.dealValue) : null,
      stage: dto.stage ?? LeadStage.LEAD,
      nextAction: dto.nextAction?.trim() || null,
      nextActionAt: dto.nextActionAt ?? null,
      notes: dto.notes?.trim() || null,
      checkpoints: {},
      score: 0,
      channels: channels.map((channel) =>
        this.channelRepository.create(channel),
      ),
    });

    const saved = await this.leadRepository.save(lead);
    return this.findOne(authUser, saved.id);
  }

  async paginate(
    authUser: AuthUser,
    options: IPaginationOptions,
    filters: LeadListFilters = {},
  ) {
    const companyId = this.requireCompanyId(authUser);
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));

    const applyFilters = (
      qb: ReturnType<Repository<Lead>['createQueryBuilder']>,
    ) => {
      if (filters.stage) {
        qb.andWhere('lead.stage = :stage', { stage: filters.stage });
      }
      if (filters.channel) {
        qb.andWhere('lead.primaryChannel = :channel', {
          channel: filters.channel,
        });
      }
      if (filters.search?.trim()) {
        qb.andWhere(
          '(lead.contactName ILIKE :search OR lead.companyName ILIKE :search OR lead.service ILIKE :search)',
          { search: `%${filters.search.trim()}%` },
        );
      }
      return qb;
    };

    const countQb = applyFilters(
      this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.companyId = :companyId', { companyId }),
    );

    const [fieldRaw, dirRaw] = (filters.sort || 'nextActionAt:ASC').split(':');
    const field = SORTABLE_FIELDS.has(fieldRaw) ? fieldRaw : 'nextActionAt';
    const dir = dirRaw?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const dataQb = applyFilters(
      this.leadRepository
        .createQueryBuilder('lead')
        .leftJoinAndSelect('lead.channels', 'channels')
        .leftJoinAndSelect('lead.owner', 'owner')
        .where('lead.companyId = :companyId', { companyId }),
    )
      .orderBy(`lead.${field}`, dir)
      .skip((page - 1) * limit)
      .take(limit);

    const [items, totalItems] = await Promise.all([
      dataQb.getMany(),
      countQb.getCount(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit) || 0,
        currentPage: page,
      },
    };
  }

  async suggestions(authUser: AuthUser) {
    const companyId = this.requireCompanyId(authUser);

    const recentDistinct = async (column: 'service' | 'nextAction') => {
      const rows = await this.leadRepository
        .createQueryBuilder('lead')
        .select(`lead.${column}`, 'value')
        .addSelect('MAX(lead.updatedAt)', 'lastUsed')
        .where('lead.companyId = :companyId', { companyId })
        .andWhere(`lead.${column} IS NOT NULL`)
        .andWhere(`lead.${column} != ''`)
        .groupBy(`lead.${column}`)
        .orderBy('"lastUsed"', 'DESC')
        .limit(50)
        .getRawMany<{ value: string }>();
      return rows.map((row) => row.value).filter(Boolean);
    };

    const [services, nextActions] = await Promise.all([
      recentDistinct('service'),
      recentDistinct('nextAction'),
    ]);

    return { services, nextActions };
  }

  async findOne(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, id);
    return this.toResponse(lead);
  }

  async update(authUser: AuthUser, id: string, dto: UpdateLeadDto) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, id, ['channels']);

    if (dto.contactName !== undefined) {
      lead.contactName = dto.contactName.trim();
    }
    if (dto.companyName !== undefined) {
      lead.companyName = dto.companyName?.trim() || null;
    }
    if (dto.primaryChannel !== undefined) {
      lead.primaryChannel = dto.primaryChannel;
    }
    if (dto.serviceId !== undefined) {
      const catalog = await this.resolveCatalogService(
        companyId,
        dto.serviceId,
      );
      lead.serviceId = catalog?.id ?? null;
      if (catalog) {
        lead.service = catalog.name;
      } else if (dto.service !== undefined) {
        lead.service = dto.service.trim();
      }
    } else if (dto.service !== undefined) {
      lead.service = dto.service.trim();
    }
    if (dto.dealValue !== undefined) {
      lead.dealValue = dto.dealValue != null ? String(dto.dealValue) : null;
    }
    if (dto.nextAction !== undefined) {
      lead.nextAction = dto.nextAction?.trim() || null;
    }
    if (dto.nextActionAt !== undefined) {
      lead.nextActionAt = dto.nextActionAt ?? null;
    }
    if (dto.notes !== undefined) {
      lead.notes = dto.notes?.trim() || null;
    }
    if (dto.ownerId !== undefined) {
      lead.ownerId = dto.ownerId;
    }
    if (dto.channels !== undefined) {
      const next = this.uniqueChannels(dto.channels);
      await this.channelRepository.delete({ leadId: lead.id });
      lead.channels = next.map((channel) =>
        this.channelRepository.create({ leadId: lead.id, ...channel }),
      );
    }

    const stageChanged = dto.stage !== undefined && dto.stage !== lead.stage;
    const fromStage = lead.stage;
    if (stageChanged) {
      lead.stage = dto.stage!;
    }

    await this.leadRepository.save(lead);

    if (stageChanged) {
      await this.timelineService.record({
        companyId,
        leadId: lead.id,
        authorId: authUser.id,
        type: TimelineEventType.STAGE_CHANGE,
        content: `Stage alterado de ${fromStage} para ${lead.stage}`,
        metadata: { fromStage, toStage: lead.stage },
      });
    }

    return this.findOne(authUser, id);
  }

  async remove(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    await this.requireLead(companyId, id, []);
    await this.leadRepository.delete({ id, companyId });
    return { message: 'api.lead.deleted', leadId: id };
  }

  async toggleCheckpoint(
    authUser: AuthUser,
    id: string,
    dto: ToggleCheckpointDto,
  ) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, id, []);

    const scoreBefore = lead.score;
    lead.checkpoints = { ...lead.checkpoints, [dto.key]: dto.checked };
    lead.score = computeLeadScore(lead.checkpoints);
    await this.leadRepository.save(lead);

    const pointsDelta = dto.checked
      ? CHECKPOINT_POINTS[dto.key]
      : -CHECKPOINT_POINTS[dto.key];

    await this.timelineService.record({
      companyId,
      leadId: lead.id,
      authorId: authUser.id,
      type: TimelineEventType.CHECKPOINT,
      content: `Checkpoint ${dto.key} ${dto.checked ? 'marcado' : 'desmarcado'}`,
      metadata: {
        checkpointKey: dto.key,
        checked: dto.checked,
        pointsDelta,
        scoreBefore,
        scoreAfter: lead.score,
      },
    });

    return this.findOne(authUser, id);
  }

  async updateChannels(authUser: AuthUser, id: string, dto: UpdateChannelsDto) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, id, []);

    const next = this.uniqueChannels(dto.channels);
    await this.channelRepository.delete({ leadId: lead.id });
    await this.channelRepository.save(
      next.map((channel) =>
        this.channelRepository.create({ leadId: lead.id, ...channel }),
      ),
    );

    return this.findOne(authUser, id);
  }

  async sendEmail(authUser: AuthUser, id: string, dto: SendLeadEmailDto) {
    const companyId = this.requireCompanyId(authUser);
    const lead = await this.requireLead(companyId, id, ['channels']);

    const to =
      dto.to ??
      lead.channels?.find((channel) => channel.type === ChannelType.EMAIL)
        ?.value;
    if (!to) {
      throw new BadRequestException('api.lead.email.channel.required');
    }

    try {
      await this.mailService.sendMail(to, dto.subject, dto.body);
    } catch {
      throw new BadGatewayException('api.mail.send.failed');
    }

    await this.timelineService.record({
      companyId,
      leadId: lead.id,
      authorId: authUser.id,
      type: TimelineEventType.EMAIL_SENT,
      content: dto.body,
      metadata: { subject: dto.subject, to },
    });

    return { message: 'api.lead.email.sent', to };
  }
}
