import { Controller, Get, HttpCode, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ServiceService } from './service.service';

@ApiTags('Public Services')
@Controller('public/companies/:slug/services')
export class PublicServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Listar serviços ativos públicos da company (por slug)',
  })
  @ApiParam({ name: 'slug', type: String, example: 'thalysdev' })
  findPublicByCompanySlug(@Param('slug') slug: string) {
    return this.serviceService.findPublicByCompanySlug(slug);
  }
}
