import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { messagesHelper } from 'src/helpers/messages.helper';
import { RegExHelper } from 'src/helpers/regex.helper';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'uuid-token' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'MinhaSenh@123' })
  @IsOptional()
  @Matches(RegExHelper.password, { message: messagesHelper.passwordMessages })
  password?: string;
}
