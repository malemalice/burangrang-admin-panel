import { AccessLogsService } from './access-logs.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';

const identity = <T>(x: T): T => x;

const mockPrisma = {
  accessLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  throwIfNotFoundById: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createMapper: jest.fn().mockReturnValue(identity),
  createArrayMapper: jest.fn().mockReturnValue((arr: unknown[]) => arr),
  createPaginatedMapper: jest.fn().mockReturnValue((data: { data: unknown[]; meta: unknown }) => data),
  createSimpleMapper: jest.fn().mockReturnValue(identity),
} as unknown as DtoMapperService;

describe('AccessLogsService', () => {
  let service: AccessLogsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccessLogsService(
      mockPrisma,
      mockErrorHandler,
      mockDtoMapper,
    );
  });

  describe('createAccessLog', () => {
    it('should create an access log entry', async () => {
      (mockPrisma.accessLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

      await service.createAccessLog({
        userId: 'user-1',
        method: 'GET',
        endpoint: '/users',
        statusCode: 200,
        payload: { query: { page: '1' } },
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        executionTime: 10,
      });

      expect(mockPrisma.accessLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.accessLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          method: 'GET',
          endpoint: '/users',
          statusCode: 200,
          payload: { query: { page: '1' } },
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          executionTime: 10,
        },
      });
    });

    it('should not throw when create fails', async () => {
      (mockPrisma.accessLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.createAccessLog({ method: 'GET', endpoint: '/x' })).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should return paginated access logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          method: 'GET',
          endpoint: '/users',
          statusCode: 200,
          payload: null,
          ipAddress: null,
          userAgent: null,
          executionTime: null,
          createdAt: new Date(),
          user: null,
        },
      ];
      (mockPrisma.accessLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (mockPrisma.accessLog.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockLogs);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(mockPrisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: {},
        }),
      );
    });

    it('should apply filters when provided', async () => {
      (mockPrisma.accessLog.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.accessLog.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({
        userId: 'user-1',
        method: 'POST',
        endpoint: 'risk',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });

      expect(mockPrisma.accessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            method: 'POST',
            endpoint: { contains: 'risk', mode: 'insensitive' },
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an access log by id', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        method: 'GET',
        endpoint: '/users',
        statusCode: 200,
        payload: null,
        ipAddress: null,
        userAgent: null,
        executionTime: null,
        createdAt: new Date(),
        user: null,
      };
      (mockPrisma.accessLog.findUnique as jest.Mock).mockResolvedValue(mockLog);

      const result = await service.findOne('log-1');

      expect(result).toEqual(mockLog);
      expect(mockErrorHandler.throwIfNotFoundById).not.toHaveBeenCalled();
    });

    it('should call throwIfNotFoundById when log not found', async () => {
      (mockPrisma.accessLog.findUnique as jest.Mock).mockResolvedValue(null);

      await service.findOne('missing');

      expect(mockErrorHandler.throwIfNotFoundById).toHaveBeenCalledWith(
        'AccessLog',
        'missing',
        null,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      (mockPrisma.accessLog.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50);
      (mockPrisma.accessLog.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { method: 'GET', _count: { id: 60 } },
          { method: 'POST', _count: { id: 40 } },
        ])
        .mockResolvedValueOnce([
          { endpoint: '/users', _count: { id: 20 } },
          { endpoint: '/roles', _count: { id: 15 } },
        ]);

      const result = await service.getStatistics();

      expect(result.total).toBe(100);
      expect(result.byMethod).toEqual({ GET: 60, POST: 40 });
      expect(result.topEndpoints).toEqual(
        expect.arrayContaining([
          { endpoint: '/users', count: 20 },
          { endpoint: '/roles', count: 15 },
        ]),
      );
      expect(result.recentCount).toBe(50);
    });
  });
});
