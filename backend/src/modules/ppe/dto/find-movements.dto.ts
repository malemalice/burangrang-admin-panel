import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindMovementsDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiProperty({ required: false, enum: ['STOCK_IN', 'WITHDRAWAL', 'ADJUSTMENT'] })
    @IsOptional()
    @IsEnum(['STOCK_IN', 'WITHDRAWAL', 'ADJUSTMENT'])
    movementType?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;
}
