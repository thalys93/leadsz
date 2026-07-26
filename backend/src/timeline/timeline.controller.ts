import {
  Body,
  Controller,
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
import { TimelineService } from './timeline.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';
import { User } from 'src/security/auth-user.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';

@ApiTags('Timeline')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RolesDecorator(...USER_ROLES)
@Controller('leads/:leadId/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar timeline do lead (mais recentes primeiro)' })
  @ApiParam({ name: 'leadId', type: String })
  list(@User() authUser: AuthUser, @Param('leadId') leadId: string) {
    return this.timelineService.list(authUser, leadId);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar nota na timeline do lead' })
  @ApiParam({ name: 'leadId', type: String })
  @ApiBody({ type: CreateNoteDto })
  createNote(
    @User() authUser: AuthUser,
    @Param('leadId') leadId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.timelineService.createNote(authUser, leadId, dto);
  }
}
