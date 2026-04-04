import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { SettingsService } from '../../settings/settings.service';
import {
  SdpIdNameRef,
  SdpRequestPayload,
  SdpUdfFields,
} from '../types/sdp-request-payload.types';
import { ZohoDeskApiClient } from '../services/zoho-desk-api.client';
import { ZohoConfigService } from '../services/zoho-config.service';

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

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function parseJsonObject<T>(value: string | undefined): T | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return JSON.parse(value) as T;
}

function buildIdNameRef(
  args: Record<string, string>,
  prefix: string,
): SdpIdNameRef | undefined {
  const id = args[`${prefix}Id`]?.trim();
  const name = args[`${prefix}Name`]?.trim();

  if (!id && !name) {
    return undefined;
  }

  return {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
  };
}

function buildRequester(
  args: Record<string, string>,
): SdpRequestPayload['requester'] {
  const id = args.requesterId?.trim();
  const name = args.requesterName?.trim();
  const emailId = args.requesterEmail?.trim();

  if (emailId && !id && !name) {
    return { email_id: emailId };
  }

  if (!id && !name && !emailId) {
    return undefined;
  }

  return {
    ...(id ? { id } : {}),
    ...(name ? { name } : {}),
  };
}

function buildArrayRef(
  args: Record<string, string>,
  key: string,
): SdpIdNameRef[] | undefined {
  return parseJsonObject<SdpIdNameRef[]>(args[key]);
}

function buildUdfFields(
  args: Record<string, string>,
): SdpUdfFields | undefined {
  return parseJsonObject<SdpUdfFields>(args.udfFields);
}

function buildSamplePayload(args: Record<string, string>): SdpRequestPayload {
  const subject = args.subject || 'Dummy HSE integration request';
  const description =
    args.description ||
    '<div>This request is created by backend dummy utility for HSE to ServiceDesk Plus integration verification.</div>';

  const payload: SdpRequestPayload = {
    subject,
    description,
    short_description:
      args.shortDescription || 'HSE integration verification request',
  };

  const directRefs = [
    ['request_type', 'requestType'],
    ['impact', 'impact'],
    ['mode', 'mode'],
    ['level', 'level'],
    ['urgency', 'urgency'],
    ['priority', 'priority'],
    ['service_category', 'serviceCategory'],
    ['site', 'site'],
    ['group', 'group'],
    ['technician', 'technician'],
    ['category', 'category'],
    ['subcategory', 'subcategory'],
    ['item', 'item'],
    ['on_behalf_of', 'onBehalfOf'],
    ['template', 'template'],
    ['editor', 'editor'],
  ] as const satisfies ReadonlyArray<[keyof SdpRequestPayload, string]>;

  for (const [payloadKey, prefix] of directRefs) {
    const ref = buildIdNameRef(args, prefix);
    if (ref) {
      Object.assign(payload, {
        [payloadKey]: ref,
      });
    }
  }

  const statusRef = buildIdNameRef(args, 'status');
  if (statusRef) {
    payload.status = statusRef;
  } else if (args.status?.trim()) {
    payload.status = args.status;
  } else {
    payload.status = { name: 'Open' };
  }

  const requester = buildRequester(args);
  if (requester) {
    payload.requester = requester;
  }

  if (args.impactDetails) {
    payload.impact_details = args.impactDetails;
  }

  if (args.updateReason) {
    payload.update_reason = args.updateReason;
  }

  if (args.statusChangeComments) {
    payload.status_change_comments = args.statusChangeComments;
  }

  if (args.dueByTime) {
    payload.due_by_time = {
      value: args.dueByTime,
    };
  }

  if (args.firstResponseDueByTime) {
    payload.first_response_due_by_time = {
      value: args.firstResponseDueByTime,
    };
  }

  const isFcr = parseBoolean(args.isFcr);
  if (isFcr !== undefined) {
    payload.is_fcr = isFcr;
  }

  const assets = buildArrayRef(args, 'assets');
  if (assets) {
    payload.assets = assets;
  }

  const serviceApprovers = buildArrayRef(args, 'serviceApprovers');
  if (serviceApprovers) {
    payload.service_approvers = serviceApprovers;
  }

  const attachments = parseJsonObject<Array<{ id: string }>>(args.attachments);
  if (attachments) {
    payload.attachments = attachments;
  }

  const templateTaskIds = parseJsonObject<Array<{ id: string }>>(
    args.requestTemplateTaskIds,
  );
  if (templateTaskIds) {
    payload.request_template_task_ids = templateTaskIds;
  }

  const notifyEmails = parseJsonObject<Array<{ email_id: string }>>(
    args.emailIdsToNotify,
  );
  if (notifyEmails) {
    payload.email_ids_to_notify = notifyEmails;
  }

  const udfFields = buildUdfFields(args);
  if (udfFields) {
    payload.udf_fields = udfFields;
  }

  const resolutionContent = args.resolutionContent?.trim();
  if (resolutionContent) {
    payload.resolution = {
      content: resolutionContent,
      add_to_linked_requests:
        parseBoolean(args.addResolutionToLinkedRequests) ?? false,
    };
  }

  const closureCode = buildIdNameRef(args, 'closureCode');
  const requesterAckResolution = parseBoolean(args.requesterAckResolution);
  const requesterAckComments = args.requesterAckComments?.trim();
  const closureComments = args.closureComments?.trim();
  if (
    closureCode ||
    requesterAckResolution !== undefined ||
    requesterAckComments ||
    closureComments
  ) {
    payload.closure_info = {
      ...(closureCode ? { closure_code: closureCode } : {}),
      ...(requesterAckResolution !== undefined
        ? { requester_ack_resolution: requesterAckResolution }
        : {}),
      ...(requesterAckComments
        ? { requester_ack_comments: requesterAckComments }
        : {}),
      ...(closureComments ? { closure_comments: closureComments } : {}),
    };
  }

  const onholdStatus = buildIdNameRef(args, 'onholdStatus');
  const onholdComments = args.onholdComments?.trim();
  const onholdScheduledTime = args.onholdScheduledTime?.trim();
  if (onholdStatus || onholdComments || onholdScheduledTime) {
    payload.onhold_scheduler = {
      ...(onholdScheduledTime
        ? {
          scheduled_time: {
            value: onholdScheduledTime,
          },
        }
        : {}),
      ...(onholdComments ? { comments: onholdComments } : {}),
      ...(onholdStatus ? { change_to_status: onholdStatus } : {}),
    };
  }

  const linkedRequestId = args.linkedRequestId?.trim();
  const linkedRequestComments = args.linkedRequestComments?.trim();
  if (linkedRequestId) {
    payload.linked_to_request = {
      request: {
        id: linkedRequestId,
      },
      ...(linkedRequestComments ? { comments: linkedRequestComments } : {}),
    };
  }

  return payload;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const payload = buildSamplePayload(args);
  const correlationId = args.correlationId || `corr-dummy-${randomUUID()}`;

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const settingsService = new SettingsService(
    prisma,
    new DtoMapperService(),
    new ErrorHandlingService(),
  );

  const zohoConfigService = new ZohoConfigService(settingsService);
  await zohoConfigService.onModuleInit();

  const apiClient = new ZohoDeskApiClient(zohoConfigService);

  const response = await apiClient.createRequest(payload, correlationId);

  const requestId =
    (response.request as Record<string, unknown> | undefined)?.id ||
    (response.response_status as Record<string, unknown> | undefined)
      ?.status_code ||
    null;

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

  await prisma.onModuleDestroy();
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
