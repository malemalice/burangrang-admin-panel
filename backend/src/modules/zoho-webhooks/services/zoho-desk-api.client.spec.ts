import { ConfigService } from '@nestjs/config';
import { ZohoDeskApiClient } from './zoho-desk-api.client';

describe('ZohoDeskApiClient', () => {
  let configService: ConfigService;
  let client: ZohoDeskApiClient;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SDP_BASE_URL: 'https://servicedesk.hapfor.com',
          SDP_API_VERSION: 'v3',
          SDP_AUTHTOKEN: 'sdp-token',
          ZOHO_MAX_RETRIES: '1',
          ZOHO_RETRY_BASE_MS: '10',
          ZOHO_RETRY_MAX_MS: '20',
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    client = new ZohoDeskApiClient(configService);
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
      { status: { name: 'Closed' } },
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
        status: {
          name: 'Closed',
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
