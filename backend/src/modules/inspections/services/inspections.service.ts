/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateInspectionDto } from '../dto/create-inspection.dto';
import { UpdateInspectionDto } from '../dto/update-inspection.dto';
import { InspectionDto } from '../dto/inspection.dto';
import { CreateInspectionItemDto } from '../dto/create-inspection-item.dto';
import { UpdateInspectionItemDto } from '../dto/update-inspection-item.dto';
import { InspectionItemDto } from '../dto/inspection-item.dto';
import { CreateInspectionImageDto } from '../dto/create-inspection-image.dto';
import { UpdateInspectionImageDto } from '../dto/update-inspection-image.dto';
import { InspectionImageDto } from '../dto/inspection-image.dto';
import { CreateInspectionInspectorDto } from '../dto/create-inspection-inspector.dto';
import { UpdateInspectionInspectorDto } from '../dto/update-inspection-inspector.dto';
import { InspectionInspectorDto } from '../dto/inspection-inspector.dto';
import { Prisma, GeneralStatusEnum, RiskMitigationRecord } from '@prisma/client';
import { RemindersService } from '../../reminders/reminders.service';
import {
  ReminderRepeatTypeEnum,
  ReminderTargetTypeEnum,
} from '../../reminders/dto/reminder.dto';
import { RiskMitigationDataDto, RiskMitigationRecordDto } from '../../risk-assessment/dto/risk-mitigation-data.dto';

// Entity type constant for inspection items
const INSPECTION_ITEM_ENTITY = 'INSPECTION_ITEM';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  areaId?: string;
  status?: GeneralStatusEnum;
}

interface FindAllItemsOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: GeneralStatusEnum;
  assignedDepartmentId?: string;
  assigneeId?: string;
  riskId?: string;
  riskCategoryId?: string;
  inspectionCode?: string;
  search?: string;
}

@Injectable()
export class InspectionsService {
  // Initialize mappers in constructor
  private inspectionMapper: (entity: any) => InspectionDto;
  private inspectionItemMapper: (entity: any) => InspectionItemDto;
  private inspectionImageMapper: (entity: any) => InspectionImageDto;
  private inspectionInspectorMapper: (entity: any) => InspectionInspectorDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly remindersService: RemindersService,
  ) {
    // Initialize image mapper first (used in item mapper)
    this.inspectionImageMapper =
      this.dtoMapper.createSimpleMapper(InspectionImageDto);

    // Initialize item mapper with nested image mapping
    this.inspectionItemMapper = this.dtoMapper.createRelationMapper(
      InspectionItemDto,
      {
        inspection: {
          mapper: (inspection: any) => inspection,
          isArray: false,
        },
        riskCategory: {
          mapper: (riskCategory: any) => riskCategory,
          isArray: false,
        },
        risk: {
          mapper: (risk: any) => risk,
          isArray: false,
        },
        assignedDepartment: {
          mapper: (department: any) => department,
          isArray: false,
        },
        assignee: {
          mapper: (assignee: any) => assignee,
          isArray: false,
        },
        images: {
          mapper: (image: any) => this.inspectionImageMapper(image),
          isArray: true,
        },
      },
    );

    // Initialize inspector mapper
    this.inspectionInspectorMapper = this.dtoMapper.createRelationMapper(
      InspectionInspectorDto,
      {
        inspector: {
          mapper: (inspector: any) => inspector,
          isArray: false,
        },
      },
    );

    // Initialize inspection mapper with nested item and inspector mapping
    this.inspectionMapper = this.dtoMapper.createRelationMapper(
      InspectionDto,
      {
        area: {
          mapper: (area: any) => area,
          isArray: false,
        },
        creator: {
          mapper: (creator: any) => creator,
          isArray: false,
        },
        items: {
          mapper: (item: any) => this.inspectionItemMapper(item),
          isArray: true,
        },
        inspectors: {
          mapper: (inspector: any) => this.inspectionInspectorMapper(inspector),
          isArray: true,
        },
      },
    );
  }

  async create(
    createInspectionDto: CreateInspectionDto,
    userId: string,
  ): Promise<InspectionDto> {
    const { items, inspectors, ...data } = createInspectionDto;

    const inspection = await this.prisma.inspection.create({
      data: {
        ...data,
        createdBy: userId,
        ...(items && items.length > 0 && {
          items: {
            create: items.map((item) => {
              const { images, ...itemData } = item;
              const createData: any = { ...itemData };
              if (images && images.length > 0) {
                createData.images = {
                  create: images.map((img) => ({
                    imageUrl: img.imageUrl,
                    caption: img.caption || null,
                    type: img.type || 'GENERAL',
                    order: img.order,
                  })),
                };
              }
              return createData;
            }),
          },
        }),
        ...(inspectors && inspectors.length > 0 && {
          inspectors: {
            create: inspectors.map((inspector) => ({
              ...inspector,
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            riskCategory: true,
            risk: true,
            assignedDepartment: true,
            assignee: true,
            images: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        inspectors: {
          include: {
            inspector: true,
          },
          orderBy: { order: 'asc' },
        },
        area: true,
        creator: true,
      },
    });

    // Create reminder if status is SCHEDULED
    if (inspection.status === GeneralStatusEnum.SCHEDULED) {
      const reminderUserId = userId; // Use creator as reminder recipient
      await this.createReminderForInspection(
        inspection.id,
        inspection.inspectionDate,
        reminderUserId,
        inspection.code,
      );
    }

    return this.inspectionMapper(inspection);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: InspectionDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'code',
      sortOrder = 'asc',
      isActive,
      areaId,
      status,
    } = options || {};

    const where: Prisma.InspectionWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (areaId) {
      where.areaId = areaId;
    }
    if (status) {
      where.status = status;
    }

    const [inspections, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        include: {
          items: {
            include: {
              riskCategory: true,
              risk: true,
              assignedDepartment: true,
              assignee: true,
              images: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          inspectors: {
            include: {
              inspector: true,
            },
            orderBy: { order: 'asc' },
          },
          area: true,
          creator: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inspection.count({ where }),
    ]);

    return {
      data: inspections.map((inspection) => this.inspectionMapper(inspection)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<InspectionDto> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            riskCategory: true,
            risk: true,
            assignedDepartment: true,
            assignee: true,
            images: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        inspectors: {
          include: {
            inspector: true,
          },
          orderBy: { order: 'asc' },
        },
        area: true,
        creator: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Inspection', id, inspection);

    return this.inspectionMapper(inspection);
  }

  async update(
    id: string,
    updateInspectionDto: UpdateInspectionDto,
  ): Promise<InspectionDto> {
    const { items, inspectors, ...data } = updateInspectionDto;

    // First, find the inspection to update
    const existingInspection = await this.prisma.inspection.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Inspection', id, existingInspection);

    // Track status and date changes for reminder management
    const oldStatus = existingInspection.status;
    const newStatus = data.status;
    const statusChangedToScheduled =
      oldStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus === GeneralStatusEnum.SCHEDULED;
    const statusChangedFromScheduled =
      oldStatus === GeneralStatusEnum.SCHEDULED &&
      newStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus !== undefined;
    const inspectionDateChanged =
      data.inspectionDate &&
      data.inspectionDate.getTime() !==
        existingInspection.inspectionDate.getTime();

    // Update the inspection and its related data
    const inspection = await this.prisma.inspection.update({
      where: { id },
      data: {
        ...data,
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((item) => {
              const { images, ...itemData } = item;
              const createData: any = { ...itemData };
              if (images && images.length > 0) {
                createData.images = {
                  create: images.map((img) => ({
                    imageUrl: img.imageUrl,
                    caption: img.caption || null,
                    type: img.type || 'GENERAL',
                    order: img.order,
                  })),
                };
              }
              return createData;
            }),
          },
        }),
        ...(inspectors !== undefined && {
          inspectors: {
            deleteMany: {},
            create: inspectors.map((inspector) => ({
              ...inspector,
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            riskCategory: true,
            risk: true,
            assignedDepartment: true,
            assignee: true,
            images: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        inspectors: {
          include: {
            inspector: true,
          },
          orderBy: { order: 'asc' },
        },
        area: true,
        creator: true,
      },
    });

    // Handle reminder creation/deletion based on status changes
    if (statusChangedFromScheduled) {
      // Status changed from SCHEDULED to something else - delete reminders
      await this.deleteRemindersForInspection(id);
    } else if (statusChangedToScheduled) {
      // Status changed to SCHEDULED - create reminder
      const reminderUserId = inspection.createdBy;
      await this.createReminderForInspection(
        inspection.id,
        inspection.inspectionDate,
        reminderUserId,
        inspection.code,
      );
    } else if (
      inspection.status === GeneralStatusEnum.SCHEDULED &&
      inspectionDateChanged
    ) {
      // Status is still SCHEDULED but inspectionDate changed - delete old and create new reminder
      await this.deleteRemindersForInspection(id);
      const reminderUserId = inspection.createdBy;
      await this.createReminderForInspection(
        inspection.id,
        inspection.inspectionDate,
        reminderUserId,
        inspection.code,
      );
    }

    return this.inspectionMapper(inspection);
  }

  async remove(id: string): Promise<void> {
    // First check if the inspection exists
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            images: true,
          },
        },
        inspectors: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Inspection', id, inspection);

    // Delete all reminders associated with this inspection
    await this.deleteRemindersForInspection(id);

    // Delete all related items and their images first (CASCADE will handle images)
    await this.prisma.inspectionItem.deleteMany({
      where: { inspectionId: id },
    });

    // Delete all related inspectors
    await this.prisma.inspectionInspector.deleteMany({
      where: { inspectionId: id },
    });

    // Then delete the inspection
    await this.prisma.inspection.delete({
      where: { id },
    });
  }

  // Inspection Items CRUD operations
  async createItem(
    inspectionId: string,
    createItemDto: CreateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    // Verify inspection exists
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection',
      inspectionId,
      inspection,
    );

    // Extract images and mitigation from DTO
    const { images, mitigation, dueDateAt, ...itemData } = createItemDto;

    // Prepare data for creation
    const createData: any = {
      ...itemData,
      inspectionId,
      dueDateAt: dueDateAt ? new Date(dueDateAt) : null,
    };

    // Handle images with nested create if provided
    if (images && images.length > 0) {
      createData.images = {
        create: images.map((img) => ({
          imageUrl: img.imageUrl,
          caption: img.caption || null,
          type: img.type || 'GENERAL',
          order: img.order,
        })),
      };
    }

    const item = await this.prisma.inspectionItem.create({
      data: createData,
      include: {
        riskCategory: true,
        risk: true,
        assignedDepartment: true,
        assignee: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Create mitigation record if provided
    let mitigationRecord: RiskMitigationRecord | null = null;
    if (mitigation) {
      mitigationRecord = await this.createMitigationRecord(item.id, mitigation);
    }

    return this.mapItemToDto(item, mitigationRecord);
  }

  async findAllItems(
    inspectionId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    },
  ): Promise<{
    data: InspectionItemDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    // Verify inspection exists
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection',
      inspectionId,
      inspection,
    );

    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      search,
    } = options || {};

    // Valid sortable fields for InspectionItem
    const validSortFields = [
      'id',
      'inspectionId',
      'riskCategoryId',
      'riskId',
      'assignedDepartmentId',
      'assigneeId',
      'order',
    ];

    // Validate and sanitize sortBy
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'order';

    const where: Prisma.InspectionItemWhereInput = {
      inspectionId,
      ...(search && {
        OR: [
          {
            risk: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            riskCategory: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            followUpNotes: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inspectionItem.findMany({
        where,
        include: {
          riskCategory: true,
          risk: true,
          assignedDepartment: true,
          assignee: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: {
          [validatedSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inspectionItem.count({ where }),
    ]);

    // Fetch mitigation records for all items
    const itemIds = items.map((item) => item.id);
    const mitigationRecords = await this.prisma.riskMitigationRecord.findMany({
      where: {
        entity: INSPECTION_ITEM_ENTITY,
        entityId: { in: itemIds },
        isActive: true,
      },
    });

    // Create a map of itemId -> mitigation record
    const mitigationMap = new Map<string, RiskMitigationRecord>();
    mitigationRecords.forEach((record) => {
      mitigationMap.set(record.entityId, record);
    });

    return {
      data: items.map((item) => this.mapItemToDto(item, mitigationMap.get(item.id))),
      meta: { total, page, limit },
    };
  }

  async findOneItem(
    inspectionId: string,
    itemId: string,
  ): Promise<InspectionItemDto> {
    const item = await this.prisma.inspectionItem.findFirst({
      where: {
        id: itemId,
        inspectionId,
      },
      include: {
        riskCategory: true,
        risk: true,
        assignedDepartment: true,
        assignee: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Item',
      `ID ${itemId}`,
      item,
    );

    // Fetch mitigation record for the item
    const mitigationRecord = await this.getMitigationRecord(itemId);

    return this.mapItemToDto(item, mitigationRecord);
  }

  async updateItem(
    inspectionId: string,
    itemId: string,
    updateItemDto: UpdateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    // Verify item exists and belongs to the inspection
    const existingItem = await this.prisma.inspectionItem.findFirst({
      where: {
        id: itemId,
        inspectionId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Item',
      `ID ${itemId}`,
      existingItem,
    );

    // Extract images, mitigation, and dueDateAt from DTO
    const { images, mitigation, dueDateAt, ...itemData } = updateItemDto;

    // Prepare data for update
    const updateData: any = {
      ...itemData,
      ...(dueDateAt !== undefined && { dueDateAt: dueDateAt ? new Date(dueDateAt) : null }),
    };

    // Handle images: delete all existing and create new ones
    // This is necessary since frontend doesn't send image IDs
    if (images !== undefined) {
      updateData.images = {
        deleteMany: {}, // Delete all existing images
        create: images.map((img) => ({
          imageUrl: img.imageUrl,
          caption: img.caption || null,
          type: img.type || 'GENERAL',
          order: img.order,
        })),
      };
    }

    const item = await this.prisma.inspectionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        riskCategory: true,
        risk: true,
        assignedDepartment: true,
        assignee: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Handle mitigation record update/create/delete
    let mitigationRecord: RiskMitigationRecord | null = null;
    if (mitigation !== undefined) {
      if (mitigation === null) {
        // Delete mitigation record if explicitly set to null
        await this.deleteMitigationRecord(itemId);
      } else {
        // Update or create mitigation record
        mitigationRecord = await this.upsertMitigationRecord(itemId, mitigation);
      }
    } else {
      // Fetch existing mitigation record if not provided
      mitigationRecord = await this.getMitigationRecord(itemId);
    }

    return this.mapItemToDto(item, mitigationRecord);
  }

  async removeItem(inspectionId: string, itemId: string): Promise<void> {
    // Verify item exists and belongs to the inspection
    const item = await this.prisma.inspectionItem.findFirst({
      where: {
        id: itemId,
        inspectionId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Item',
      `ID ${itemId}`,
      item,
    );

    // Delete associated mitigation record first
    await this.deleteMitigationRecord(itemId);

    // CASCADE will handle images deletion
    await this.prisma.inspectionItem.delete({
      where: { id: itemId },
    });
  }

  // Inspection Images CRUD operations
  async createImage(
    inspectionItemId: string,
    createImageDto: CreateInspectionImageDto,
  ): Promise<InspectionImageDto> {
    // Verify inspection item exists
    const item = await this.prisma.inspectionItem.findUnique({
      where: { id: inspectionItemId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection Item',
      inspectionItemId,
      item,
    );

    const image = await this.prisma.inspectionImage.create({
      data: {
        ...createImageDto,
        inspectionItemId,
      },
    });

    return this.inspectionImageMapper(image);
  }

  async findAllImages(
    inspectionItemId: string,
  ): Promise<InspectionImageDto[]> {
    // Verify inspection item exists
    const item = await this.prisma.inspectionItem.findUnique({
      where: { id: inspectionItemId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection Item',
      inspectionItemId,
      item,
    );

    const images = await this.prisma.inspectionImage.findMany({
      where: { inspectionItemId },
      orderBy: { order: 'asc' },
    });

    return images.map((image) => this.inspectionImageMapper(image));
  }

  async findOneImage(
    inspectionItemId: string,
    imageId: string,
  ): Promise<InspectionImageDto> {
    const image = await this.prisma.inspectionImage.findFirst({
      where: {
        id: imageId,
        inspectionItemId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Image',
      `ID ${imageId}`,
      image,
    );

    return this.inspectionImageMapper(image);
  }

  async updateImage(
    inspectionItemId: string,
    imageId: string,
    updateImageDto: UpdateInspectionImageDto,
  ): Promise<InspectionImageDto> {
    // Verify image exists and belongs to the inspection item
    const existingImage = await this.prisma.inspectionImage.findFirst({
      where: {
        id: imageId,
        inspectionItemId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Image',
      `ID ${imageId}`,
      existingImage,
    );

    const image = await this.prisma.inspectionImage.update({
      where: { id: imageId },
      data: updateImageDto,
    });

    return this.inspectionImageMapper(image);
  }

  async removeImage(inspectionItemId: string, imageId: string): Promise<void> {
    // Verify image exists and belongs to the inspection item
    const image = await this.prisma.inspectionImage.findFirst({
      where: {
        id: imageId,
        inspectionItemId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Image',
      `ID ${imageId}`,
      image,
    );

    await this.prisma.inspectionImage.delete({
      where: { id: imageId },
    });
  }

  // Inspection Inspectors CRUD operations
  async createInspector(
    inspectionId: string,
    createInspectorDto: CreateInspectionInspectorDto,
  ): Promise<InspectionInspectorDto> {
    // Verify inspection exists
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection',
      inspectionId,
      inspection,
    );

    const inspector = await this.prisma.inspectionInspector.create({
      data: {
        ...createInspectorDto,
        inspectionId,
      },
      include: {
        inspector: true,
      },
    });

    return this.inspectionInspectorMapper(inspector);
  }

  async findAllInspectors(
    inspectionId: string,
  ): Promise<InspectionInspectorDto[]> {
    // Verify inspection exists
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
    });

    this.errorHandler.throwIfNotFoundById(
      'Inspection',
      inspectionId,
      inspection,
    );

    const inspectors = await this.prisma.inspectionInspector.findMany({
      where: { inspectionId },
      include: {
        inspector: true,
      },
      orderBy: { order: 'asc' },
    });

    return inspectors.map((inspector) =>
      this.inspectionInspectorMapper(inspector),
    );
  }

  async findOneInspector(
    inspectionId: string,
    inspectorId: string,
  ): Promise<InspectionInspectorDto> {
    const inspector = await this.prisma.inspectionInspector.findFirst({
      where: {
        id: inspectorId,
        inspectionId,
      },
      include: {
        inspector: true,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Inspector',
      `ID ${inspectorId}`,
      inspector,
    );

    return this.inspectionInspectorMapper(inspector);
  }

  async updateInspector(
    inspectionId: string,
    inspectorId: string,
    updateInspectorDto: UpdateInspectionInspectorDto,
  ): Promise<InspectionInspectorDto> {
    // Verify inspector exists and belongs to the inspection
    const existingInspector = await this.prisma.inspectionInspector.findFirst({
      where: {
        id: inspectorId,
        inspectionId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Inspector',
      `ID ${inspectorId}`,
      existingInspector,
    );

    const inspector = await this.prisma.inspectionInspector.update({
      where: { id: inspectorId },
      data: updateInspectorDto,
      include: {
        inspector: true,
      },
    });

    return this.inspectionInspectorMapper(inspector);
  }

  async removeInspector(
    inspectionId: string,
    inspectorId: string,
  ): Promise<void> {
    // Verify inspector exists and belongs to the inspection
    const inspector = await this.prisma.inspectionInspector.findFirst({
      where: {
        id: inspectorId,
        inspectionId,
      },
    });

    this.errorHandler.throwIfNotFound(
      'Inspection Inspector',
      `ID ${inspectorId}`,
      inspector,
    );

    await this.prisma.inspectionInspector.delete({
      where: { id: inspectorId },
    });
  }

  /**
   * Convert inspection date to reminder time (09:00 AM GMT+7)
   */
  private convertInspectionDateToReminderTime(inspectionDate: Date): Date {
    // Extract date components using UTC methods to avoid timezone issues
    const year = inspectionDate.getUTCFullYear();
    const month = inspectionDate.getUTCMonth();
    const day = inspectionDate.getUTCDate();

    // Create UTC date at 02:00 AM UTC (which is 09:00 AM GMT+7)
    return new Date(Date.UTC(year, month, day, 2, 0, 0));
  }

  /**
   * Get the first reminder date (today or tomorrow at 09:00 AM GMT+7)
   * If today's 09:00 AM GMT+7 has passed, start from tomorrow
   */
  private getFirstReminderDate(): Date {
    const now = new Date();
    const todayReminder = this.convertInspectionDateToReminderTime(now);

    // If today's reminder time has passed, start from tomorrow
    if (todayReminder <= now) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return this.convertInspectionDateToReminderTime(tomorrow);
    }

    return todayReminder;
  }

  /**
   * Create reminder for inspection when status is SCHEDULED
   * Reminder repeats daily from today/tomorrow until inspectionDate
   */
  private async createReminderForInspection(
    inspectionId: string,
    inspectionDate: Date,
    userId: string,
    code: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const inspectionReminderTime =
        this.convertInspectionDateToReminderTime(inspectionDate);

      // Only create reminder if inspectionDate reminder time is in the future
      if (inspectionReminderTime <= now) {
        return;
      }

      // Get the first reminder date (today or tomorrow)
      const firstReminderDate = this.getFirstReminderDate();

      // Only create if first reminder date is before or equal to inspectionDate
      if (firstReminderDate > inspectionReminderTime) {
        return;
      }

      // Set repeatUntil to inspectionDate at 09:00 AM GMT+7
      // This ensures the reminder fires on inspectionDate and stops after that
      const repeatUntil = new Date(inspectionReminderTime);

      await this.remindersService.create(
        {
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userId,
          entity: 't_inspections',
          entityId: inspectionId,
          message: `Inspection ${code} is scheduled for ${inspectionDate.toLocaleDateString()}`,
          remindAt: firstReminderDate.toISOString(),
          repeatType: ReminderRepeatTypeEnum.DAILY,
          repeatUntil: repeatUntil.toISOString(),
        },
        userId,
      );
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error(
        `Failed to create reminder for inspection ${inspectionId}:`,
        error,
      );
    }
  }

  /**
   * Delete all reminders associated with an inspection
   */
  private async deleteRemindersForInspection(
    inspectionId: string,
  ): Promise<void> {
    try {
      // Find all reminders for this inspection
      const reminders = await this.prisma.reminder.findMany({
        where: {
          entity: 't_inspections',
          entityId: inspectionId,
          status: 'PENDING', // Only cancel pending reminders
        },
      });

      // Cancel each reminder by updating status to CANCELLED
      for (const reminder of reminders) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'CANCELLED' },
        });
      }
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error(
        `Failed to delete reminders for inspection ${inspectionId}:`,
        error,
      );
    }
  }

  // Standalone inspection items operations (not nested under inspection)
  async findAllItemsStandalone(
    options?: FindAllItemsOptions,
  ): Promise<{
    data: InspectionItemDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      assignedDepartmentId,
      assigneeId,
      riskId,
      riskCategoryId,
      inspectionCode,
      search,
    } = options || {};

    // Valid sortable fields for InspectionItem
    const validSortFields = [
      'id',
      'inspectionId',
      'riskCategoryId',
      'riskId',
      'assignedDepartmentId',
      'assigneeId',
      'status',
      'order',
      'createdAt',
      'updatedAt',
    ];

    // Validate and sanitize sortBy
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.InspectionItemWhereInput = {
      ...(status && { status }),
      ...(assignedDepartmentId && { assignedDepartmentId }),
      ...(assigneeId && { assigneeId }),
      ...(riskId && { riskId }),
      ...(riskCategoryId && { riskCategoryId }),
      ...(inspectionCode && {
        inspection: {
          code: {
            contains: inspectionCode,
            mode: 'insensitive',
          },
        },
      }),
      ...(search && {
        OR: [
          {
            risk: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            riskCategory: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            inspection: {
              code: { contains: search, mode: 'insensitive' },
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            followUpNotes: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inspectionItem.findMany({
        where,
        include: {
          inspection: {
            select: {
              id: true,
              code: true,
            },
          },
          riskCategory: true,
          risk: true,
          assignedDepartment: true,
          assignee: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: {
          [validatedSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inspectionItem.count({ where }),
    ]);

    // Fetch mitigation records for all items
    const itemIds = items.map((item) => item.id);
    const mitigationRecords = await this.prisma.riskMitigationRecord.findMany({
      where: {
        entity: INSPECTION_ITEM_ENTITY,
        entityId: { in: itemIds },
        isActive: true,
      },
    });

    // Create a map of itemId -> mitigation record
    const mitigationMap = new Map<string, RiskMitigationRecord>();
    mitigationRecords.forEach((record) => {
      mitigationMap.set(record.entityId, record);
    });

    return {
      data: items.map((item) => this.mapItemToDto(item, mitigationMap.get(item.id))),
      meta: { total, page, limit },
    };
  }

  async findOneItemStandalone(itemId: string): Promise<InspectionItemDto> {
    const item = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
      include: {
        inspection: {
          select: {
            id: true,
            code: true,
          },
        },
        riskCategory: true,
        risk: true,
        assignedDepartment: true,
        assignee: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('InspectionItem', itemId, item);

    // Fetch mitigation record for the item
    const mitigationRecord = await this.getMitigationRecord(itemId);

    return this.mapItemToDto(item, mitigationRecord);
  }

  async updateItemStandalone(
    itemId: string,
    updateItemDto: UpdateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    // Verify item exists
    const existingItem = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
    });

    this.errorHandler.throwIfNotFoundById(
      'InspectionItem',
      itemId,
      existingItem,
    );

    // Extract images, mitigation, and dueDateAt from DTO
    const { images, mitigation, dueDateAt, ...itemData } = updateItemDto;

    // Prepare update data
    const updateData: any = {
      ...itemData,
      ...(dueDateAt !== undefined && { dueDateAt: dueDateAt ? new Date(dueDateAt) : null }),
    };

    // Handle images update if provided
    if (images !== undefined) {
      // Delete existing images
      await this.prisma.inspectionImage.deleteMany({
        where: { inspectionItemId: itemId },
      });

      // Create new images if provided
      if (images.length > 0) {
        updateData.images = {
          create: images.map((img) => ({
            imageUrl: img.imageUrl,
            caption: img.caption || null,
            type: img.type || 'GENERAL',
            order: img.order,
          })),
        };
      }
    }

    const item = await this.prisma.inspectionItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        inspection: {
          select: {
            id: true,
            code: true,
          },
        },
        riskCategory: true,
        risk: true,
        assignedDepartment: true,
        assignee: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Handle mitigation record update/create/delete
    let mitigationRecord: RiskMitigationRecord | null = null;
    if (mitigation !== undefined) {
      if (mitigation === null) {
        // Delete mitigation record if explicitly set to null
        await this.deleteMitigationRecord(itemId);
      } else {
        // Update or create mitigation record
        mitigationRecord = await this.upsertMitigationRecord(itemId, mitigation);
      }
    } else {
      // Fetch existing mitigation record if not provided
      mitigationRecord = await this.getMitigationRecord(itemId);
    }

    return this.mapItemToDto(item, mitigationRecord);
  }

  // Helper methods for mapping and mitigation records

  /**
   * Map inspection item to DTO with optional mitigation record
   */
  private mapItemToDto(
    item: any,
    mitigationRecord?: RiskMitigationRecord | null,
  ): InspectionItemDto {
    const dto = this.inspectionItemMapper(item);
    return {
      ...dto,
      mitigation: mitigationRecord
        ? this.mapMitigationToDto(mitigationRecord)
        : undefined,
    };
  }

  /**
   * Create mitigation record for an inspection item
   */
  private async createMitigationRecord(
    itemId: string,
    mitigation: RiskMitigationDataDto,
  ): Promise<RiskMitigationRecord> {
    return this.prisma.riskMitigationRecord.create({
      data: {
        entity: INSPECTION_ITEM_ENTITY,
        entityId: itemId,
        eliminate: mitigation.eliminate || null,
        transfer: mitigation.transfer || null,
        reduce: mitigation.reduce || null,
        accept: mitigation.accept || null,
        legalAspect: mitigation.legalAspect || null,
        isActive: true,
      },
    });
  }

  /**
   * Get mitigation record for an inspection item
   */
  private async getMitigationRecord(
    itemId: string,
  ): Promise<RiskMitigationRecord | null> {
    return this.prisma.riskMitigationRecord.findFirst({
      where: {
        entity: INSPECTION_ITEM_ENTITY,
        entityId: itemId,
        isActive: true,
      },
    });
  }

  /**
   * Update or create mitigation record for an inspection item
   */
  private async upsertMitigationRecord(
    itemId: string,
    mitigation: RiskMitigationDataDto,
  ): Promise<RiskMitigationRecord> {
    const existing = await this.getMitigationRecord(itemId);
    
    if (existing) {
      return this.prisma.riskMitigationRecord.update({
        where: { id: existing.id },
        data: {
          eliminate: mitigation.eliminate || null,
          transfer: mitigation.transfer || null,
          reduce: mitigation.reduce || null,
          accept: mitigation.accept || null,
          legalAspect: mitigation.legalAspect || null,
        },
      });
    }
    
    return this.createMitigationRecord(itemId, mitigation);
  }

  /**
   * Delete mitigation record for an inspection item
   */
  private async deleteMitigationRecord(itemId: string): Promise<void> {
    await this.prisma.riskMitigationRecord.deleteMany({
      where: {
        entity: INSPECTION_ITEM_ENTITY,
        entityId: itemId,
      },
    });
  }

  /**
   * Map mitigation record to DTO
   */
  private mapMitigationToDto(
    record: RiskMitigationRecord,
  ): RiskMitigationRecordDto {
    return {
      id: record.id,
      entity: record.entity,
      entityId: record.entityId,
      eliminate: record.eliminate || undefined,
      transfer: record.transfer || undefined,
      reduce: record.reduce || undefined,
      accept: record.accept || undefined,
      legalAspect: record.legalAspect || undefined,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

}

