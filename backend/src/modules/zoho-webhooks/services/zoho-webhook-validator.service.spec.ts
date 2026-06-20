import { PrismaService } from '../../../core/prisma/prisma.service';
import { ZohoWebhookDto } from '../dto/zoho-webhook.dto';
import { ZohoWebhookValidatorService } from './zoho-webhook-validator.service';

describe('ZohoWebhookValidatorService', () => {
    let prismaService: PrismaService;
    let service: ZohoWebhookValidatorService;

    beforeEach(() => {
        prismaService = {
            tZohoWebhookLogs: {
                findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 'log-1' }),
                update: jest.fn().mockResolvedValue({ id: 'log-1' }),
            },
            zohoTicketIncidentMap: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
        } as unknown as PrismaService;

        service = new ZohoWebhookValidatorService(prismaService);
    });

    it('builds deterministic event key for same input', () => {
        const payload: ZohoWebhookDto = {
            data: { id: 'z-1', subject: 'A' },
            meta: { timestamp: '2026-02-24T14:00:00Z' },
        };

        const first = service.buildEventKey('Ticket_Add', 'z-1', 'req-1', payload);
        const second = service.buildEventKey('Ticket_Add', 'z-1', 'req-1', payload);

        expect(first).toBe(second);
    });

    it('checks duplicate by request id and event key', async () => {
        (prismaService.tZohoWebhookLogs.findUnique as jest.Mock)
            .mockResolvedValueOnce({ id: 'x' })
            .mockResolvedValueOnce({ id: 'y' });

        await expect(service.isDuplicateByRequestId('req-dup')).resolves.toBe(true);
        await expect(service.isDuplicateByEventKey('event-dup')).resolves.toBe(true);
    });

    it('sanitizes payload and persists webhook log', async () => {
        const payload: ZohoWebhookDto = {
            data: { id: 'z-1' },
            meta: {},
        };

        await service.createWebhookLog({
            requestId: 'req-1',
            eventType: 'Ticket_Add',
            eventKey: 'event-1',
            ticketId: 'z-1',
            correlationId: 'corr-1',
            status: 'RECEIVED',
            payload: {
                ...payload,
                authorization: 'secret-token',
            } as unknown as ZohoWebhookDto,
        });

        expect(prismaService.tZohoWebhookLogs.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    payloadSanitized: expect.objectContaining({
                        authorization: '[REDACTED]',
                    }),
                }),
            }),
        );
    });
});
