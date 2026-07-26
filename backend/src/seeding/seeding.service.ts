import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Roles } from 'src/enums/Roles';
import { Role } from 'src/roles/entities/role.entity';
import { DataSource } from 'typeorm';
import { FeatureFlagsService } from 'src/feature-flags/feature-flags.service';

@Injectable()
export class SeedingService implements OnModuleInit {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async onModuleInit() {
    if (!this.featureFlags.isEnabled('seeding')) {
      this.logger.log('Seeding desabilitado (FEATURE_SEEDING=false)');
      return;
    }
    await this.createRoles();
  }

  async createRoles() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const rolesRepository = queryRunner.manager.getRepository(Role);
      const rolesToSeed = Object.values(Roles);

      for (const role of rolesToSeed) {
        const existingRole = await rolesRepository.findOneBy({
          name: role,
        });

        if (!existingRole) {
          await rolesRepository.insert({ name: role });
          this.logger.verbose(`Inserted role: ${role}`);
        } else {
          this.logger.warn(`Role already exists: ${role}`);
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log('Roles seeded successfully!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to seed roles', (error as Error).stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
