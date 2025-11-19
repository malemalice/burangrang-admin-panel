import { Module } from '@nestjs/common';
import { SafetyEquipmentTypesService } from './safety-equipment-types.service';
import { SafetyEquipmentTypesController } from './safety-equipment-types.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
    imports: [PrismaModule, SharedModule],
    controllers: [SafetyEquipmentTypesController],
    providers: [SafetyEquipmentTypesService],
    exports: [SafetyEquipmentTypesService],
})
export class SafetyEquipmentTypesModule { }

