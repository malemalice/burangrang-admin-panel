import { Module } from '@nestjs/common';
import { IncidentsController } from './controllers/incidents.controller';
import { IncidentsService } from './services/incidents.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
