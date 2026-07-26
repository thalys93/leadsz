import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Methods } from 'src/enums/Methods';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { ADMIN_ROLES } from 'src/enums/RoleGroups';

@ApiTags('User Roles Routes Protected')
@ApiBearerAuth()
@Controller('security/roles/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesControllerProtected {
  constructor(private readonly rolesService: RolesService) {}

  @RolesDecorator(...ADMIN_ROLES)
  @Post(`${Methods.CREATE}`)
  @HttpCode(201)
  @ApiOperation({
    summary: 'Criar novo papel/função',
    description:
      'Cria um novo papel/função no sistema. Apenas administradores podem executar esta ação.',
  })
  @ApiBody({
    type: CreateRoleDto,
    description: 'Dados do papel/função a ser criado',
    examples: {
      example1: {
        summary: 'Exemplo de criação de papel',
        value: {
          name: 'moderator',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Papel/função criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'moderator' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para executar esta ação',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @RolesDecorator(...ADMIN_ROLES)
  @Patch(`${Methods.UPDATE}/:id`)
  @HttpCode(202)
  @ApiOperation({
    summary: 'Atualizar papel/função',
    description:
      'Atualiza um papel/função existente no sistema. Apenas administradores podem executar esta ação.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do papel/função a ser atualizado',
    type: 'string',
    example: '1',
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: 'Dados do papel/função a ser atualizado',
    examples: {
      example1: {
        summary: 'Exemplo de atualização de papel',
        value: {
          name: 'super-moderator',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Papel/função atualizado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para executar esta ação',
  })
  @ApiResponse({
    status: 404,
    description: 'Papel/função não encontrado',
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @RolesDecorator(...ADMIN_ROLES)
  @Delete(`${Methods.DELETE}/:id`)
  @HttpCode(202)
  @ApiOperation({
    summary: 'Remover papel/função',
    description:
      'Remove um papel/função do sistema. Apenas administradores podem executar esta ação.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do papel/função a ser removido',
    type: 'string',
    example: '1',
  })
  @ApiResponse({
    status: 202,
    description: 'Papel/função removido com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para executar esta ação',
  })
  @ApiResponse({
    status: 404,
    description: 'Papel/função não encontrado',
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}

@ApiTags('User Roles Routes Unprotected')
@ApiBearerAuth()
@Controller('security/roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesControllerUnprotected {
  constructor(private readonly rolesService: RolesService) {}

  @RolesDecorator(...ADMIN_ROLES)
  @Get('')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Listar papéis/funções',
    description:
      'Retorna uma lista paginada de todos os papéis/funções disponíveis no sistema.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número da página para paginação',
    type: Number,
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de itens por página (máximo 100)',
    type: Number,
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de papéis/funções retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'admin' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            totalItems: { type: 'number', example: 50 },
            itemCount: { type: 'number', example: 10 },
            itemsPerPage: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 },
            currentPage: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para executar esta ação',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number = 10,
  ) {
    limit = limit > 100 ? 100 : limit;
    return this.rolesService.paginate({
      page,
      limit,
      route: '/',
    });
  }

  @RolesDecorator(...ADMIN_ROLES)
  @Get(`:id`)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Buscar papel/função por ID',
    description:
      'Retorna os detalhes de um papel/função específico pelo seu ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do papel/função a ser buscado',
    type: 'string',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Papel/função encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'admin' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para executar esta ação',
  })
  @ApiResponse({
    status: 404,
    description: 'Papel/função não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }
}
