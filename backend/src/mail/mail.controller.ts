import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MailService } from './mail.service';
import { SendTestMailDto, TestMailTemplate } from './dto/send-test-mail.dto';
import { RolesGuard } from 'src/security/roles.guard';
import { RolesDecorator } from 'src/security/roles.decorator';
import { USER_ROLES } from 'src/enums/RoleGroups';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @RolesDecorator(...USER_ROLES)
  @ApiOperation({ summary: 'Enviar e-mail de teste (templates do sistema)' })
  @ApiBody({ type: SendTestMailDto })
  async sendTest(@Body() dto: SendTestMailDto) {
    switch (dto.template) {
      case TestMailTemplate.WELCOME:
        await this.mailService.sendWelcomeMail(dto.to);
        break;
      case TestMailTemplate.PASSWORD_RESET:
        await this.mailService.sendPasswordResetMail(
          dto.to,
          dto.code || '123456',
        );
        break;
      case TestMailTemplate.NOTIFICATION:
        await this.mailService.sendNotificationMail(
          dto.to,
          dto.title || 'Notificação de teste',
          dto.message || 'Este é um e-mail de teste do Leadz.',
        );
        break;
    }

    return { message: 'E-mail enviado' };
  }
}
