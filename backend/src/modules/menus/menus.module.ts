import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [MenusController],
  providers: [MenusService, PrismaService],
  exports: [MenusService],
})
export class MenusModule {} 