
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
} as unknown as ErrorHandlingService;

const mockDtoMapper = {
    createMapper: jest.fn().mockReturnValue((entity) => entity),
} as unknown as DtoMapperService;

describe('DispatchOrdersService', () => {
    let service: DispatchOrdersService;

    beforeEach(() => {
        service = new DispatchOrdersService(mockPrismaService, mockErrorHandler, mockDtoMapper);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should use default sorting by createdAt desc', async () => {
            // Arrange
            (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue([]);
            (mockPrismaService.dispatchOrder.count as jest.Mock).mockResolvedValue(0);

            // Act
            await service.findAll({});

            // Assert
            expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                })
            );
        });

        it('should filter by isActive when provided', async () => {
            // Arrange
            (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue([]);
            (mockPrismaService.dispatchOrder.count as jest.Mock).mockResolvedValue(0);

            // Act
            await service.findAll({ isActive: true });

            // Assert
            expect(mockPrismaService.dispatchOrder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isActive: true }),
                })
            );
        });

        it('should search by dispatchCode OR memo', async () => {
            // Arrange
            const searchTerm = 'test';
            (mockPrismaService.dispatchOrder.findMany as jest.Mock).mockResolvedValue([]);
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
                        ]
                    }),
                })
            );
        });
    });
});
