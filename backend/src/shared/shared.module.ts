import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './services/error-handling.service';
import { DtoMapperService } from './services/dto-mapper.service';
import { ActivityLoggerService } from './services/activity-logger.service';
import { LocalStorageService } from './services/local-storage.service';
import { StorageFactoryService } from './services/storage-factory.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    ErrorHandlingService, 
    DtoMapperService, 
    ActivityLoggerService, 
    LocalStorageService,
    StorageFactoryService,
    JwtAuthGuard, 
    RolesGuard, 
    PermissionsGuard
  ],
  exports: [
    PrismaModule, 
    ErrorHandlingService, 
    DtoMapperService, 
    ActivityLoggerService, 
    LocalStorageService,
    StorageFactoryService,
    JwtAuthGuard, 
    RolesGuard, 
    PermissionsGuard
  ],
})
export class SharedModule {}
