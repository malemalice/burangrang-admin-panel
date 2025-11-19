import { Module } from '@nestjs/common';
import { SafetyEquipmentsService } from './safety-equipments.service';
import { SafetyEquipmentsController } from './safety-equipments.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
    imports: [PrismaModule, SharedModule],
    controllers: [SafetyEquipmentsController],
    providers: [SafetyEquipmentsService],
    exports: [SafetyEquipmentsService],
})
export class SafetyEquipmentsModule { }

