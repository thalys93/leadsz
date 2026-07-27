import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';

export class GenerateTemplateDto {
  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel: ChannelType;

  @ApiProperty({ enum: TemplatePurpose })
  @IsEnum(TemplatePurpose)
  purpose: TemplatePurpose;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentSubject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentBody?: string;

  @ApiPropertyOptional({ example: 'Já enviei proposta na segunda' })
  @IsOptional()
  @IsString()
  extraContext?: string;
}
