import { Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesController } from './offices.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [OfficesController],
  providers: [OfficesService],
  exports: [OfficesService],
})
export class OfficesModule {}
