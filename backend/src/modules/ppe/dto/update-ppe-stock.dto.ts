import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePPEStockItemDto } from './update-ppe-stock-item.dto';

export class UpdatePPEStockDto {
    @ApiProperty({ required: false, description: 'PO/PR code' })
    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(191)
    stockCode?: string;

    @ApiProperty({ required: false, description: 'Date when PPE was received' })
    @IsDateString()
    @IsOptional()
    receivedDate?: string;

    @ApiProperty({ required: false, description: 'Optional notes for the stock entry' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false, description: 'Whether the stock entry is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false, type: [UpdatePPEStockItemDto], description: 'List of PPE items to update/create/delete' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdatePPEStockItemDto)
    @IsOptional()
    items?: UpdatePPEStockItemDto[];
}

