import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateLeadChannelDto } from './create-lead.dto';

export class UpdateChannelsDto {
  @ApiProperty({ type: [CreateLeadChannelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLeadChannelDto)
  channels: CreateLeadChannelDto[];
}
