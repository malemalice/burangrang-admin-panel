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
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
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

