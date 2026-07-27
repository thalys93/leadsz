import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { Company } from 'src/company/entities/company.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import {
  parsePrice,
  pricesAreOrdered,
  toPriceString,
} from './service-price';

export type PublicService = {
  id: string;
  name: string;
  scopeIn: string | null;
  typicalDeadline: string | null;
  minPrice: string | null;
  idealPrice: string | null;
};

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  private requireCompanyId(authUser: AuthUser): string {
    if (!authUser.companyId) {
      throw new ForbiddenException('api.company.required');
    }
    return authUser.companyId;
  }

  private async requireService(companyId: string, id: string) {
    const service = await this.serviceRepository.findOne({
      where: { id, companyId },
    });
    if (!service) {
      throw new NotFoundException('api.service.not.found');
    }
    return service;
  }

  private assertAnchors(
    minPrice: number | null | undefined,
    idealPrice: number | null | undefined,
    maxPrice: number | null | undefined,
  ) {
    if (!pricesAreOrdered(minPrice, idealPrice, maxPrice)) {
      throw new BadRequestException('api.service.price.order.invalid');
    }
  }

  private async assertUniqueName(
    companyId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.serviceRepository.findOne({
      where: excludeId
        ? { companyId, name, id: Not(excludeId) }
        : { companyId, name },
    });
    if (existing) {
      throw new ConflictException('api.service.name.exists');
    }
  }

  private async assertUniqueTranslateKey(
    companyId: string,
    translateKey: string,
    excludeId?: string,
  ) {
    const existing = await this.serviceRepository.findOne({
      where: excludeId
        ? { companyId, translateKey, id: Not(excludeId) }
        : { companyId, translateKey },
    });
    if (existing) {
      throw new ConflictException('api.service.translateKey.exists');
    }
  }

  async create(authUser: AuthUser, dto: CreateServiceDto) {
    const companyId = this.requireCompanyId(authUser);
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('api.service.name.required');
    }

    const translateKey = dto.translateKey?.trim() || null;

    this.assertAnchors(dto.minPrice, dto.idealPrice, dto.maxPrice);
    await this.assertUniqueName(companyId, name);
    if (translateKey) {
      await this.assertUniqueTranslateKey(companyId, translateKey);
    }

    return this.serviceRepository.save(
      this.serviceRepository.create({
        companyId,
        name,
        translateKey,
        icon: dto.icon?.trim() || null,
        minPrice: toPriceString(dto.minPrice),
        idealPrice: toPriceString(dto.idealPrice),
        maxPrice: toPriceString(dto.maxPrice),
        scopeIn: dto.scopeIn?.trim() || null,
        scopeOut: dto.scopeOut?.trim() || null,
        typicalDeadline: dto.typicalDeadline?.trim() || null,
        active: dto.active ?? true,
      }),
    );
  }

  async findAll(authUser: AuthUser, active?: string) {
    const companyId = this.requireCompanyId(authUser);
    const where: { companyId: string; active?: boolean } = { companyId };

    if (active === 'true') where.active = true;
    else if (active === 'false') where.active = false;

    return this.serviceRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findPublicByCompanySlug(slug: string): Promise<PublicService[]> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      throw new NotFoundException('api.company.not.found');
    }

    const company = await this.companyRepository.findOne({
      where: { slug: normalized },
    });
    if (!company) {
      throw new NotFoundException('api.company.not.found');
    }

    const services = await this.serviceRepository.find({
      where: { companyId: company.id, active: true },
      order: { name: 'ASC' },
      select: {
        id: true,
        name: true,
        scopeIn: true,
        typicalDeadline: true,
        minPrice: true,
        idealPrice: true,
      },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
      scopeIn: service.scopeIn,
      typicalDeadline: service.typicalDeadline,
      minPrice: service.minPrice,
      idealPrice: service.idealPrice,
    }));
  }

  async findOne(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    return this.requireService(companyId, id);
  }

  async update(authUser: AuthUser, id: string, dto: UpdateServiceDto) {
    const companyId = this.requireCompanyId(authUser);
    const service = await this.requireService(companyId, id);

    const nextMin =
      dto.minPrice !== undefined
        ? dto.minPrice
        : parsePrice(service.minPrice);
    const nextIdeal =
      dto.idealPrice !== undefined
        ? dto.idealPrice
        : parsePrice(service.idealPrice);
    const nextMax =
      dto.maxPrice !== undefined
        ? dto.maxPrice
        : parsePrice(service.maxPrice);

    this.assertAnchors(nextMin, nextIdeal, nextMax);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('api.service.name.required');
      }
      if (name !== service.name) {
        await this.assertUniqueName(companyId, name, id);
        service.name = name;
        await this.leadRepository.update(
          { companyId, serviceId: id },
          { service: name },
        );
      }
    }

    if (dto.icon !== undefined) {
      service.icon = dto.icon?.trim() || null;
    }

    if (dto.minPrice !== undefined) {
      service.minPrice = toPriceString(dto.minPrice);
    }
    if (dto.idealPrice !== undefined) {
      service.idealPrice = toPriceString(dto.idealPrice);
    }
    if (dto.maxPrice !== undefined) {
      service.maxPrice = toPriceString(dto.maxPrice);
    }
    if (dto.scopeIn !== undefined) {
      service.scopeIn = dto.scopeIn?.trim() || null;
    }
    if (dto.scopeOut !== undefined) {
      service.scopeOut = dto.scopeOut?.trim() || null;
    }
    if (dto.typicalDeadline !== undefined) {
      service.typicalDeadline = dto.typicalDeadline?.trim() || null;
    }
    if (dto.active !== undefined) {
      service.active = dto.active;
    }

    return this.serviceRepository.save(service);
  }

  async remove(authUser: AuthUser, id: string) {
    const companyId = this.requireCompanyId(authUser);
    const service = await this.requireService(companyId, id);
    service.active = false;
    await this.serviceRepository.save(service);
    return { message: 'api.service.deactivated', serviceId: id };
  }
}
