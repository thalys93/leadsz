import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';
import { User } from 'src/security/auth-user.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RolesDecorator(...USER_ROLES)
  @ApiOperation({ summary: 'Criar convite (ADMIN da company)' })
  @ApiBody({ type: CreateInvitationDto })
  create(@User() authUser: AuthUser, @Body() dto: CreateInvitationDto) {
    return this.companyService.createInvitation(authUser, dto);
  }

  @Get()
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RolesDecorator(...USER_ROLES)
  @ApiOperation({ summary: 'Listar convites da company (ADMIN)' })
  list(@User() authUser: AuthUser) {
    return this.companyService.listInvitations(authUser);
  }

  @Post('accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceitar convite e autenticar' })
  @ApiBody({ type: AcceptInvitationDto })
  async accept(@Body() dto: AcceptInvitationDto) {
    const user = await this.companyService.acceptInvitation(dto);
    return this.authService.buildAuthResponse(user);
  }

  @Post(':id/resend')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RolesDecorator(...USER_ROLES)
  @ApiOperation({ summary: 'Reenviar convite (ADMIN da company)' })
  @ApiParam({ name: 'id', type: String })
  resend(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.companyService.resendInvitation(authUser, id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RolesDecorator(...USER_ROLES)
  @ApiOperation({ summary: 'Cancelar convite (ADMIN da company)' })
  @ApiParam({ name: 'id', type: String })
  cancel(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.companyService.cancelInvitation(authUser, id);
  }
}
