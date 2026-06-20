import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccessLogsService } from '../../access-logs/services/access-logs.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';
import { IncidentZohoSyncService } from './incident-zoho-sync.service';

describe('IncidentZohoSyncService', () => {
    let prismaService: PrismaService;
    let zohoConfigService: ZohoConfigService;
    let zohoDeskApiClient: ZohoDeskApiClient;
    let service: IncidentZohoSyncService;

    let mappingFindUniqueMock: jest.Mock;
    let mappingCreateMock: jest.Mock;
    let outboundCreateMock: jest.Mock;
    let createRequestMock: jest.Mock;
    let createAccessLogMock: jest.Mock;

    beforeEach(() => {
        mappingFindUniqueMock = jest.fn().mockResolvedValue(null);
        mappingCreateMock = jest.fn().mockResolvedValue({
            id: 'map-1',
            zohoTicketId: '2001',
            zohoTicketNumber: 'REQ-2001',
        });
        outboundCreateMock = jest.fn().mockResolvedValue({ id: 'job-1' });
        createRequestMock = jest.fn().mockResolvedValue({
            request: {
                id: '2001',
                ticket_number: 'REQ-2001',
            },
            response_status: {
                status_code: 2000,
            },
        });
        createAccessLogMock = jest.fn().mockResolvedValue(undefined);

        prismaService = {
            zohoTicketIncidentMap: {
                findUnique: mappingFindUniqueMock,
                create: mappingCreateMock,
            },
            zohoOutboundJob: {
                create: outboundCreateMock,
            },
        } as unknown as PrismaService;

        zohoConfigService = {
            getBoolean: jest.fn((key: string, defaultValue: boolean) => {
                if (key === SETTINGS_KEYS.ZOHO_SYNC_ENABLED) {
                    return Promise.resolve(true);
                }

                return Promise.resolve(defaultValue);
            }),
            getString: jest.fn((key: string, defaultValue = '') => {
                if (key === SETTINGS_KEYS.SDP_AUTHTOKEN) {
                    return Promise.resolve('sdp-token');
                }

                return Promise.resolve(defaultValue);
            }),
            getJsonRecord: jest.fn(
                (
                    _key: string,
                    defaultValue: Record<string, string>,
                ): Promise<Record<string, string>> => Promise.resolve(defaultValue),
            ),
            getNumber: jest.fn((key: string, defaultValue: number) => {
                if (key === SETTINGS_KEYS.ZOHO_MAX_RETRIES) {
                    return Promise.resolve(6);
                }

                return Promise.resolve(defaultValue);
            }),
        } as unknown as ZohoConfigService;

        zohoDeskApiClient = {
            createRequest: createRequestMock,
        } as unknown as ZohoDeskApiClient;

        const accessLogsService = {
            createAccessLog: createAccessLogMock,
        } as unknown as AccessLogsService;

        service = new IncidentZohoSyncService(
            prismaService,
            zohoConfigService,
            zohoDeskApiClient,
            accessLogsService,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('creates zoho ticket and mapping for risk assessment', async () => {
        const result = await service.createTicketForIncident({
            incidentId: 'ra-1',
            payload: {
                subject: 'Risk Assessment RA-001',
                description: '<div>Risk Assessment Code: RA-001</div>',
                status: { name: 'Open' },
                group: { id: 'dept-1', name: 'HSE' },
            },
            lastHseStatus: GeneralStatusEnum.OPEN,
            correlationId: 'corr-create-1',
        });

        expect(createRequestMock).toHaveBeenCalledWith(
            {
                subject: 'Risk Assessment RA-001',
                description: '<div>Risk Assessment Code: RA-001</div>',
                status: { name: 'Open' },
                group: { id: 'dept-1', name: 'HSE' },
            },
            'corr-create-1',
        );
        expect(mappingCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                zohoTicketId: '2001',
                zohoTicketNumber: 'REQ-2001',
                hseTaskId: 'ra-1',
                lastZohoStatus: 'Open',
                lastHseStatus: GeneralStatusEnum.OPEN,
                rawPayload: expect.objectContaining({
                    requestPayload: expect.objectContaining({
                        subject: 'Risk Assessment RA-001',
                    }),
                    responsePayload: expect.objectContaining({
                        request: expect.objectContaining({
                            id: '2001',
                        }),
                    }),
                }) as unknown as Prisma.InputJsonValue,
            }),
        });
        expect(result).toEqual({
            mappingId: 'map-1',
            zohoTicketId: '2001',
            zohoTicketNumber: 'REQ-2001',
        });
        expect(createAccessLogMock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                endpoint: '/api/v3/requests',
                statusCode: 200,
                userAgent: 'IncidentZohoSyncService',
                payload: expect.objectContaining({
                    source: 'incident_zoho_create',
                    correlationId: 'corr-create-1',
                    incidentId: 'ra-1',
                    result: 'success',
                    ticketId: '2001',
                }),
            }),
        );
    });

    it('returns existing mapping without creating a new ticket', async () => {
        mappingFindUniqueMock.mockResolvedValueOnce({
            id: 'map-existing',
            zohoTicketId: '5001',
            lastZohoStatus: 'Open',
        });

        const result = await service.createTicketForIncident({
            incidentId: 'ra-1',
            payload: {
                subject: 'Ignored',
            },
        });

        expect(createRequestMock).not.toHaveBeenCalled();
        expect(mappingCreateMock).not.toHaveBeenCalled();
        expect(result).toEqual({
            mappingId: 'map-existing',
            zohoTicketId: '5001',
            zohoTicketNumber: undefined,
        });
    });

    it('returns null when sync is disabled', async () => {
        (zohoConfigService.getBoolean as jest.Mock).mockResolvedValueOnce(false);

        const result = await service.createTicketForIncident({
            incidentId: 'ra-1',
            payload: {
                subject: 'Risk Assessment RA-001',
            },
        });

        expect(result).toBeNull();
        expect(createRequestMock).not.toHaveBeenCalled();
        expect(mappingCreateMock).not.toHaveBeenCalled();
        expect(createAccessLogMock).not.toHaveBeenCalled();
    });

    it('returns null and logs skip when SDP_AUTHTOKEN is not configured', async () => {
        (zohoConfigService.getString as jest.Mock).mockResolvedValueOnce('');

        const result = await service.createTicketForIncident({
            incidentId: 'ra-1',
            payload: {
                subject: 'Risk Assessment RA-001',
            },
            correlationId: 'corr-missing-token-1',
        });

        expect(result).toBeNull();
        expect(createRequestMock).not.toHaveBeenCalled();
        expect(mappingCreateMock).not.toHaveBeenCalled();
        expect(createAccessLogMock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                endpoint: '/api/v3/requests',
                statusCode: 200,
                userAgent: 'IncidentZohoSyncService',
                payload: expect.objectContaining({
                    source: 'incident_zoho_create_skip',
                    correlationId: 'corr-missing-token-1',
                    incidentId: 'ra-1',
                    result: 'skipped_missing_sdp_authtoken',
                    errorMessage: 'Zoho create skipped: SDP_AUTHTOKEN not configured',
                }),
            }),
        );
    });

    it('creates access log when zoho create request fails before response', async () => {
        createRequestMock.mockRejectedValueOnce({
            statusCode: 504,
            responseBody: {
                message: 'fetch failed',
                code: 'ETIMEDOUT',
            },
            message: 'SDP request failed before response: fetch failed',
        });

        await expect(
            service.createTicketForIncident({
                incidentId: 'ra-timeout',
                payload: {
                    subject: 'Risk Assessment Timeout',
                    status: { name: 'Open' },
                },
                correlationId: 'corr-timeout-1',
            }),
        ).rejects.toMatchObject({
            statusCode: 504,
        });

        expect(createAccessLogMock).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'POST',
                endpoint: '/api/v3/requests',
                statusCode: 504,
                userAgent: 'IncidentZohoSyncService',
                payload: expect.objectContaining({
                    source: 'incident_zoho_create',
                    correlationId: 'corr-timeout-1',
                    incidentId: 'ra-timeout',
                    result: 'failed',
                    errorMessage: 'Unknown error',
                    responsePayload: expect.objectContaining({
                        message: 'fetch failed',
                        code: 'ETIMEDOUT',
                    }),
                }),
            }),
        );
    });

    it('throws when zoho create response does not contain ticket id', async () => {
        createRequestMock.mockResolvedValueOnce({
            response_status: {
                status_code: 2000,
            },
        });

        await expect(
            service.createTicketForIncident({
                incidentId: 'ra-1',
                payload: {
                    subject: 'Risk Assessment RA-001',
                },
            }),
        ).rejects.toThrow('Zoho create request response does not contain ticket id');

        expect(mappingCreateMock).not.toHaveBeenCalled();
    });

    it('recovers from duplicate mapping creation by returning existing mapping', async () => {
        mappingCreateMock.mockRejectedValueOnce({
            code: 'P2002',
        });
        mappingFindUniqueMock
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 'map-duplicate',
                zohoTicketId: '2001',
                lastZohoStatus: 'Open',
            });

        const result = await service.createTicketForIncident({
            incidentId: 'ra-1',
            payload: {
                subject: 'Risk Assessment RA-001',
                status: { name: 'Open' },
            },
        });

        expect(result).toEqual({
            mappingId: 'map-duplicate',
            zohoTicketId: '2001',
            zohoTicketNumber: undefined,
        });
    });
});
