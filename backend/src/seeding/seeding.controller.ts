import { AuthGuard } from '@nestjs/passport';
import { Controller, UseGuards } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/security/roles.guard';

@ApiTags('Seeding Routes Protected')
@ApiBearerAuth()
@Controller('system/utils/seeding')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SeedingControllerProtected {
  constructor(private readonly seedingService: SeedingService) {}
}
