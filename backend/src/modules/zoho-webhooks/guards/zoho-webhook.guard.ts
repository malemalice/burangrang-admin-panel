import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ZohoWebhookGuard implements CanActivate {
  private readonly logger = new Logger(ZohoWebhookGuard.name);

  constructor(private readonly configService: ConfigService) { }

  canActivate(context: ExecutionContext): boolean {
    const enabled = this.getBoolean('ZOHO_WEBHOOK_ENABLED', true);
    if (!enabled) {
      throw new ForbiddenException('Zoho webhook is disabled by configuration');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const mode = (this.configService.get<string>('ZOHO_WEBHOOK_AUTH_MODE') ?? 'secret').toLowerCase();

    if (mode === 'jwt') {
      return this.validateJwtMode(request);
    }

    if (mode === 'signature') {
      return this.validateSignatureMode(request);
    }

    return this.validateSecretMode(request);
  }

  private validateSecretMode(request: Request): boolean {
    const expectedSecret = this.configService.get<string>('ZOHO_WEBHOOK_SECRET');
    const receivedSecret =
      (request.headers['x-zoho-webhook-secret'] as string | undefined) ??
      (request.headers['x-zoho-secret'] as string | undefined);

    if (!expectedSecret) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    if (!receivedSecret) {
      throw new UnauthorizedException('Missing webhook secret header');
    }

    if (!this.safeCompare(receivedSecret, expectedSecret)) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    return true;
  }

  private validateJwtMode(request: Request): boolean {
    const expectedToken = this.configService.get<string>('ZOHO_WEBHOOK_JWT');
    const authorization = request.headers.authorization;

    if (!expectedToken) {
      throw new UnauthorizedException('Webhook JWT token is not configured');
    }

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const incomingToken = authorization.slice('Bearer '.length).trim();

    if (!this.safeCompare(incomingToken, expectedToken)) {
      throw new ForbiddenException('Invalid bearer token');
    }

    return true;
  }

  private validateSignatureMode(request: Request): boolean {
    const expectedSecret = this.configService.get<string>('ZOHO_WEBHOOK_SECRET');
    const signature = request.headers['x-zoho-signature'] as string | undefined;
    const rawBody = ((request as Request & { rawBody?: string }).rawBody ??
      JSON.stringify(request.body ?? {})) as string;

    if (!expectedSecret) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    if (!signature) {
      throw new UnauthorizedException('Missing Zoho signature header');
    }

    if (!rawBody) {
      throw new UnauthorizedException('Raw body is not available');
    }

    const expectedSignature = crypto
      .createHmac('sha256', expectedSecret)
      .update(rawBody)
      .digest('hex');

    if (!this.safeCompare(signature, expectedSignature)) {
      throw new ForbiddenException('Invalid Zoho signature');
    }

    return true;
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true' || value === '1';
  }

  private safeCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) {
      this.logger.warn('Webhook auth value length mismatch');
      return false;
    }

    return crypto.timingSafeEqual(aBuffer, bBuffer);
  }
}
