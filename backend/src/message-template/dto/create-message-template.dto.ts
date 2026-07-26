import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';

export class CreateMessageTemplateDto {
  @ApiProperty({ example: 'Primeiro contato LinkedIn' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty({ enum: TemplatePurpose })
  @IsEnum(TemplatePurpose)
  purpose: TemplatePurpose;

  @ApiPropertyOptional({ example: 'Proposta comercial' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Olá [[contactName]], tudo bem?' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @ApiPropertyOptional({
    description: 'Vincula o template a um lead específico',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}
