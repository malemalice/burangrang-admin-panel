import { GeneralStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { ZohoWebhookDto } from '../dto/zoho-webhook.dto';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoWebhookValidatorService } from './zoho-webhook-validator.service';
import { ZohoWebhookService } from './zoho-webhook.service';

describe('ZohoWebhookService', () => {
  let prismaService: PrismaService;
  let zohoConfigService: ZohoConfigService;
  let validatorService: ZohoWebhookValidatorService;
  let service: ZohoWebhookService;

  let riskAssessmentCreateMock: jest.Mock;
  let mappingCreateMock: jest.Mock;
  let createWebhookLogMock: jest.Mock;
  let updateWebhookLogMock: jest.Mock;

  beforeEach(() => {
    riskAssessmentCreateMock = jest.fn().mockResolvedValue({
      id: 'ra-1',
      status: GeneralStatusEnum.OPEN,
    });
    mappingCreateMock = jest.fn().mockResolvedValue({ id: 'map-1' });
    createWebhookLogMock = jest.fn().mockResolvedValue(undefined);
    updateWebhookLogMock = jest.fn().mockResolvedValue(undefined);

    prismaService = {
      department: {
        findFirst: jest.fn().mockResolvedValue({ id: 'dept-1' }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      riskAssessment: {
        create: riskAssessmentCreateMock,
      },
      zohoTicketRiskAssessmentMap: {
        create: mappingCreateMock,
      },
    } as unknown as PrismaService;

    zohoConfigService = {
      getString: jest.fn((key: string, defaultValue: string) => {
        const values: Record<string, string> = {
          [SETTINGS_KEYS.ZOHO_INBOUND_DEFAULT_STATUS]: 'OPEN',
          [SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID]: 'dept-1',
          [SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID]: 'user-1',
        };

        return Promise.resolve(values[key] ?? defaultValue);
      }),
    } as unknown as ZohoConfigService;

    validatorService = {
      resolveRequestId: jest.fn().mockReturnValue('req-1'),
      resolveCorrelationId: jest.fn().mockReturnValue('corr-1'),
      buildEventKey: jest.fn().mockReturnValue('event-1'),
      isDuplicateByRequestId: jest.fn().mockResolvedValue(false),
      isDuplicateByEventKey: jest.fn().mockResolvedValue(false),
      hasEntityMapping: jest.fn().mockResolvedValue(false),
      createWebhookLog: createWebhookLogMock,
      updateWebhookLog: updateWebhookLogMock,
      logStructured: jest.fn(),
    } as unknown as ZohoWebhookValidatorService;

    jest.spyOn(global, 'setImmediate').mockImplementation(() => {
      return {} as NodeJS.Immediate;
    });

    service = new ZohoWebhookService(
      prismaService,
      zohoConfigService,
      validatorService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fast-ack for Ticket_Add and schedules async processing', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-1',
        subject: 'Unsafe area',
        description: 'Oil spill on floor',
        priority: 'High',
      },
      meta: { timestamp: '2026-02-24T14:00:00Z' },
    };

    const result = await service.receiveWebhook(
      payload,
      'Ticket_Add',
      'req-1',
      'corr-1',
      false,
    );
    expect(result.status).toBe('ok');
    expect(result.message).toContain('accepted for asynchronous processing');

    expect(createWebhookLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        eventType: 'Ticket_Add',
        eventKey: 'event-1',
      }),
    );

    expect(global.setImmediate).toHaveBeenCalledTimes(1);
  });

  it('processes Ticket_Add inbound payload to risk assessment and mapping', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-1',
        subject: 'Unsafe area',
        description: 'Oil spill on floor',
        priority: 'High',
      },
      meta: { timestamp: '2026-02-24T14:00:00Z' },
    };

    await service['processInboundAsync']({
      payload,
      eventType: 'Ticket_Add',
      requestId: 'req-1',
      eventKey: 'event-1',
      correlationId: 'corr-1',
      ticketData: {
        id: 'zoho-1',
        ticketNumber: '101',
        subject: 'Unsafe area',
        description: 'Oil spill on floor',
        priority: 'High',
        departmentId: undefined,
      },
      isLegacyRoute: false,
    });

    expect(riskAssessmentCreateMock).toHaveBeenCalled();
    expect(mappingCreateMock).toHaveBeenCalled();

    expect(updateWebhookLogMock).toHaveBeenCalledWith('event-1', 'PROCESSED');
  });

  it('suppresses duplicate by request id', async () => {
    (validatorService.isDuplicateByRequestId as jest.Mock).mockResolvedValue(
      true,
    );

    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-2',
        subject: 'Duplicate',
      },
      meta: {},
    };

    const result = await service.receiveWebhook(
      payload,
      'Ticket_Add',
      'req-dup',
      'corr-dup',
      false,
    );

    expect(result.message).toContain('duplicate request ignored');
    expect(createWebhookLogMock).not.toHaveBeenCalled();
    expect(riskAssessmentCreateMock).not.toHaveBeenCalled();
  });

  it('ignores unsupported events safely', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-3',
        subject: 'Status update',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: 'Ticket_Update',
      requestId: 'req-3',
      eventKey: 'event-1',
      correlationId: 'corr-3',
      ticketData: {
        id: 'zoho-3',
        ticketNumber: undefined,
        subject: 'Status update',
        description: undefined,
        priority: undefined,
        departmentId: undefined,
      },
      isLegacyRoute: false,
    });

    expect(updateWebhookLogMock).toHaveBeenCalled();
    expect(riskAssessmentCreateMock).not.toHaveBeenCalled();
  });
});
