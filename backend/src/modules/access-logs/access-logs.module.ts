import { Module } from '@nestjs/common';
import { AccessLogsService } from './services/access-logs.service';
import { AccessLogsController } from './controllers/access-logs.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [AccessLogsController],
  providers: [AccessLogsService],
  exports: [AccessLogsService],
})
export class AccessLogsModule {}
