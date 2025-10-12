/**
 * Xendit Payment Integration Service
 * Handles communication with Xendit Payment Gateway API
 */

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  XenditInvoiceRequest,
  XenditInvoiceResponse,
  XenditError,
} from '../types/xendit.types';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly environment: string;
  private readonly baseUrl = 'https://api.xendit.co';
  private readonly apiVersion = '2024-09-30';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('XENDIT_SECRET_KEY') || '';
    this.webhookToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN') || '';
    this.environment = this.configService.get<string>('XENDIT_ENVIRONMENT') || 'sandbox';

    if (!this.secretKey) {
      this.logger.warn('Xendit secret key not configured. Payment features will be limited.');
    }
  }

  /**
   * Check if Xendit is properly configured
   */
  isConfigured(): boolean {
    return !!this.secretKey;
  }

  /**
   * Get authorization header for Xendit API
   */
  private getAuthHeader(): string {
    const credentials = `${this.secretKey}:`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Get common headers for Xendit API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'X-API-Version': this.apiVersion,
    };
  }

  /**
   * Create a Xendit invoice for payment
   */
  async createInvoice(invoiceData: XenditInvoiceRequest): Promise<XenditInvoiceResponse> {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Xendit is not configured. Please set XENDIT_SECRET_KEY.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`Creating Xendit invoice for external_id: ${invoiceData.external_id}`);

      const response = await fetch(`${this.baseUrl}/v2/invoices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as XenditError;
        this.logger.error(`Xendit API error: ${error.error_code} - ${error.message}`);
        throw new HttpException(
          `Xendit payment failed: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Xendit invoice created successfully: ${data.id}`);
      return data as XenditInvoiceResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error creating Xendit invoice:', error);
      throw new HttpException(
        'Failed to create payment invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get invoice by Xendit invoice ID
   */
  async getInvoice(invoiceId: string): Promise<XenditInvoiceResponse> {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Xendit is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`Fetching Xendit invoice: ${invoiceId}`);

      const response = await fetch(`${this.baseUrl}/v2/invoices/${invoiceId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as XenditError;
        throw new HttpException(
          `Failed to fetch invoice: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data as XenditInvoiceResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching Xendit invoice:', error);
      throw new HttpException(
        'Failed to fetch invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get invoice by external ID (order number)
   */
  async getInvoiceByExternalId(externalId: string): Promise<XenditInvoiceResponse[]> {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Xendit is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`Fetching Xendit invoice by external_id: ${externalId}`);

      const response = await fetch(
        `${this.baseUrl}/v2/invoices?external_id=${externalId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const error = data as XenditError;
        throw new HttpException(
          `Failed to fetch invoice: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data as XenditInvoiceResponse[];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching Xendit invoice by external ID:', error);
      throw new HttpException(
        'Failed to fetch invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(callbackToken: string): boolean {
    if (!this.webhookToken) {
      this.logger.warn('Webhook token not configured, skipping verification');
      return false;
    }
    return callbackToken === this.webhookToken;
  }

  /**
   * Expire an invoice
   */
  async expireInvoice(invoiceId: string): Promise<XenditInvoiceResponse> {
    if (!this.isConfigured()) {
      throw new HttpException(
        'Xendit is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`Expiring Xendit invoice: ${invoiceId}`);

      const response = await fetch(`${this.baseUrl}/v2/invoices/${invoiceId}/expire!`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as XenditError;
        throw new HttpException(
          `Failed to expire invoice: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data as XenditInvoiceResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error expiring Xendit invoice:', error);
      throw new HttpException(
        'Failed to expire invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

