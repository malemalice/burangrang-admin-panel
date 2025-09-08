import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [RolesController],
  providers: [RolesService, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}
