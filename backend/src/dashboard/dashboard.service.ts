import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from 'src/lead/entities/lead.entity';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { LeadStage } from 'src/enums/LeadStage';

const HOT_STUCK_STAGES = [
  LeadStage.LEAD,
  LeadStage.CONTATADO,
  LeadStage.PROPOSTA,
];
const HOT_STUCK_MIN_SCORE = 70;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  private requireCompanyId(authUser: AuthUser): string {
    if (!authUser.companyId) {
      throw new ForbiddenException('api.company.required');
    }
    return authUser.companyId;
  }

  async summary(authUser: AuthUser) {
    const companyId = this.requireCompanyId(authUser);
    const leads = await this.leadRepository.find({
      where: { companyId },
      select: ['id', 'stage', 'score', 'dealValue', 'nextActionAt'],
    });

    const byStage = Object.fromEntries(
      Object.values(LeadStage).map((stage) => [stage, 0]),
    ) as Record<LeadStage, number>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueNextAction = 0;
    let hotStuck = 0;
    let pipelineValue = 0;

    for (const lead of leads) {
      byStage[lead.stage] += 1;

      if (
        lead.nextActionAt &&
        new Date(lead.nextActionAt) < today &&
        lead.stage !== LeadStage.PAGO &&
        lead.stage !== LeadStage.PERDIDO
      ) {
        overdueNextAction += 1;
      }

      if (
        lead.score >= HOT_STUCK_MIN_SCORE &&
        HOT_STUCK_STAGES.includes(lead.stage)
      ) {
        hotStuck += 1;
      }

      if (
        lead.dealValue &&
        lead.stage !== LeadStage.PERDIDO &&
        lead.stage !== LeadStage.PAGO
      ) {
        pipelineValue += Number(lead.dealValue);
      }
    }

    return { byStage, overdueNextAction, hotStuck, pipelineValue };
  }
}
