import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from 'src/lead/entities/lead.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lead])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
