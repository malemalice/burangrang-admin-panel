import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SettingsHelperService } from '../../../shared/services/settings.service';

@Injectable()
export class ZohoWebhookGuard implements CanActivate {
  private readonly logger = new Logger(ZohoWebhookGuard.name);

  constructor(private readonly settingsHelper: SettingsHelperService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if webhook security is enabled
    const securityEnabled = await this.settingsHelper.getBoolean(
      'zoho.webhook.security',
      true, // Default to true for security
    );

    if (!securityEnabled) {
      this.logger.warn('Zoho webhook security is disabled - skipping signature verification');
      return true;
    }

    // Get webhook secret from settings
    const secret = await this.settingsHelper.get('zoho.secret');

    if (!secret) {
      this.logger.error('Zoho webhook secret not configured in settings');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    // Get signature from header
    const signature = request.headers['x-zoho-signature'] as string;

    if (!signature) {
      this.logger.warn('Missing X-Zoho-Signature header');
      throw new UnauthorizedException('Missing Zoho signature header');
    }

    // Get raw body (must be available as string)
    // The raw body should be attached by middleware in main.ts
    const rawBody = (request as any).rawBody || JSON.stringify(request.body);

    if (!rawBody) {
      this.logger.warn('Raw body not available for signature verification');
      throw new UnauthorizedException('Raw body not available');
    }

    if (!rawBody) {
      this.logger.warn('Raw body not available for signature verification');
      throw new UnauthorizedException('Raw body not available');
    }

    try {
      // Calculate expected signature using HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (!isValid) {
        this.logger.warn('Invalid Zoho webhook signature');
        throw new ForbiddenException('Invalid Zoho webhook signature');
      }

      this.logger.debug('Zoho webhook signature verified successfully');
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      throw new ForbiddenException('Signature verification failed');
    }
  }
}
