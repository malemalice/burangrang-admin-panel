import { Module } from '@nestjs/common';
import { InspectionChecklistsService } from './inspection-checklists.service';
import { InspectionChecklistsController } from './inspection-checklists.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [InspectionChecklistsController],
  providers: [InspectionChecklistsService],
  exports: [InspectionChecklistsService],
})
export class InspectionChecklistsModule {}
