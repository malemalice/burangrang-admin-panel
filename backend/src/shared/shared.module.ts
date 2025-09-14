import { Module } from '@nestjs/common';
import { ErrorHandlingService } from './services/error-handling.service';
import { DtoMapperService } from './services/dto-mapper.service';

@Module({
  providers: [ErrorHandlingService, DtoMapperService],
  exports: [ErrorHandlingService, DtoMapperService],
})
export class SharedModule {}
