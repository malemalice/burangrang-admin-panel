import { Module } from '@nestjs/common';
import { HfacsNodesService } from './hfacs-nodes.service';
import { HfacsNodesController } from './hfacs-nodes.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [HfacsNodesController],
  providers: [HfacsNodesService],
  exports: [HfacsNodesService],
})
export class HfacsNodesModule {}
