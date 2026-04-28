import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/** Signed link TTL for anonymous health screening fill (24 hours). */
export const HEALTH_SCREENING_PUBLIC_LINK_TTL_SECONDS = 86400;

export interface HealthScreeningPublicLinkPayload {
  screeningId: string;
  attemptId: string;
  /** Unix seconds */
  exp: number;
}

@Injectable()
export class HealthScreeningPublicLinkService {
  constructor(private readonly configService: ConfigService) {}

  signToken(screeningId: string, attemptId: string): {
    token: string;
    expiresAt: Date;
  } {
    const exp =
      Math.floor(Date.now() / 1000) + HEALTH_SCREENING_PUBLIC_LINK_TTL_SECONDS;
    const payload: HealthScreeningPublicLinkPayload = {
      screeningId,
      attemptId,
      exp,
    };
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');

    const secret = this.configService.get<string>('app.jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${signature}`;
    const expiresAt = new Date(exp * 1000);
    return { token, expiresAt };
  }

  /**
   * Verifies HMAC signature and expiry. Does not check database.
   */
  parseAndVerifyToken(token: string): HealthScreeningPublicLinkPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Invalid link');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid link');
    }

    const [payloadB64, signatureB64] = parts;

    const secret = this.configService.get<string>('app.jwtSecret');
    if (!secret) {
      throw new UnauthorizedException('Invalid link');
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadB64)
        .digest('base64url');

      const sigBuf = Buffer.from(signatureB64, 'base64url');
      const expectedBuf = Buffer.from(expectedSignature, 'base64url');
      if (sigBuf.length !== expectedBuf.length) {
        throw new UnauthorizedException('Invalid link');
      }

      const valid =
        signatureB64.length > 0 && crypto.timingSafeEqual(sigBuf, expectedBuf);
      if (!valid) {
        throw new UnauthorizedException('Invalid link');
      }

      const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(json) as HealthScreeningPublicLinkPayload;

      if (
        !payload.screeningId ||
        !payload.attemptId ||
        typeof payload.exp !== 'number'
      ) {
        throw new UnauthorizedException('Invalid link');
      }

      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('This link has expired');
      }

      return payload;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid link');
    }
  }
}
