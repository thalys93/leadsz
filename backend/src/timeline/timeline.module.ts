import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from 'src/lead/entities/lead.entity';
import { TimelineEvent } from './entities/timeline-event.entity';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TimelineEvent, Lead])],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
