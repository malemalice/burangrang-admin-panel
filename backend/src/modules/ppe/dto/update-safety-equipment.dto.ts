import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { SafetyEquipmentCategoryEnum } from './create-safety-equipment.dto';

export class UpdateSafetyEquipmentDto {
    @ApiProperty({
        required: false,
        description: 'The name of the safety equipment',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        required: false,
        description: 'The unique code of the safety equipment',
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({
        required: false,
        description: 'The safety equipment type ID',
    })
    @IsString()
    @IsOptional()
    safetyEquipmentTypeId?: string;

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
        required: false,
        enum: SafetyEquipmentCategoryEnum,
        description: 'The category of the safety equipment',
    })
    @IsEnum(SafetyEquipmentCategoryEnum)
    @IsOptional()
    category?: SafetyEquipmentCategoryEnum;

    @ApiProperty({
        required: false,
        description: 'Whether the safety equipment is active',
    })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return Boolean(value);
    })
    isActive?: boolean;
}

