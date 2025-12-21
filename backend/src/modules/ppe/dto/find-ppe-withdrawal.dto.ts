import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PPEWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    COLLECTED = 'COLLECTED',
    CANCELLED = 'CANCELLED',
}

export class FindPPEWithdrawalDto {
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

    @ApiProperty({ required: false, description: 'Search term for withdrawal code' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false, enum: PPEWithdrawalStatus, description: 'Filter by withdrawal status' })
    @IsEnum(PPEWithdrawalStatus)
    @IsOptional()
    status?: PPEWithdrawalStatus;

    @ApiProperty({ required: false, description: 'Filter by active status' })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isActive?: boolean;

    @ApiProperty({ required: false, description: 'Filter by department ID' })
    @IsString()
    @IsOptional()
    departmentId?: string;

    @ApiProperty({ required: false, description: 'Filter by withdrawal date from' })
    @IsDateString()
    @IsOptional()
    withdrawalDateFrom?: string;

    @ApiProperty({ required: false, description: 'Filter by withdrawal date to' })
    @IsDateString()
    @IsOptional()
    withdrawalDateTo?: string;
}

