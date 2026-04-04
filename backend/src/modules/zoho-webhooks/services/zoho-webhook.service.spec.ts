import { GeneralStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { ZOHO_EVENT_TYPES } from '../constants/zoho-event-types';
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
  let riskAssessmentUpdateMock: jest.Mock;
  let mappingCreateMock: jest.Mock;
  let mappingFindUniqueMock: jest.Mock;
  let mappingUpdateMock: jest.Mock;
  let createWebhookLogMock: jest.Mock;
  let updateWebhookLogMock: jest.Mock;
  let departmentFindFirstMock: jest.Mock;

  beforeEach(() => {
    riskAssessmentCreateMock = jest.fn().mockResolvedValue({
      id: 'ra-1',
      status: GeneralStatusEnum.OPEN,
    });
    riskAssessmentUpdateMock = jest.fn().mockResolvedValue({
      id: 'ra-1',
      status: GeneralStatusEnum.DONE,
    });
    mappingCreateMock = jest.fn().mockResolvedValue({ id: 'map-1' });
    mappingFindUniqueMock = jest.fn().mockResolvedValue({
      id: 'map-1',
      hseTaskId: 'ra-1',
      lastZohoStatus: 'Open',
      lastHseStatus: GeneralStatusEnum.OPEN,
    });
    mappingUpdateMock = jest.fn().mockResolvedValue({ id: 'map-1' });
    createWebhookLogMock = jest.fn().mockResolvedValue(undefined);
    updateWebhookLogMock = jest.fn().mockResolvedValue(undefined);
    departmentFindFirstMock = jest.fn().mockResolvedValue({ id: 'dept-1' });

    prismaService = {
      department: {
        findFirst: departmentFindFirstMock,
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      riskAssessment: {
        create: riskAssessmentCreateMock,
        update: riskAssessmentUpdateMock,
      },
      zohoTicketRiskAssessmentMap: {
        create: mappingCreateMock,
        findUnique: mappingFindUniqueMock,
        update: mappingUpdateMock,
      },
    } as unknown as PrismaService;

    zohoConfigService = {
      getString: jest.fn((key: string, defaultValue: string) => {
        const values: Record<string, string> = {
          [SETTINGS_KEYS.ZOHO_INBOUND_DEFAULT_STATUS]: 'OPEN',
          [SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID]: 'dept-1',
          [SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID]: 'user-1',
          [SETTINGS_KEYS.ZOHO_INBOUND_STATUS_MAP]: JSON.stringify({
            Open: 'OPEN',
            'In Progress': 'WAITING_APPROVAL',
            Resolved: 'DONE',
            Closed: 'CLOSE',
            Cancelled: 'REJECTED',
            Assigned: 'OPEN',
            Onhold: 'WAITING_APPROVAL',
          }),
        };

        return Promise.resolve(values[key] ?? defaultValue);
      }),
      getJsonRecord: jest.fn(
        (key: string, defaultValue: Record<string, string>) => {
          if (key === SETTINGS_KEYS.ZOHO_INBOUND_STATUS_MAP) {
            return Promise.resolve({
              Open: 'OPEN',
              'In Progress': 'WAITING_APPROVAL',
              Resolved: 'DONE',
              Closed: 'CLOSE',
              Cancelled: 'REJECTED',
              Assigned: 'OPEN',
              Onhold: 'WAITING_APPROVAL',
            });
          }

          return Promise.resolve(defaultValue);
        },
      ),
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
      ZOHO_EVENT_TYPES.TICKET_ADD,
      'req-1',
      'corr-1',
      false,
    );
    expect(result.status).toBe('ok');
    expect(result.message).toContain('accepted for asynchronous processing');

    expect(createWebhookLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        eventType: ZOHO_EVENT_TYPES.TICKET_ADD,
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
      eventType: ZOHO_EVENT_TYPES.TICKET_ADD,
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

  it('fast-ack for Ticket_Update and schedules async processing', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-1',
        subject: 'Updated unsafe area',
        status: 'Resolved',
      },
      meta: { timestamp: '2026-02-24T14:05:00Z' },
    };

    const result = await service.receiveWebhook(
      payload,
      ZOHO_EVENT_TYPES.TICKET_UPDATE,
      'req-update-1',
      'corr-update-1',
      false,
    );

    expect(result.status).toBe('ok');
    expect(result.message).toContain('accepted for asynchronous processing');
    expect(createWebhookLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
        eventKey: 'event-1',
      }),
    );
  });

  it('processes Ticket_Update inbound payload to update mapped risk assessment', async () => {
    departmentFindFirstMock.mockResolvedValueOnce({ id: 'dept-2' });

    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-1',
        subject: 'Unsafe area updated',
        description: 'Updated oil spill details',
        priority: 'Urgent',
        status: 'Resolved',
        departmentId: 'dept-2',
      },
      meta: { timestamp: '2026-02-24T14:10:00Z' },
    };

    await service['processInboundAsync']({
      payload,
      eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
      requestId: 'req-update-1',
      eventKey: 'event-update-1',
      correlationId: 'corr-update-1',
      ticketData: {
        id: 'zoho-1',
        ticketNumber: '101',
        subject: 'Unsafe area updated',
        description: 'Updated oil spill details',
        priority: 'Urgent',
        departmentId: 'dept-2',
      },
      isLegacyRoute: false,
    });

    expect(mappingFindUniqueMock).toHaveBeenCalledWith({
      where: { zohoTicketId: 'zoho-1' },
      select: expect.objectContaining({
        id: true,
        hseTaskId: true,
      }),
    });
    expect(riskAssessmentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'ra-1' },
      data: expect.objectContaining({
        status: GeneralStatusEnum.DONE,
        departmentId: 'dept-2',
        description:
          '[Zoho Subject] Unsafe area updated\n[Zoho Priority] Urgent\n[Zoho Description] Updated oil spill details',
        actionPlan:
          'Inbound Zoho Ticket zoho-1 mapped with severity=EXTREME',
      }),
    });
    expect(mappingUpdateMock).toHaveBeenCalledWith({
      where: { id: 'map-1' },
      data: expect.objectContaining({
        lastZohoStatus: 'Resolved',
        lastHseStatus: GeneralStatusEnum.DONE,
      }),
    });
    expect(updateWebhookLogMock).toHaveBeenCalledWith(
      'event-update-1',
      'PROCESSED',
    );
  });

  it('handles missing mapping on update without creating a new risk assessment', async () => {
    mappingFindUniqueMock.mockResolvedValueOnce(null);

    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-missing',
        subject: 'Orphan update',
        status: 'Open',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
      requestId: 'req-missing-1',
      eventKey: 'event-missing-1',
      correlationId: 'corr-missing-1',
      ticketData: {
        id: 'zoho-missing',
        ticketNumber: undefined,
        subject: 'Orphan update',
        description: undefined,
        priority: undefined,
        departmentId: undefined,
      },
      isLegacyRoute: false,
    });

    expect(riskAssessmentCreateMock).not.toHaveBeenCalled();
    expect(riskAssessmentUpdateMock).not.toHaveBeenCalled();
    expect(updateWebhookLogMock).toHaveBeenCalledWith(
      'event-missing-1',
      'FAILED',
      expect.objectContaining({
        errorSummary: expect.stringContaining('No risk assessment mapping found'),
      }),
    );
  });

  it('suppresses duplicate by request id for Ticket_Update', async () => {
    (validatorService.isDuplicateByRequestId as jest.Mock).mockResolvedValue(
      true,
    );

    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-2',
        subject: 'Duplicate update',
        status: 'Closed',
      },
      meta: {},
    };

    const result = await service.receiveWebhook(
      payload,
      ZOHO_EVENT_TYPES.TICKET_UPDATE,
      'req-dup',
      'corr-dup',
      false,
    );

    expect(result.message).toContain('duplicate request ignored');
    expect(createWebhookLogMock).not.toHaveBeenCalled();
    expect(riskAssessmentUpdateMock).not.toHaveBeenCalled();
  });

  it('uses configured inbound status mapping for Ticket_Update', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-3',
        subject: 'Status update',
        status: 'In Progress',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
      requestId: 'req-3',
      eventKey: 'event-3',
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

    expect(riskAssessmentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'ra-1' },
      data: expect.objectContaining({
        status: GeneralStatusEnum.WAITING_APPROVAL,
      }),
    });
  });

  it('falls back safely when inbound department cannot be resolved during update', async () => {
    departmentFindFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'dept-1' });

    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-4',
        subject: 'Department fallback',
        departmentId: 'missing-dept',
        status: 'Open',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
      requestId: 'req-4',
      eventKey: 'event-4',
      correlationId: 'corr-4',
      ticketData: {
        id: 'zoho-4',
        ticketNumber: undefined,
        subject: 'Department fallback',
        description: undefined,
        priority: undefined,
        departmentId: 'missing-dept',
      },
      isLegacyRoute: false,
    });

    expect(riskAssessmentUpdateMock).toHaveBeenCalledWith({
      where: { id: 'ra-1' },
      data: expect.objectContaining({
        departmentId: 'dept-1',
      }),
    });
  });

  it('stores inbound zoho status metadata for loop avoidance', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-5',
        subject: 'Loop avoidance',
        status: 'Closed',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: ZOHO_EVENT_TYPES.TICKET_UPDATE,
      requestId: 'req-5',
      eventKey: 'event-5',
      correlationId: 'corr-5',
      ticketData: {
        id: 'zoho-5',
        ticketNumber: undefined,
        subject: 'Loop avoidance',
        description: undefined,
        priority: undefined,
        departmentId: undefined,
      },
      isLegacyRoute: false,
    });

    expect(mappingUpdateMock).toHaveBeenCalledWith({
      where: { id: 'map-1' },
      data: expect.objectContaining({
        lastZohoStatus: 'Closed',
        lastHseStatus: GeneralStatusEnum.CLOSE,
      }),
    });
  });

  it('ignores unsupported events safely', async () => {
    const payload: ZohoWebhookDto = {
      data: {
        id: 'zoho-6',
        subject: 'Unsupported event',
      },
      meta: {},
    };

    await service['processInboundAsync']({
      payload,
      eventType: 'Unsupported_Event',
      requestId: 'req-6',
      eventKey: 'event-6',
      correlationId: 'corr-6',
      ticketData: {
        id: 'zoho-6',
        ticketNumber: undefined,
        subject: 'Unsupported event',
        description: undefined,
        priority: undefined,
        departmentId: undefined,
      },
      isLegacyRoute: false,
    });

    expect(updateWebhookLogMock).toHaveBeenCalledWith('event-6', 'PROCESSED', {
      errorSummary: 'Ignored unsupported event type: Unsupported_Event',
    });
    expect(riskAssessmentCreateMock).not.toHaveBeenCalled();
    expect(riskAssessmentUpdateMock).not.toHaveBeenCalled();
  });
});
