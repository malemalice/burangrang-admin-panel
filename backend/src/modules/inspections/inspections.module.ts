import { Module } from '@nestjs/common';
import { InspectionsController } from './controllers/inspections.controller';
import { InspectionItemsController } from './controllers/inspection-items.controller';
import { InspectionsService } from './services/inspections.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [PrismaModule, SharedModule, RemindersModule],
  controllers: [InspectionsController, InspectionItemsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
