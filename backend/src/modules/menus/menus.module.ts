import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [MenusController],
  providers: [MenusService, PrismaService],
  exports: [MenusService],
})
export class MenusModule {}
