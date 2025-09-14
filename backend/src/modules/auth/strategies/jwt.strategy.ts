/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/services/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    let jwtFromRequest;
    try {
      jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    } catch (error) {
      console.error(
        'Error initializing JWT extractor:',
        error instanceof Error ? error.message : String(error),
      );
      throw new Error('Failed to initialize JWT strategy');
    }

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get('app.jwtSecret') || '',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.role) {
      throw new UnauthorizedException('User role not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
    };
  }
}
