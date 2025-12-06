import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SafetyEquipmentCategoryEnum {
    PERSONAL_PROTECTIVE_EQUIPMENT = 'PERSONAL_PROTECTIVE_EQUIPMENT',
    SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
    EMERGENCY_EQUIPMENT = 'EMERGENCY_EQUIPMENT',
}

export class CreateSafetyEquipmentDto {
    @ApiProperty({ description: 'The name of the safety equipment' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'The unique code of the safety equipment' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ description: 'The safety equipment type ID' })
    @IsString()
    @IsNotEmpty()
    safetyEquipmentTypeId: string;

    @ApiProperty({
        required: false,
        description: 'The size of the safety equipment',
    })
    @IsString()
    @IsOptional()
    size?: string;

    @ApiProperty({
        required: false,
        description: 'The description of the safety equipment',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        enum: SafetyEquipmentCategoryEnum,
        description: 'The category of the safety equipment',
    })
    @IsEnum(SafetyEquipmentCategoryEnum)
    @IsNotEmpty()
    category: SafetyEquipmentCategoryEnum;

    @ApiProperty({
        default: true,
        description: 'Whether the safety equipment is active',
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
    })
    isActive?: boolean = true;
}

