import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ChannelType } from 'src/enums/ChannelType';
import { LeadStage } from 'src/enums/LeadStage';
import { RegExHelper } from 'src/helpers/regex.helper';
import { messagesHelper } from 'src/helpers/messages.helper';

@ValidatorConstraint({ name: 'phoneWhenWhatsApp', async: false })
class PhoneWhenWhatsAppConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const channel = args.object as { type: ChannelType };
    if (channel.type !== ChannelType.WHATSAPP) return true;
    return typeof value === 'string' && RegExHelper.phone.test(value.trim());
  }

  defaultMessage() {
    return messagesHelper.phoneMessage;
  }
}

export class CreateLeadChannelDto {
  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  type: ChannelType;

  @ApiProperty({ example: 'ana@acme.com' })
  @IsNotEmpty()
  @IsString()
  @Validate(PhoneWhenWhatsAppConstraint)
  value: string;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Ana Silva' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiPropertyOptional({ example: 'Acme' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  primaryChannel: ChannelType;

  @ApiPropertyOptional({ example: 'Landing page' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceId?: string | null;

  @ApiPropertyOptional({ example: 3500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dealValue?: number;

  @ApiPropertyOptional({ enum: LeadStage, default: LeadStage.LEAD })
  @IsOptional()
  @IsEnum(LeadStage)
  stage?: LeadStage;

  @ApiPropertyOptional({ example: 'Enviar DM' })
  @IsOptional()
  @IsString()
  nextAction?: string;

  @ApiPropertyOptional({ example: '2026-07-28' })
  @IsOptional()
  @IsDateString()
  nextActionAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: [CreateLeadChannelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLeadChannelDto)
  channels?: CreateLeadChannelDto[];
}
