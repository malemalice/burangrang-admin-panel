import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';

describe('ZohoDeskApiClient', () => {
  let zohoConfigService: ZohoConfigService;
  let client: ZohoDeskApiClient;

  beforeEach(() => {
    zohoConfigService = {
      getString: jest.fn((key: string, defaultValue: string) => {
        const values: Record<string, string> = {
          [SETTINGS_KEYS.SDP_BASE_URL]: 'https://servicedesk.hapfor.com',
          [SETTINGS_KEYS.SDP_API_VERSION]: 'v3',
          [SETTINGS_KEYS.SDP_AUTHTOKEN]: 'sdp-token',
        };

        return Promise.resolve(values[key] ?? defaultValue);
      }),
      getBoolean: jest.fn((key: string, defaultValue: boolean) => {
        const values: Record<string, boolean> = {
          [SETTINGS_KEYS.SDP_ALLOW_SELF_SIGNED]: false,
        };

        return Promise.resolve(values[key] ?? defaultValue);
      }),
      getNumber: jest.fn((key: string, defaultValue: number) => {
        const values: Record<string, number> = {
          [SETTINGS_KEYS.ZOHO_MAX_RETRIES]: 1,
          [SETTINGS_KEYS.ZOHO_RETRY_BASE_MS]: 10,
          [SETTINGS_KEYS.ZOHO_RETRY_MAX_MS]: 20,
        };

        return Promise.resolve(values[key] ?? defaultValue);
      }),
    } as unknown as ZohoConfigService;

    client = new ZohoDeskApiClient(zohoConfigService);
    jest.clearAllMocks();
  });

  it('allows self-signed TLS only when the setting is enabled', async () => {
    const getBooleanMock = zohoConfigService.getBoolean as jest.Mock;
    getBooleanMock.mockResolvedValue(true);

    const requestMock = jest
      .spyOn(require('node:https'), 'request')
      .mockImplementation(
        (
          _url: unknown,
          options: { rejectUnauthorized?: boolean },
          callback: (response: {
            statusCode?: number;
            setEncoding: (encoding: string) => void;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
          }) => void,
        ) => {
          const handlers = new Map<string, (...args: unknown[]) => void>();
          const response = {
            statusCode: 200,
            setEncoding: jest.fn(),
            on: (event: string, handler: (...args: unknown[]) => void) => {
              handlers.set(event, handler);
            },
          };

          callback(response);
          handlers.get('data')?.('{"request":{"id":"req-2"}}');
          handlers.get('end')?.();

          return {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
          };
        },
      );

    await client.createRequest({ subject: 'Dummy' }, 'corr-self-signed');

    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock.mock.calls[0]?.[1]).toMatchObject({
      rejectUnauthorized: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends update request with SDP headers and input_data body', async () => {
    const requestMock = jest
      .spyOn(require('node:https'), 'request')
      .mockImplementation(
        (
          url: URL,
          options: {
            method?: string;
            headers?: Record<string, string>;
            rejectUnauthorized?: boolean;
          },
          callback: (response: {
            statusCode?: number;
            setEncoding: (encoding: string) => void;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
          }) => void,
        ) => {
          const handlers = new Map<string, (...args: unknown[]) => void>();
          const response = {
            statusCode: 200,
            setEncoding: jest.fn(),
            on: (event: string, handler: (...args: unknown[]) => void) => {
              handlers.set(event, handler);
            },
          };
          const request = {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn(() => {
              callback(response);
              handlers.get('data')?.('{"request":{"id":"req-1"}}');
              handlers.get('end')?.();
            }),
          };

          return request;
        },
      );

    await client.updateRequest(
      'req-1',
      {
        subject: 'VPN access issue',
        status: { id: '2', name: 'Open' },
        priority: { id: '3', name: 'High' },
        requester: { email_id: 'user@company.com' },
        udf_fields: {
          udf_sline_25: 'Lantai 5',
        },
      },
      'corr-1',
    );

    expect(requestMock).toHaveBeenCalledTimes(1);
    const [url, options] = requestMock.mock.calls[0] as [
      URL,
      {
        method?: string;
        headers?: Record<string, string>;
      }
    ];
    expect(url.toString()).toBe(
      'https://servicedesk.hapfor.com/api/v3/requests/req-1',
    );
    expect(options.method).toBe('PUT');
    expect(options.headers).toMatchObject({
      authtoken: 'sdp-token',
      Accept: 'application/vnd.manageengine.sdp.v3+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    });
  });

  it('retries on retryable status and throws normalized error when exhausted', async () => {
    const requestMock = jest
      .spyOn(require('node:https'), 'request')
      .mockImplementation(
        (
          _url: unknown,
          _options: unknown,
          callback: (response: {
            statusCode?: number;
            setEncoding: (encoding: string) => void;
            on: (event: string, handler: (...args: unknown[]) => void) => void;
          }) => void,
        ) => {
          const handlers = new Map<string, (...args: unknown[]) => void>();
          const response = {
            statusCode: 429,
            setEncoding: jest.fn(),
            on: (event: string, handler: (...args: unknown[]) => void) => {
              handlers.set(event, handler);
            },
          };

          return {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn(() => {
              callback(response);
              handlers.get('data')?.('{"message":"rate limit"}');
              handlers.get('end')?.();
            }),
          };
        },
      );

    await expect(
      client.createRequest({ subject: 'Dummy' }, 'corr-2'),
    ).rejects.toMatchObject({
      message: 'SDP request failed: HTTP 429',
      statusCode: 429,
      responseBody: { message: 'rate limit' },
      correlationId: 'corr-2',
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
