import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { ContactChannel } from './entities/contact-channel.entity';
import { Service } from 'src/service/entities/service.entity';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { TimelineModule } from 'src/timeline/timeline.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, ContactChannel, Service]),
    TimelineModule,
    MailModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
