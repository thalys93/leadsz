import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Roles } from 'src/enums/Roles';
import { CompanyRole } from 'src/enums/CompanyRole';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    roles: Roles[];
    companyId?: string | null;
    companyRole?: CompanyRole | null;
  }) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      companyId: payload.companyId ?? null,
      companyRole: payload.companyRole ?? null,
    };
  }
}
