import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UseTemplateDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
