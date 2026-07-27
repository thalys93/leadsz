import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Landing page' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'LayoutTemplate' })
  @IsOptional()
  @IsString()
  icon?: string | null;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number | null;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  idealPrice?: number | null;

  @ApiPropertyOptional({ example: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number | null;

  @ApiPropertyOptional({ example: 'Hero, 3 seções, formulário, deploy' })
  @IsOptional()
  @IsString()
  scopeIn?: string | null;

  @ApiPropertyOptional({ example: 'Copy longa, SEO avançado, blog' })
  @IsOptional()
  @IsString()
  scopeOut?: string | null;

  @ApiPropertyOptional({ example: '5–7 dias úteis' })
  @IsOptional()
  @IsString()
  typicalDeadline?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
