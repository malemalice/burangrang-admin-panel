import { DispatchOrdersService } from './dispatch-orders.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';

// Mock dependencies
const mockPrismaService = {
  dispatchOrder: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  throwIfNotFoundById: jest.fn(),
  throwConflictCustom: jest.fn(),
  safeExecute: jest.fn(async (fn: () => Promise<unknown>) => fn()),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
  createMapper: jest.fn().mockReturnValue((entity: unknown) => entity),
  createSimpleMapper: jest.fn().mockReturnValue((entity: unknown) => entity),
} as unknown as DtoMapperService;

describe('DispatchOrdersService', () => {
  let service: DispatchOrdersService;

  beforeEach(() => {
    service = new DispatchOrdersService(
      mockPrismaService,
      mockErrorHandler,
      mockDtoMapper,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    const year = new Date().getFullYear();

    it('should set status to WAITING_APPROVAL and assign DO-{year}-0001 when no codes exist for that year', async () => {
      (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.dispatchOrder.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        dispatchCode: `DO-${year}-0001`,
        status: 'WAITING_APPROVAL',
      });

      await service.create(
        {
          dispatchDate: new Date().toISOString(),
          quantity: 10,
        },
        'user-1',
      );

      expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith({
        where: { dispatchCode: { startsWith: `DO-${year}-` } },
        select: { dispatchCode: true },
      });
      expect(mockPrismaService.dispatchOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'WAITING_APPROVAL',
            orderedBy: 'user-1',
            createdBy: 'user-1',
            dispatchCode: `DO-${year}-0001`,
          }),
        }),
      );
    });

    it('should use numeric max suffix when 3-digit seed and 4-digit codes coexist (next after 007 and 0008 is 0009)', async () => {
      (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue([
        { dispatchCode: `DO-${year}-007` },
        { dispatchCode: `DO-${year}-0008` },
      ]);
      (mockPrismaService.dispatchOrder.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        dispatchCode: `DO-${year}-0009`,
        status: 'WAITING_APPROVAL',
      });

      await service.create(
        { dispatchDate: new Date().toISOString(), quantity: 1 },
        'user-1',
      );

      expect(mockPrismaService.dispatchOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dispatchCode: `DO-${year}-0009`,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should use default sorting by createdAt desc', async () => {
      // Arrange
      (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (mockPrismaService.dispatchOrder.count as jest.Mock).mockResolvedValue(0);

      // Act
      await service.findAll({});

      // Assert
      expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should filter by isActive when provided', async () => {
      // Arrange
      (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (mockPrismaService.dispatchOrder.count as jest.Mock).mockResolvedValue(0);

      // Act
      await service.findAll({ isActive: true });

      // Assert
      expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by dispatchCode OR memo', async () => {
      // Arrange
      const searchTerm = 'test';
      (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (mockPrismaService.dispatchOrder.count as jest.Mock).mockResolvedValue(0);

      // Act
      await service.findAll({ search: searchTerm });

      // Assert
      expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { dispatchCode: { contains: searchTerm, mode: 'insensitive' } },
              { memo: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });
});
