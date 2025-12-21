import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PPEStockStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    ISSUED = 'ISSUED',
    EXPIRED = 'EXPIRED',
    DISPOSED = 'DISPOSED',
}

export class FindPPEStockItemDto {
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

    @ApiProperty({ required: false, description: 'Search term for equipment name or type' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false, enum: PPEStockStatus, description: 'Filter by stock status' })
    @IsEnum(PPEStockStatus)
    @IsOptional()
    status?: PPEStockStatus;

    @ApiProperty({ required: false, description: 'Filter by stock ID' })
    @IsString()
    @IsOptional()
    stockId?: string;

    @ApiProperty({ required: false, description: 'Filter only available items (for withdrawal)' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    availableOnly?: boolean;

    @ApiProperty({ required: false, description: 'Group by safety equipment and aggregate quantities' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    groupBySafetyEquipment?: boolean;

    @ApiProperty({ required: false, description: 'Include expired items for disposal' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    includeExpired?: boolean;
}

