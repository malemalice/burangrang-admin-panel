import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './services/error-handling.service';
import { DtoMapperService } from './services/dto-mapper.service';
import { ActivityLoggerService } from './services/activity-logger.service';
import { PrismaModule } from '../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ErrorHandlingService, DtoMapperService, ActivityLoggerService],
  exports: [ErrorHandlingService, DtoMapperService, ActivityLoggerService],
})
export class SharedModule {}
