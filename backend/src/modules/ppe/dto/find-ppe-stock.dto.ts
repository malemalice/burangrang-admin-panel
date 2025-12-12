import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindPPEStockDto {
    @ApiProperty({ required: false, description: 'Page number for pagination' })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    page?: number;

    @ApiProperty({ required: false, description: 'Number of items per page' })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @ApiProperty({ required: false, description: 'Field to sort by' })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiProperty({ required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiProperty({ required: false, description: 'Search term for stock code' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false, description: 'Filter by active status' })
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

    @ApiProperty({ required: false, description: 'Filter by received date from' })
    @IsDateString()
    @IsOptional()
    receivedDateFrom?: string;

    @ApiProperty({ required: false, description: 'Filter by received date to' })
    @IsDateString()
    @IsOptional()
    receivedDateTo?: string;
}

