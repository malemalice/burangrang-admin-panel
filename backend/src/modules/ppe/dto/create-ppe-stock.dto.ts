import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePPEStockItemDto } from './create-ppe-stock-item.dto';

export class CreatePPEStockDto {
    @ApiProperty({
        required: false,
        description: 'PO/PR code (optional; a unique code is auto-generated if omitted)',
    })
    @IsString()
    @IsOptional()
    @MaxLength(191)
    stockCode?: string;

    @ApiProperty({ description: 'Date when PPE was received' })
    @IsDateString()
    @IsNotEmpty()
    receivedDate: string;

    @ApiProperty({ required: false, description: 'Optional notes for the stock entry' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false, description: 'Whether the stock entry is active', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ type: [CreatePPEStockItemDto], description: 'List of PPE items in this stock entry' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePPEStockItemDto)
    items: CreatePPEStockItemDto[];
}

