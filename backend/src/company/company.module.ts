import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Invitation } from './entities/invitation.entity';
import { CompanyService } from './company.service';
import { InvitationController } from './company.controller';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Invitation]),
    UserModule,
    MailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [InvitationController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
