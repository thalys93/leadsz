import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { CheckpointKey } from 'src/enums/CheckpointKey';

export class ToggleCheckpointDto {
  @ApiProperty({ enum: CheckpointKey })
  @IsEnum(CheckpointKey)
  key: CheckpointKey;

  @ApiProperty({ example: true })
  @IsBoolean()
  checked: boolean;
}
