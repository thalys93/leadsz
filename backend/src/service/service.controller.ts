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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';
import { User } from 'src/security/auth-user.decorator';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@RolesDecorator(...USER_ROLES)
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar serviço no catálogo' })
  @ApiBody({ type: CreateServiceDto })
  create(@User() authUser: AuthUser, @Body() dto: CreateServiceDto) {
    return this.serviceService.create(authUser, dto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Listar serviços da company' })
  @ApiQuery({
    name: 'active',
    required: false,
    description: 'true | false | all (omitido = all)',
  })
  findAll(@User() authUser: AuthUser, @Query('active') active?: string) {
    return this.serviceService.findAll(authUser, active);
  }

  @Get(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Detalhe do serviço' })
  @ApiParam({ name: 'id', type: String })
  findOne(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.serviceService.findOne(authUser, id);
  }

  @Patch(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateServiceDto })
  update(
    @User() authUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.serviceService.update(authUser, id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Desativar serviço (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  remove(@User() authUser: AuthUser, @Param('id') id: string) {
    return this.serviceService.remove(authUser, id);
  }
}
