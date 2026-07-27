import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ToggleCheckpointDto } from './dto/toggle-checkpoint.dto';
import { UpdateChannelsDto } from './dto/update-channels.dto';
import { SendLeadEmailDto } from './dto/send-lead-email.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';
import { User } from 'src/security/auth-user.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { PaginationHelper } from 'src/helpers/utils';
import { LeadStage } from 'src/enums/LeadStage';
import { ChannelType } from 'src/enums/ChannelType';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RolesDecorator(...USER_ROLES)
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar lead' })
  @ApiBody({ type: CreateLeadDto })
  create(@User() authUser: AuthUser, @Body() dto: CreateLeadDto) {
    return this.leadService.create(authUser, dto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar leads da company' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'stage', required: false, enum: LeadStage })
  @ApiQuery({ name: 'channel', required: false, enum: ChannelType })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'campo:ASC|DESC — nextActionAt, score, dealValue, createdAt',
  })
  findAll(
    @User() authUser: AuthUser,
    @PaginationHelper() { page, limit },
    @Query('stage') stage?: LeadStage,
    @Query('channel') channel?: ChannelType,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.leadService.paginate(
      authUser,
      { page, limit, route: '/leads' },
      { stage, channel, search, sort },
    );
  }

  @Get('suggestions')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Sugestões distintas de serviço e próxima ação da company',
  })
  suggestions(@User() authUser: AuthUser) {
    return this.leadService.suggestions(authUser);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Detalhe do lead' })
  @ApiParam({ name: 'id', type: String })
  findOne(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.leadService.findOne(authUser, id);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar lead' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateLeadDto })
  update(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadService.update(authUser, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remover lead' })
  @ApiParam({ name: 'id', type: String })
  remove(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.leadService.remove(authUser, id);
  }

  @Put(':id/checkpoints')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar/desmarcar checkpoint e recalcular score' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ToggleCheckpointDto })
  toggleCheckpoint(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleCheckpointDto,
  ) {
    return this.leadService.toggleCheckpoint(authUser, id, dto);
  }

  @Put(':id/channels')
  @HttpCode(200)
  @ApiOperation({ summary: 'Substituir canais de contato do lead' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateChannelsDto })
  updateChannels(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateChannelsDto,
  ) {
    return this.leadService.updateChannels(authUser, id, dto);
  }

  @Post(':id/emails/send')
  @HttpCode(200)
  @ApiOperation({ summary: 'Enviar e-mail ao lead via SMTP' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SendLeadEmailDto })
  sendEmail(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: SendLeadEmailDto,
  ) {
    return this.leadService.sendEmail(authUser, id, dto);
  }
}
