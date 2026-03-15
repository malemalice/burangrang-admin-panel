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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends update request with SDP headers and input_data body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('{"request":{"id":"req-1"}}'),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://servicedesk.hapfor.com/api/v3/requests/req-1');
    expect(options.method).toBe('PUT');
    expect(options.headers).toMatchObject({
      authtoken: 'sdp-token',
      Accept: 'application/vnd.manageengine.sdp.v3+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const requestBody = new URLSearchParams(options.body as string);
    const inputData = requestBody.get('input_data');
    expect(inputData).toBeTruthy();
    expect(JSON.parse(inputData as string)).toEqual({
      request: {
        subject: 'VPN access issue',
        status: {
          id: '2',
          name: 'Open',
        },
        priority: {
          id: '3',
          name: 'High',
        },
        requester: {
          email_id: 'user@company.com',
        },
        udf_fields: {
          udf_sline_25: 'Lantai 5',
        },
      },
    });
  });

  it('retries on retryable status and throws normalized error when exhausted', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('{"message":"rate limit"}'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('{"message":"rate limit"}'),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      client.createRequest({ subject: 'Dummy' }, 'corr-2'),
    ).rejects.toMatchObject({
      message: 'SDP request failed: HTTP 429',
      statusCode: 429,
      responseBody: { message: 'rate limit' },
      correlationId: 'corr-2',
    });
  });
});
