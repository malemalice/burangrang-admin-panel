import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindSafetyEquipmentTypeDto {
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
    @Transform(({ value, key, obj }) => {
        // Get raw value from query object before any conversion
        const rawValue = obj[key];

        // Handle string values from query parameters
        if (typeof rawValue === 'string') {
            if (rawValue.toLowerCase() === 'true') return true;
            if (rawValue.toLowerCase() === 'false') return false;
        }

        // Handle boolean values (already converted)
        if (typeof rawValue === 'boolean') {
            return rawValue;
        }

        // Handle string value parameter
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;

        return value;
    })
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;
}

