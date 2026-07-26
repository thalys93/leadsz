import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
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
import { MessageTemplateService } from './message-template.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { GenerateLibraryTemplateDto } from './dto/generate-library-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';
import { User } from 'src/security/auth-user.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RolesDecorator(...USER_ROLES)
@Controller('templates')
export class MessageTemplateController {
  constructor(private readonly templateService: MessageTemplateService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar template' })
  @ApiBody({ type: CreateMessageTemplateDto })
  create(@User() authUser: AuthUser, @Body() dto: CreateMessageTemplateDto) {
    return this.templateService.create(authUser, dto);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Gerar rascunho de template reutilizável via Groq (com [[placeholders]])',
  })
  @ApiBody({ type: GenerateLibraryTemplateDto })
  generateLibrary(
    @User() authUser: AuthUser,
    @Body() dto: GenerateLibraryTemplateDto,
  ) {
    return this.templateService.generateLibraryDraft(authUser, dto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar biblioteca de templates da company' })
  @ApiQuery({ name: 'channel', required: false, enum: ChannelType })
  @ApiQuery({ name: 'purpose', required: false, enum: TemplatePurpose })
  @ApiQuery({ name: 'leadId', required: false, type: String })
  findAll(
    @User() authUser: AuthUser,
    @Query('channel') channel?: ChannelType,
    @Query('purpose') purpose?: TemplatePurpose,
    @Query('leadId') leadId?: string,
  ) {
    return this.templateService.findAll(authUser, {
      channel,
      purpose,
      leadId,
    });
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Detalhe do template' })
  @ApiParam({ name: 'id', type: String })
  findOne(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.templateService.findOne(authUser, id);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateMessageTemplateDto })
  update(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templateService.update(authUser, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remover template' })
  @ApiParam({ name: 'id', type: String })
  remove(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.templateService.remove(authUser, id);
  }
}

@ApiTags('Lead Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RolesDecorator(...USER_ROLES)
@Controller('leads/:leadId/templates')
export class LeadTemplateController {
  constructor(private readonly templateService: MessageTemplateService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar templates vinculados a este lead' })
  @ApiParam({ name: 'leadId', type: String })
  findByLead(@User() authUser: AuthUser, @Param('leadId') leadId: string) {
    return this.templateService.findByLead(authUser, leadId);
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gerar rascunho de template via Groq' })
  @ApiParam({ name: 'leadId', type: String })
  @ApiBody({ type: GenerateTemplateDto })
  generate(
    @User() authUser: AuthUser,
    @Param('leadId') leadId: string,
    @Body() dto: GenerateTemplateDto,
  ) {
    return this.templateService.generateDraft(authUser, leadId, dto);
  }

  @Post(':templateId/use')
  @HttpCode(200)
  @ApiOperation({ summary: 'Usar template no lead (registra na timeline)' })
  @ApiParam({ name: 'leadId', type: String })
  @ApiParam({ name: 'templateId', type: String })
  @ApiBody({ type: UseTemplateDto })
  use(
    @User() authUser: AuthUser,
    @Param('leadId') leadId: string,
    @Param('templateId') templateId: string,
    @Body() dto: UseTemplateDto,
  ) {
    return this.templateService.useTemplate(authUser, leadId, templateId, dto);
  }
}
