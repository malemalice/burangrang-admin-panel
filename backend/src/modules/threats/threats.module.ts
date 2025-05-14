import { Module } from '@nestjs/common';
import { ThreatsService } from './threats.service';
import { ThreatsController } from './threats.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [ThreatsController],
  providers: [ThreatsService, PrismaService],
  exports: [ThreatsService],
})
export class ThreatsModule {} 