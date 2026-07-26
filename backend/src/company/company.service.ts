import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { Invitation } from './entities/invitation.entity';
import { toSlug } from 'src/helpers/slug';
import { CompanyRole } from 'src/enums/CompanyRole';
import { InvitationStatus } from 'src/enums/InvitationStatus';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { appConfig } from 'src/config/app.config';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async createCompany(name: string): Promise<Company> {
    const baseSlug = toSlug(name) || 'company';
    let slug = baseSlug;
    let suffix = 1;

    // ponytail: O(n) uniqueness scan; upgrade to DB unique retry if collisions spike
    while (await this.companyRepository.existsBy({ slug })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return this.companyRepository.save(
      this.companyRepository.create({ name: name.trim(), slug }),
    );
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('api.company.not.found');
    }
    return company;
  }

  private assertCompanyAdmin(authUser: AuthUser) {
    if (!authUser.companyId || authUser.companyRole !== CompanyRole.ADMIN) {
      throw new ForbiddenException('api.company.admin.required');
    }
  }

  async createInvitation(authUser: AuthUser, dto: CreateInvitationDto) {
    this.assertCompanyAdmin(authUser);

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.userService.findByEmailOrNull(email);
    if (existingUser?.companyId === authUser.companyId) {
      throw new ConflictException('api.invitation.user.already.member');
    }

    const pending = await this.invitationRepository.findOne({
      where: {
        companyId: authUser.companyId,
        email,
        status: InvitationStatus.PENDING,
      },
    });
    if (pending && pending.expiresAt > new Date()) {
      throw new ConflictException('api.invitation.already.pending');
    }

    const invitation = await this.invitationRepository.save(
      this.invitationRepository.create({
        companyId: authUser.companyId,
        email,
        token: randomUUID(),
        role: CompanyRole.MEMBER,
        status: InvitationStatus.PENDING,
        invitedById: authUser.id,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      }),
    );

    const company = await this.findById(authUser.companyId);
    const acceptUrl = `${appConfig.frontendUrl}/invite?token=${invitation.token}`;
    await this.mailService.sendInvitationMail(email, company.name, acceptUrl);

    this.logger.log(`Invitation created for ${email}`);
    return invitation;
  }

  async listInvitations(authUser: AuthUser) {
    this.assertCompanyAdmin(authUser);
    return this.invitationRepository.find({
      where: { companyId: authUser.companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async resendInvitation(authUser: AuthUser, invitationId: string) {
    this.assertCompanyAdmin(authUser);

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, companyId: authUser.companyId },
    });
    if (!invitation) {
      throw new NotFoundException('api.invitation.not.found');
    }

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.EXPIRED
    ) {
      throw new BadRequestException('api.invitation.cannot.resend');
    }

    const existingUser = await this.userService.findByEmailOrNull(
      invitation.email,
    );
    if (existingUser?.companyId === authUser.companyId) {
      throw new ConflictException('api.invitation.user.already.member');
    }

    invitation.token = randomUUID();
    invitation.status = InvitationStatus.PENDING;
    invitation.expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    await this.invitationRepository.save(invitation);

    const company = await this.findById(authUser.companyId);
    const acceptUrl = `${appConfig.frontendUrl}/invite?token=${invitation.token}`;
    await this.mailService.sendInvitationMail(
      invitation.email,
      company.name,
      acceptUrl,
    );

    this.logger.log(`Invitation resent for ${invitation.email}`);
    return invitation;
  }

  async cancelInvitation(authUser: AuthUser, invitationId: string) {
    this.assertCompanyAdmin(authUser);

    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, companyId: authUser.companyId },
    });
    if (!invitation) {
      throw new NotFoundException('api.invitation.not.found');
    }

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.EXPIRED
    ) {
      throw new BadRequestException('api.invitation.cannot.cancel');
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitationRepository.save(invitation);

    this.logger.log(`Invitation cancelled for ${invitation.email}`);
    return invitation;
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
      relations: ['company'],
    });

    if (!invitation) {
      throw new NotFoundException('api.invitation.not.found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('api.invitation.not.pending');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('api.invitation.expired');
    }

    let user = await this.userService.findByEmailOrNull(invitation.email);

    if (user) {
      if (user.companyId && user.companyId !== invitation.companyId) {
        throw new ConflictException('api.invitation.user.other.company');
      }
      await this.userService.attachToCompany(
        user.id,
        invitation.companyId,
        invitation.role,
      );
      user = await this.userService.findByIdWithRoles(user.id);
    } else {
      if (!dto.name?.trim() || !dto.password) {
        throw new BadRequestException('api.invitation.name.password.required');
      }
      user = await this.userService.create({
        name: dto.name.trim(),
        email: invitation.email,
        password: dto.password,
        companyId: invitation.companyId,
        companyRole: invitation.role,
      });
      user = await this.userService.findByIdWithRoles(user.id);
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return user;
  }
}
