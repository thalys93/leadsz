import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendLeadEmailDto {
  @ApiProperty({ example: 'Proposta comercial' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Olá Ana, segue a proposta combinada...' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'ana@acme.com' })
  @IsOptional()
  @IsEmail()
  to?: string;
}
