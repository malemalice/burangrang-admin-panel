import { Module } from '@nestjs/common';
import { ThreatMitigationsService } from './threat-mitigations.service';
import { ThreatMitigationsController } from './threat-mitigations.controller';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [ThreatMitigationsController],
  providers: [ThreatMitigationsService, PrismaService],
  exports: [ThreatMitigationsService],
})
export class ThreatMitigationsModule {} 