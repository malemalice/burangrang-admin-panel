import { Module } from '@nestjs/common';
import { JobPositionsService } from './job-positions.service';
import { JobPositionsController } from './job-positions.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [JobPositionsController],
  providers: [JobPositionsService],
  exports: [JobPositionsService],
})
export class JobPositionsModule {}
