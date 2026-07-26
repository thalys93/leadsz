import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from 'src/lead/entities/lead.entity';
import { TimelineEvent } from './entities/timeline-event.entity';
import { TimelineEventType } from 'src/enums/TimelineEventType';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { CreateNoteDto } from './dto/create-note.dto';

export type RecordEventInput = {
  companyId: string;
  leadId: string;
  authorId: string;
  type: TimelineEventType;
  content: string;
  metadata?: Record<string, unknown> | null;
  templateId?: string | null;
};

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private readonly timelineRepository: Repository<TimelineEvent>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
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
    });
    if (!lead) {
      throw new NotFoundException('api.lead.not.found');
    }
    return lead;
  }

  async record(input: RecordEventInput): Promise<TimelineEvent> {
    return this.timelineRepository.save(
      this.timelineRepository.create({
        leadId: input.leadId,
        companyId: input.companyId,
        type: input.type,
        content: input.content,
        metadata: input.metadata ?? null,
        templateId: input.templateId ?? null,
        authorId: input.authorId,
      }),
    );
  }

  async list(authUser: AuthUser, leadId: string) {
    const companyId = this.requireCompanyId(authUser);
    await this.requireLead(companyId, leadId);

    return this.timelineRepository.find({
      where: { leadId, companyId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async recent(companyId: string, leadId: string, limit: number) {
    return this.timelineRepository.find({
      where: { leadId, companyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async createNote(authUser: AuthUser, leadId: string, dto: CreateNoteDto) {
    const companyId = this.requireCompanyId(authUser);
    await this.requireLead(companyId, leadId);

    return this.record({
      companyId,
      leadId,
      authorId: authUser.id,
      type: TimelineEventType.NOTE,
      content: dto.content.trim(),
    });
  }
}
