/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentDto,
  FindIncidentsDto,
} from '../dto';
import {
  Prisma,
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  PriorityEnum,
  SourceEnum,
} from '@prisma/client';
import { IncidentInjuredPersonDto } from '../dto/incident-injured-person.dto';
import { IncidentWitnessDto } from '../dto/incident-witness.dto';
import { IncidentAssetDto } from '../dto/incident-asset.dto';
import { IncidentImageDto } from '../dto/incident-image.dto';
import { IncidentAttachmentDto } from '../dto/incident-attachment.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  areaId?: string;
  riskCategoryId?: string;
  status?: GeneralStatusEnum;
  incidentType?: IncidentTypeEnum;
  incidentClassification?: IncidentClassificationEnum;
  priority?: PriorityEnum;
  source?: SourceEnum;
  assignedDepartmentId?: string;
  assigneeId?: string;
  search?: string;
}

@Injectable()
export class IncidentsService {
  // Initialize mappers in constructor
  private incidentMapper: (entity: any) => IncidentDto;
  private injuredPersonMapper: (entity: any) => IncidentInjuredPersonDto;
  private witnessMapper: (entity: any) => IncidentWitnessDto;
  private assetMapper: (entity: any) => IncidentAssetDto;
  private imageMapper: (entity: any) => IncidentImageDto;
  private attachmentMapper: (entity: any) => IncidentAttachmentDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    // Initialize related entity mappers
    this.injuredPersonMapper = this.dtoMapper.createRelationMapper(
      IncidentInjuredPersonDto,
      {
        department: {
          mapper: (department: any) => department,
          isArray: false,
        },
      },
    );

    this.witnessMapper = this.dtoMapper.createRelationMapper(
      IncidentWitnessDto,
      {
        department: {
          mapper: (department: any) => department,
          isArray: false,
        },
      },
    );

    this.assetMapper = this.dtoMapper.createSimpleMapper(IncidentAssetDto);
    this.imageMapper = this.dtoMapper.createSimpleMapper(IncidentImageDto);
    this.attachmentMapper = this.dtoMapper.createSimpleMapper(IncidentAttachmentDto);

    // Initialize incident mapper with all nested relations
    this.incidentMapper = this.dtoMapper.createRelationMapper(IncidentDto, {
      room: {
        mapper: (room: any) => room,
        isArray: false,
      },
      area: {
        mapper: (area: any) => area,
        isArray: false,
      },
      riskCategory: {
        mapper: (riskCategory: any) => riskCategory,
        isArray: false,
      },
      requester: {
        mapper: (requester: any) => requester,
        isArray: false,
      },
      reporter: {
        mapper: (reporter: any) => reporter,
        isArray: false,
      },
      technician: {
        mapper: (technician: any) => technician,
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
      creator: {
        mapper: (creator: any) => creator,
        isArray: false,
      },
      injuredPersons: {
        mapper: (person: any) => this.injuredPersonMapper(person),
        isArray: true,
      },
      witnesses: {
        mapper: (witness: any) => this.witnessMapper(witness),
        isArray: true,
      },
      assets: {
        mapper: (asset: any) => this.assetMapper(asset),
        isArray: true,
      },
      images: {
        mapper: (image: any) => this.imageMapper(image),
        isArray: true,
      },
      attachments: {
        mapper: (attachment: any) => this.attachmentMapper(attachment),
        isArray: true,
      },
    });
  }

  async create(
    createIncidentDto: CreateIncidentDto,
    userId: string,
  ): Promise<IncidentDto> {
    const {
      injuredPersons,
      witnesses,
      assets,
      images,
      attachments,
      ...data
    } = createIncidentDto;

    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.create({
          data: {
            ...data,
            createdBy: userId,
            ...(injuredPersons &&
              injuredPersons.length > 0 && {
                injuredPersons: {
                  create: injuredPersons,
                },
              }),
            ...(witnesses &&
              witnesses.length > 0 && {
                witnesses: {
                  create: witnesses,
                },
              }),
            ...(assets &&
              assets.length > 0 && {
                assets: {
                  create: assets,
                },
              }),
            ...(images &&
              images.length > 0 && {
                images: {
                  create: images,
                },
              }),
            ...(attachments &&
              attachments.length > 0 && {
                attachments: {
                  create: attachments,
                },
              }),
          },
          include: {
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'creating incident',
    );

    return this.incidentMapper(incident);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: IncidentDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'code',
      sortOrder = 'desc',
      isActive,
      areaId,
      riskCategoryId,
      status,
      incidentType,
      incidentClassification,
      priority,
      source,
      assignedDepartmentId,
      assigneeId,
      search,
    } = options || {};

    const where: Prisma.IncidentWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (areaId) {
      where.areaId = areaId;
    }
    if (riskCategoryId) {
      where.riskCategoryId = riskCategoryId;
    }
    if (status) {
      where.status = status;
    }
    if (incidentType) {
      where.incidentType = incidentType;
    }
    if (incidentClassification) {
      where.incidentClassification = incidentClassification;
    }
    if (priority) {
      where.priority = priority;
    }
    if (source) {
      where.source = source;
    }
    if (assignedDepartmentId) {
      where.assignedDepartmentId = assignedDepartmentId;
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [incidents, total] = await this.errorHandler.safeExecute(
      () =>
        Promise.all([
          this.prisma.incident.findMany({
            where,
            include: {
              room: true,
              area: true,
              riskCategory: true,
              requester: true,
              reporter: true,
              technician: true,
              assignedDepartment: true,
              assignee: true,
              creator: true,
              injuredPersons: {
                include: {
                  department: true,
                },
                orderBy: { order: 'asc' },
              },
              witnesses: {
                include: {
                  department: true,
                },
                orderBy: { order: 'asc' },
              },
              assets: {
                orderBy: { order: 'asc' },
              },
              images: {
                orderBy: { order: 'asc' },
              },
              attachments: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: {
              [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.incident.count({ where }),
        ]),
      'fetching incidents',
    );

    const mappedIncidents = incidents.map((incident) =>
      this.incidentMapper(incident),
    );

    return {
      data: mappedIncidents,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<IncidentDto> {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        room: true,
        area: true,
        riskCategory: true,
        requester: true,
        reporter: true,
        technician: true,
        assignedDepartment: true,
        assignee: true,
        creator: true,
        injuredPersons: {
          include: {
            department: true,
          },
          orderBy: { order: 'asc' },
        },
        witnesses: {
          include: {
            department: true,
          },
          orderBy: { order: 'asc' },
        },
        assets: {
          orderBy: { order: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        attachments: {
          orderBy: { order: 'asc' },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Incident', id, incident);

    return this.incidentMapper(incident);
  }

  async update(
    id: string,
    updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentDto> {
    const {
      injuredPersons,
      witnesses,
      assets,
      images,
      attachments,
      ...data
    } = updateIncidentDto;

    // First, check if incident exists
    const existingIncident = await this.prisma.incident.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Incident', id, existingIncident);

    // Update incident with nested relations
    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.update({
          where: { id },
          data: {
            ...data,
            // Handle nested updates
            ...(injuredPersons !== undefined && {
              injuredPersons: {
                deleteMany: {},
                create: injuredPersons,
              },
            }),
            ...(witnesses !== undefined && {
              witnesses: {
                deleteMany: {},
                create: witnesses,
              },
            }),
            ...(assets !== undefined && {
              assets: {
                deleteMany: {},
                create: assets,
              },
            }),
            ...(images !== undefined && {
              images: {
                deleteMany: {},
                create: images,
              },
            }),
            ...(attachments !== undefined && {
              attachments: {
                deleteMany: {},
                create: attachments,
              },
            }),
          },
          include: {
            room: true,
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'updating incident',
    );

    return this.incidentMapper(incident);
  }

  async remove(id: string): Promise<IncidentDto> {
    const incident = await this.errorHandler.safeExecute(
      () =>
        this.prisma.incident.update({
          where: { id },
          data: { isActive: false },
          include: {
            room: true,
            area: true,
            riskCategory: true,
            requester: true,
            reporter: true,
            technician: true,
            assignedDepartment: true,
            assignee: true,
            creator: true,
            injuredPersons: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            witnesses: {
              include: {
                department: true,
              },
              orderBy: { order: 'asc' },
            },
            assets: {
              orderBy: { order: 'asc' },
            },
            images: {
              orderBy: { order: 'asc' },
            },
            attachments: {
              orderBy: { order: 'asc' },
            },
          },
        }),
      'deleting incident',
    );

    return this.incidentMapper(incident);
  }
}
