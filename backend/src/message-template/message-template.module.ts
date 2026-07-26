import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageTemplate } from './entities/message-template.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { MessageTemplateService } from './message-template.service';
import {
  LeadTemplateController,
  MessageTemplateController,
} from './message-template.controller';
import { GroqClient } from './groq.client';
import { TimelineModule } from 'src/timeline/timeline.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplate, Lead]),
    TimelineModule,
    MailModule,
  ],
  controllers: [MessageTemplateController, LeadTemplateController],
  providers: [MessageTemplateService, GroqClient],
  exports: [MessageTemplateService],
})
export class MessageTemplateModule {}
