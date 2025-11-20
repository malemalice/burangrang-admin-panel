import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SafetyEquipmentTypeDto } from '../../safety-equipment-types/dto/safety-equipment-type.dto';

export class SafetyEquipmentDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    code: string;

    @ApiProperty()
    @Expose()
    safetyEquipmentTypeId: string;

    @ApiProperty({ type: SafetyEquipmentTypeDto, required: false })
    @Expose()
    safetyEquipmentType?: SafetyEquipmentTypeDto;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    size: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    description: string | null;

    @ApiProperty({ enum: ['PERSONAL_PROTECTIVE_EQUIPMENT', 'SAFETY_EQUIPMENT', 'EMERGENCY_EQUIPMENT'] })
    @Expose()
    category: string;

    @ApiProperty()
    @Expose()
    isActive: boolean;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    deletedAt: Date | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<SafetyEquipmentDto>) {
        Object.assign(this, partial);
    }
}

