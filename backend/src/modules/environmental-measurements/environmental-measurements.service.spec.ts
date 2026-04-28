import { GeneralStatusEnum } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';

const mockPrismaService = {
  room: {
    findUnique: jest.fn(),
  },
  environmentalMeasurement: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaService;

const mockErrorHandler = {
  throwIfNotFoundById: jest.fn(),
} as unknown as ErrorHandlingService;

const mockDtoMapper = {} as DtoMapperService;

const mockSettingsHelper = {
  get: jest.fn(),
};

const mockMasterApprovalsService = {
  checkApprovalStatus: jest.fn(),
  checkApprovalRights: jest.fn(),
  submitApproval: jest.fn(),
};

describe('EnvironmentalMeasurementsService', () => {
  let service: EnvironmentalMeasurementsService;

  beforeEach(() => {
    service = new EnvironmentalMeasurementsService(
      mockPrismaService,
      mockErrorHandler,
      mockDtoMapper,
      mockSettingsHelper as never,
      mockMasterApprovalsService as never,
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a measurement with DRAFT status by default', async () => {
      const roomId = 'room-1';
      const userId = 'user-1';
      const date = '2026-04-15T00:00:00.000Z';

      (mockPrismaService.room.findUnique as jest.Mock).mockResolvedValue({
        id: roomId,
      });
      (
        mockPrismaService.environmentalMeasurement.create as jest.Mock
      ).mockResolvedValue({
        id: 'measurement-1',
        roomId,
        lighting: 420,
        noise: 48,
        humidity: 55,
        temperature: 24,
        remarks: 'Routine check',
        date: new Date(date),
        status: GeneralStatusEnum.DRAFT,
        isActive: true,
        createdAt: new Date(date),
        updatedAt: new Date(date),
        createdBy: userId,
        room: {
          id: roomId,
          name: 'Main Lobby',
          code: 'ROOM-LOBBY-001',
        },
        creator: {
          id: userId,
          firstName: 'Tech',
          lastName: 'One',
        },
      });

      await service.create(
        {
          roomId,
          lighting: 420,
          noise: 48,
          humidity: 55,
          temperature: 24,
          remarks: 'Routine check',
          date,
          isActive: true,
        },
        userId,
      );

      expect(
        mockPrismaService.environmentalMeasurement.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roomId,
            createdBy: userId,
            status: GeneralStatusEnum.DRAFT,
            date: new Date(date),
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should pass search and filter criteria to Prisma correctly', async () => {
      (
        mockPrismaService.environmentalMeasurement.findMany as jest.Mock
      ).mockResolvedValue([]);
      (
        mockPrismaService.environmentalMeasurement.count as jest.Mock
      ).mockResolvedValue(0);

      await service.findAll({
        page: 2,
        limit: 5,
        search: 'Lobby',
        status: GeneralStatusEnum.DRAFT,
        startDate: '2026-04-01',
        endDate: '2026-04-15',
        sortBy: 'date',
        sortOrder: 'desc',
      });

      expect(
        mockPrismaService.environmentalMeasurement.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: GeneralStatusEnum.DRAFT,
            OR: [
              { remarks: { contains: 'Lobby', mode: 'insensitive' } },
              { room: { name: { contains: 'Lobby', mode: 'insensitive' } } },
              { room: { code: { contains: 'Lobby', mode: 'insensitive' } } },
            ],
            date: expect.objectContaining({
              gte: new Date('2026-04-01'),
              lte: expect.any(Date),
            }),
          }),
          orderBy: { date: 'desc' },
          skip: 5,
          take: 5,
        }),
      );
    });
  });
});
