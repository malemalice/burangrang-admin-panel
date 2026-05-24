import { request as httpsRequest } from 'node:https';
import { Injectable, Logger } from '@nestjs/common';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { SdpRequestPayload } from '../types/sdp-request-payload.types';
import { ZohoConfigService } from './zoho-config.service';

interface NormalizedApiError extends Error {
  statusCode?: number;
  responseBody?: Record<string, unknown>;
  correlationId?: string;
}

@Injectable()
export class ZohoDeskApiClient {
  private readonly logger = new Logger(ZohoDeskApiClient.name);

  constructor(private readonly zohoConfigService: ZohoConfigService) { }

  async updateRequest(
    requestId: string,
    payload: SdpRequestPayload,
    correlationId: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.executeWithRetry({
      endpoint: `/requests/${encodeURIComponent(requestId)}`,
      method: 'PUT',
      payload,
      correlationId,
      logMessage: 'SDP update request',
    });

    return response;
  }

  async testConnection(): Promise<{
    ok: boolean;
    statusCode?: number;
    latencyMs: number;
    error?: string;
  }> {
    const startedAt = Date.now();

    let baseUrl: string;
    let version: string;
    let authToken: string;
    let allowSelfSigned: boolean;

    try {
      const config = await this.resolveSdpConfig();
      baseUrl = config.baseUrl;
      version = config.version;
      authToken = config.authToken;
      allowSelfSigned = config.allowSelfSigned;
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: this.stringifyError(error),
      };
    }

    const url = `${baseUrl}/api/${version}/requests?page_size=1`;

    try {
      const response = await this.sendHttpsGetRequest({ url, authToken, allowSelfSigned });
      const latencyMs = Date.now() - startedAt;
      const ok = response.statusCode >= 200 && response.statusCode < 300;

      return {
        ok,
        statusCode: response.statusCode,
        latencyMs,
        error: ok ? undefined : `HTTP ${response.statusCode}`,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: this.stringifyError(error),
      };
    }
  }

  async createRequest(
    payload: SdpRequestPayload,
    correlationId: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.executeWithRetry({
      endpoint: '/requests',
      method: 'POST',
      payload,
      correlationId,
      logMessage: 'SDP create request',
    });

    return response;
  }

  private async executeWithRetry(params: {
    endpoint: string;
    method: 'POST' | 'PUT';
    payload: SdpRequestPayload;
    correlationId: string;
    logMessage: string;
  }): Promise<Record<string, unknown>> {
    const { endpoint, method, payload, correlationId, logMessage } = params;
    const maxAttempts = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_MAX_RETRIES,
      3,
    );

    let lastError: unknown;

    for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
      try {
        this.logger.log(
          JSON.stringify({
            message: `${logMessage} outbound request`,
            correlationId,
            endpoint,
            method,
            attempt,
            payloadKeys: Object.keys(payload),
          }),
        );

        const response = await this.performRequest(
          endpoint,
          method,
          payload,
          correlationId,
        );

        this.logger.log(
          JSON.stringify({
            message: `${logMessage} outbound response`,
            correlationId,
            endpoint,
            method,
            attempt,
          }),
        );

        return response;
      } catch (error) {
        lastError = error;
        const statusCode = this.readStatusCode(error);
        const retryable = this.isRetryable(statusCode, error);

        if (!retryable || attempt >= Math.max(1, maxAttempts)) {
          throw error;
        }

        const backoffMs = await this.computeBackoff(attempt);
        await this.sleep(backoffMs);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Unexpected outbound retry failure');
  }

  private async performRequest(
    endpoint: string,
    method: 'POST' | 'PUT',
    payload: SdpRequestPayload,
    correlationId: string,
  ): Promise<Record<string, unknown>> {
    const { baseUrl, version, authToken, allowSelfSigned } =
      await this.resolveSdpConfig();
    const url = `${baseUrl}/api/${version}${endpoint}`;

    const body = new URLSearchParams({
      input_data: JSON.stringify({
        request: payload,
      }),
    });

    let responseText = '';
    let statusCode = 0;
    try {
      const response = await this.sendHttpsRequest({
        url,
        method,
        authToken,
        body: body.toString(),
        allowSelfSigned,
      });
      responseText = response.body;
      statusCode = response.statusCode;
    } catch (error) {
      const networkError = this.buildError({
        message: `SDP request failed before response: ${this.stringifyError(error)}`,
        correlationId,
        responseBody: {
          phase: 'network_before_response',
          url,
          host: new URL(url).host,
          method,
          allowSelfSigned,
          payloadKeys: Object.keys(payload),
          diagnostic: this.extractErrorDiagnostic(error),
        },
      });
      throw networkError;
    }

    let parsed: Record<string, unknown> = {};

    try {
      parsed = responseText
        ? (JSON.parse(responseText) as Record<string, unknown>)
        : {};
    } catch {
      parsed = { raw: responseText };
    }

    if (statusCode < 200 || statusCode >= 300) {
      const error = this.buildError({
        message: `SDP request failed: HTTP ${statusCode}`,
        statusCode,
        responseBody: parsed,
        correlationId,
      });
      throw error;
    }

    return parsed;
  }

  private async resolveSdpConfig(): Promise<{
    baseUrl: string;
    version: string;
    authToken: string;
    allowSelfSigned: boolean;
  }> {
    const baseUrl = await this.zohoConfigService.getString(
      SETTINGS_KEYS.SDP_BASE_URL,
      'https://servicedesk.hapfor.com',
    );
    const version = await this.zohoConfigService.getString(
      SETTINGS_KEYS.SDP_API_VERSION,
      'v3',
    );
    const authToken = await this.zohoConfigService.getString(
      SETTINGS_KEYS.SDP_AUTHTOKEN,
      '',
    );
    const allowSelfSigned = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.SDP_ALLOW_SELF_SIGNED,
      false,
    );

    if (!authToken) {
      throw new Error('SDP_AUTHTOKEN is not configured');
    }

    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      version,
      authToken,
      allowSelfSigned,
    };
  }

  private sendHttpsGetRequest(params: {
    url: string;
    authToken: string;
    allowSelfSigned: boolean;
  }): Promise<{ statusCode: number; body: string }> {
    const { url, authToken, allowSelfSigned } = params;
    const targetUrl = new URL(url);

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        targetUrl,
        {
          method: 'GET',
          headers: {
            authtoken: authToken,
            Accept: 'application/vnd.manageengine.sdp.v3+json',
          },
          rejectUnauthorized: !allowSelfSigned,
        },
        (response) => {
          let responseBody = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => { responseBody += chunk; });
          response.on('end', () => {
            resolve({ statusCode: response.statusCode ?? 0, body: responseBody });
          });
        },
      );

      req.on('error', reject);
      req.end();
    });
  }

  private sendHttpsRequest(params: {
    url: string;
    method: 'POST' | 'PUT';
    authToken: string;
    body: string;
    allowSelfSigned: boolean;
  }): Promise<{ statusCode: number; body: string }> {
    const { url, method, authToken, body, allowSelfSigned } = params;
    const targetUrl = new URL(url);

    return new Promise((resolve, reject) => {
      const request = httpsRequest(
        targetUrl,
        {
          method,
          headers: {
            authtoken: authToken,
            Accept: 'application/vnd.manageengine.sdp.v3+json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body).toString(),
          },
          rejectUnauthorized: !allowSelfSigned,
        },
        (response) => {
          let responseBody = '';

          response.setEncoding('utf8');
          response.on('data', (chunk: string) => {
            responseBody += chunk;
          });
          response.on('end', () => {
            resolve({
              statusCode: response.statusCode ?? 0,
              body: responseBody,
            });
          });
        },
      );

      request.on('error', reject);
      request.write(body);
      request.end();
    });
  }

  private async computeBackoff(attempt: number): Promise<number> {
    const base = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_RETRY_BASE_MS,
      2000,
    );
    const cap = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_RETRY_MAX_MS,
      60000,
    );
    const exponential = Math.min(cap, base * 2 ** Math.max(0, attempt - 1));
    const jitter = Math.floor(
      Math.random() * Math.max(1, Math.floor(exponential * 0.25)),
    );

    return exponential + jitter;
  }

  private isRetryable(statusCode: number | null, error: unknown): boolean {
    if (statusCode === 429) {
      return true;
    }

    if (statusCode !== null && statusCode >= 500) {
      return true;
    }

    const message = this.stringifyError(error).toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch failed')
    );
  }

  private readStatusCode(error: unknown): number | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }

    return null;
  }

  private buildError(params: {
    message: string;
    statusCode?: number;
    responseBody?: Record<string, unknown>;
    correlationId: string;
  }): NormalizedApiError {
    const error = new Error(params.message) as NormalizedApiError;
    error.statusCode = params.statusCode;
    error.responseBody = params.responseBody;
    error.correlationId = params.correlationId;

    return error;
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }

  private extractErrorDiagnostic(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      const cause = this.readErrorCause(error);

      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause,
      };
    }

    if (typeof error === 'object' && error !== null) {
      return error as Record<string, unknown>;
    }

    return {
      value: error,
    };
  }

  private readErrorCause(error: Error): Record<string, unknown> | undefined {
    const errorWithCause = error as Error & { cause?: unknown };

    if (!errorWithCause.cause) {
      return undefined;
    }

    if (errorWithCause.cause instanceof Error) {
      return {
        name: errorWithCause.cause.name,
        message: errorWithCause.cause.message,
        stack: errorWithCause.cause.stack,
      };
    }

    if (
      typeof errorWithCause.cause === 'object' &&
      errorWithCause.cause !== null
    ) {
      return errorWithCause.cause as Record<string, unknown>;
    }

    return {
      value: errorWithCause.cause,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
