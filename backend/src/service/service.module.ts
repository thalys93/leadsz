import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Lead])],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService, TypeOrmModule],
})
export class ServiceModule {}
