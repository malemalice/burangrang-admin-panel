import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EmbedTokenPayload {
  iat: number;
  siteId?: string;
}

@Injectable()
export class EmbedTokenService {
  constructor(private readonly configService: ConfigService) {}

  generateToken(options?: { siteId?: string }): string {
    const payload: EmbedTokenPayload = {
      iat: Math.floor(Date.now() / 1000),
      ...(options?.siteId && { siteId: options.siteId }),
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

    return `${payloadB64}.${signature}`;
  }

  validateToken(token: string): { valid: boolean } {
    if (!token || typeof token !== 'string') {
      return { valid: false };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false };
    }

    const [payloadB64, signatureB64] = parts;

    const secret = this.configService.get<string>('app.jwtSecret');
    if (!secret) {
      return { valid: false };
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadB64)
        .digest('base64url');

      const sigBuf = Buffer.from(signatureB64, 'base64url');
      const expectedBuf = Buffer.from(expectedSignature, 'base64url');
      if (sigBuf.length !== expectedBuf.length) {
        return { valid: false };
      }

      const valid =
        signatureB64.length > 0 && crypto.timingSafeEqual(sigBuf, expectedBuf);

      return { valid };
    } catch {
      return { valid: false };
    }
  }
}
