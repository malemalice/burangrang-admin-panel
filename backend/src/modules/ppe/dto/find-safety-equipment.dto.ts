import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsBoolean, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SafetyEquipmentCategoryEnum } from './create-safety-equipment.dto';

export class FindSafetyEquipmentDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiProperty({ required: false, enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, enum: SafetyEquipmentCategoryEnum })
    @IsOptional()
    @IsEnum(SafetyEquipmentCategoryEnum)
    category?: SafetyEquipmentCategoryEnum;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    safetyEquipmentTypeId?: string;
}

