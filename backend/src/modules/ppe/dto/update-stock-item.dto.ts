import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum PPEStockItemStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    ISSUED = 'ISSUED',
    EXPIRED = 'EXPIRED',
    DISPOSED = 'DISPOSED',
}

export class UpdateStockItemDto {
    @ApiProperty({ required: false, description: 'Current quantity of the stock item' })
    @IsNumber()
    @IsOptional()
    currentQuantity?: number;

    @ApiProperty({ required: false, description: 'Reserved quantity of the stock item' })
    @IsNumber()
    @IsOptional()
    reservedQuantity?: number;

    @ApiProperty({ required: false, enum: PPEStockItemStatus, description: 'Status of the stock item' })
    @IsEnum(PPEStockItemStatus)
    @IsOptional()
    status?: string;

    @ApiProperty({ required: false, description: 'Expiry date of the stock item', type: String, format: 'date-time' })
    @IsDateString()
    @IsOptional()
    expiryDate?: string;
}

