import { Module } from '@nestjs/common';
import { InspectionsController } from './controllers/inspections.controller';
import { InspectionsService } from './services/inspections.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}

