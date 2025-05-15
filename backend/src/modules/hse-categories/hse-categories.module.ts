import { Module } from '@nestjs/common';
import { HseCategoriesService } from './hse-categories.service';
import { HseCategoriesController } from './hse-categories.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [HseCategoriesController],
  providers: [HseCategoriesService, PrismaService],
  exports: [HseCategoriesService],
})
export class HseCategoriesModule {} 