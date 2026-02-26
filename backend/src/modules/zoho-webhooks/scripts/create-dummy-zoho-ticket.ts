import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ZohoDeskApiClient } from '../services/zoho-desk-api.client';

function parseArgs(argv: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      parsed[key] = 'true';
      continue;
    }

    parsed[key] = next;
    i += 1;
  }

  return parsed;
}

function buildSamplePayload(
  args: Record<string, string>,
): Record<string, unknown> {
  const subject = args.subject || 'Dummy HSE integration request';
  const description =
    args.description ||
    'This request is created by backend dummy utility for HSE ↔ ServiceDesk Plus integration verification.';

  const payload: Record<string, unknown> = {
    subject,
    description,
    status: {
      name: args.status || 'Open',
    },
  };

  if (args.priority) {
    payload.priority = {
      name: args.priority,
    };
  }

  if (args.requesterEmail) {
    payload.requester = {
      email_id: args.requesterEmail,
    };
  }

  if (args.requesterName) {
    payload.requester = {
      ...(payload.requester as Record<string, unknown>),
      name: args.requesterName,
    };
  }

  return payload;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const payload = buildSamplePayload(args);
  const correlationId = args.correlationId || `corr-dummy-${randomUUID()}`;

  const configService = new ConfigService();
  const apiClient = new ZohoDeskApiClient(configService);

  const response = await apiClient.createRequest(payload, correlationId);

  const requestId =
    (response.request as Record<string, unknown> | undefined)?.id ||
    (response.response_status as Record<string, unknown> | undefined)
      ?.status_code ||
    null;

  // Safe output for CLI usage, no secret/token values printed.

  console.log(
    JSON.stringify(
      {
        correlationId,
        requestPayload: payload,
        createdRequestId: requestId,
        response,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';

  console.error(
    JSON.stringify(
      {
        result: 'failed',
        error: message,
      },
      null,
      2,
    ),
  );

  process.exit(1);
});
