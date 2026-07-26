import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Cliente pediu para retomar em 15 dias.' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
