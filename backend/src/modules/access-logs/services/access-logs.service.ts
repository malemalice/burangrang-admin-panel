import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccessLogDto } from '../dto/access-log.dto';
import { FindAccessLogsDto } from '../dto/find-access-logs.dto';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { UserDto } from '../../users/dto/user.dto';
import { Prisma } from '@prisma/client';

export interface CreateAccessLogInput {
  userId?: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  executionTime?: number;
}

@Injectable()
export class AccessLogsService {
  private accessLogMapper: (log: any) => AccessLogDto;
  private accessLogArrayMapper: (logs: any[]) => AccessLogDto[];
  private accessLogPaginatedMapper: (data: { data: any[]; meta: any }) => {
    data: AccessLogDto[];
    meta: any;
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.accessLogMapper = this.dtoMapper.createMapper(AccessLogDto, {
      relations: {
        user: {
          mapper: this.dtoMapper.createSimpleMapper(UserDto),
        },
      },
    });
    this.accessLogArrayMapper = this.dtoMapper.createArrayMapper(
      AccessLogDto,
      {
        relations: {
          user: {
            mapper: this.dtoMapper.createSimpleMapper(UserDto),
          },
        },
      },
    );
    this.accessLogPaginatedMapper = this.dtoMapper.createPaginatedMapper(
      AccessLogDto,
      {
        relations: {
          user: {
            mapper: this.dtoMapper.createSimpleMapper(UserDto),
          },
        },
      },
    );
  }

  /**
   * Create an access log entry. Intended to be called asynchronously (fire-and-forget).
   * Errors are caught and logged to console so logging never breaks the request flow.
   */
  async createAccessLog(input: CreateAccessLogInput): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          userId: input.userId ?? null,
          method: input.method,
          endpoint: input.endpoint,
          statusCode: input.statusCode ?? null,
          payload: (input.payload ?? null) as Prisma.InputJsonValue,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          executionTime: input.executionTime ?? null,
        },
      });
    } catch (err) {
      console.error('[AccessLogsService] Failed to create access log:', err);
    }
  }

  async findAll(query: FindAccessLogsDto): Promise<{
    data: AccessLogDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      method,
      endpoint,
      dateFrom,
      dateTo,
      payloadSearch,
    } = query;

    const validSortColumn =
      sortBy === 'createdAt' ||
      sortBy === 'method' ||
      sortBy === 'endpoint' ||
      sortBy === 'userId'
        ? sortBy
        : 'createdAt';
    const orderDir = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;

    if (payloadSearch && payloadSearch.trim()) {
      const payloadPattern = `%${payloadSearch.trim()}%`;
      const conditions: Prisma.Sql[] = [
        Prisma.sql`a.payload::text ILIKE ${payloadPattern}`,
      ];
      if (userId) {
        conditions.push(Prisma.sql`a."userId" = ${userId}`);
      }
      if (method) {
        conditions.push(Prisma.sql`a.method = ${method}`);
      }
      if (endpoint) {
        conditions.push(Prisma.sql`a.endpoint ILIKE ${'%' + endpoint + '%'}`);
      }
      if (dateFrom) {
        conditions.push(Prisma.sql`a."createdAt" >= ${new Date(dateFrom)}`);
      }
      if (dateTo) {
        conditions.push(Prisma.sql`a."createdAt" <= ${new Date(dateTo)}`);
      }
      const whereClause =
        conditions.length > 0 ? Prisma.join(conditions, ' AND ') : Prisma.empty;

      const orderByColumn = Prisma.raw('"' + validSortColumn + '"');
      const [idRows, countRows] = await Promise.all([
        this.prisma.$queryRaw<{ id: string }[]>(
          Prisma.sql`
            SELECT a.id FROM "t_access_logs" a
            WHERE ${whereClause}
            ORDER BY a.${orderByColumn} ${orderDir}
            LIMIT ${limit} OFFSET ${(page - 1) * limit}
          `,
        ),
        this.prisma.$queryRaw<[{ count: bigint }]>(
          Prisma.sql`
            SELECT COUNT(*)::bigint AS count FROM "t_access_logs" a
            WHERE ${whereClause}
          `,
        ),
      ]);

      const total = Number(countRows[0]?.count ?? 0);
      const totalPages = Math.ceil(total / limit);
      const ids = idRows.map((r) => r.id);
      if (ids.length === 0) {
        return this.accessLogPaginatedMapper({
          data: [],
          meta: { total, page, limit, totalPages },
        });
      }

      const logs = await this.prisma.accessLog.findMany({
        where: { id: { in: ids } },
        include: { user: true },
      });
      const sorted = ids
        .map((id) => logs.find((l) => l.id === id))
        .filter((l): l is NonNullable<typeof l> => l != null);
      return this.accessLogPaginatedMapper({
        data: sorted,
        meta: { total, page, limit, totalPages },
      });
    }

    const where: Prisma.AccessLogWhereInput = {};
    if (userId) {
      where.userId = userId;
    }
    if (method) {
      where.method = method;
    }
    if (endpoint) {
      where.endpoint = { contains: endpoint, mode: 'insensitive' };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        include: { user: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return this.accessLogPaginatedMapper({
      data: logs,
      meta: { total, page, limit, totalPages },
    });
  }

  async findOne(id: string): Promise<AccessLogDto> {
    const log = await this.prisma.accessLog.findUnique({
      where: { id },
      include: { user: true },
    });
    this.errorHandler.throwIfNotFoundById('AccessLog', id, log);
    return this.accessLogMapper(log);
  }

  async getStatistics(): Promise<{
    total: number;
    byMethod: Record<string, number>;
    topEndpoints: { endpoint: string; count: number }[];
    recentCount: number;
  }> {
    const [total, byMethodRows, endpointCounts, recentCount] = await Promise.all([
      this.prisma.accessLog.count(),
      this.prisma.accessLog.groupBy({
        by: ['method'],
        _count: { id: true },
      }),
      this.prisma.accessLog.groupBy({
        by: ['endpoint'],
        _count: { id: true },
      }),
      this.prisma.accessLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const byMethod: Record<string, number> = {};
    for (const row of byMethodRows) {
      byMethod[row.method] = row._count.id;
    }

    const topEndpoints = endpointCounts
      .map((r) => ({ endpoint: r.endpoint, count: r._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      byMethod,
      topEndpoints,
      recentCount,
    };
  }
}
