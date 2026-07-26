import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TestMailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  NOTIFICATION = 'notification',
}

export class SendTestMailDto {
  @ApiProperty({ example: 'voce@empresa.com' })
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @ApiProperty({ enum: TestMailTemplate })
  @IsEnum(TestMailTemplate)
  template: TestMailTemplate;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Notificação de teste' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Este é um e-mail de teste do Leadz.' })
  @IsOptional()
  @IsString()
  message?: string;
}
