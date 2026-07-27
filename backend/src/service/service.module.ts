import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Company } from 'src/company/entities/company.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { PublicServiceController } from './public-service.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Company, Lead])],
  controllers: [ServiceController, PublicServiceController],
  providers: [ServiceService],
  exports: [ServiceService, TypeOrmModule],
})
export class ServiceModule {}
