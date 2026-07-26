import { messagesHelper } from 'src/helpers/messages.helper';
import { RegExHelper } from './../../helpers/regex.helper';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyRole } from 'src/enums/CompanyRole';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    minLength: 1,
    type: String,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do usuário (deve ser um email válido)',
    example: 'joao.silva@exemplo.com',
    format: 'email',
    type: String,
  })
  @IsNotEmpty()
  @Matches(RegExHelper.email, { message: messagesHelper.emailMessage })
  email: string;

  @ApiProperty({
    description:
      'Senha do usuário (deve conter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial)',
    example: 'MinhaSenh@123',
    minLength: 8,
    type: String,
  })
  @IsNotEmpty()
  @Matches(RegExHelper.password, { message: messagesHelper.passwordMessages })
  password: string;

  @ApiProperty({
    description: 'URL do avatar/foto do usuário',
    example: 'https://exemplo.com/avatar.jpg',
    required: false,
    type: String,
  })
  @IsOptional()
  avatar_url?: string;

  @ApiPropertyOptional({
    description: 'Cargo do usuário',
    example: 'Head de Vendas',
    type: String,
  })
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato',
    example: '+55 11 99999-9999',
    type: String,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null && String(value).trim() !== '')
  @Matches(RegExHelper.phone, { message: messagesHelper.phoneMessage })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Site ou portfólio (usado na geração de templates)',
    example: 'https://meusite.com.br',
    type: String,
  })
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: 'Configurações do usuário em formato JSON',
    required: false,
    type: Object,
  })
  @IsOptional()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: CompanyRole })
  @IsOptional()
  @IsEnum(CompanyRole)
  companyRole?: CompanyRole;
}
