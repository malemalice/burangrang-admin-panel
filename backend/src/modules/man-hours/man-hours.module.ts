import { Module } from '@nestjs/common';
import { ManHoursController } from './man-hours.controller';
import { ManHoursService } from './man-hours.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [ManHoursController],
  providers: [ManHoursService],
  exports: [ManHoursService],
})
export class ManHoursModule {}
