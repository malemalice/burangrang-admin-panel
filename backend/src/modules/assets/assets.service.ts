import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AssetListItem {
  id: string;
  name: string;
  code: string;
  brand?: string;
}

interface FindAllOptions {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options?: FindAllOptions): Promise<{
    data: AssetListItem[];
    meta: { total: number; page: number; limit: number };
  }> {
    const { page = 1, limit = 100, isActive } = options || {};

    const where: Prisma.AssetWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, name: true, code: true, brand: true },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data: assets.map((a) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        brand: a.brand ?? undefined,
      })),
      meta: { total, page, limit },
    };
  }
}
