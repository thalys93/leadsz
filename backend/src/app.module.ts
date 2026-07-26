import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './config/orm.config';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { SeedingModule } from './seeding/seeding.module';
import { UserModule } from './user/user.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { CompanyModule } from './company/company.module';
import { LeadModule } from './lead/lead.module';
import { TimelineModule } from './timeline/timeline.module';
import { MessageTemplateModule } from './message-template/message-template.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmConfig(configService),
    }),
    FeatureFlagsModule,
    RolesModule,
    MailModule,
    AuthModule,
    StorageModule,
    UserModule,
    CompanyModule,
    LeadModule,
    TimelineModule,
    MessageTemplateModule,
    DashboardModule,
    SeedingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
