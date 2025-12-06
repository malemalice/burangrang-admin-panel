import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';

export class CreatePPEWithdrawalItemDto {
    @ApiProperty({ description: 'Reference to stock item being withdrawn' })
    @IsUUID()
    @IsString()
    stockItemId: string;

    @ApiProperty({ description: 'Quantity requested' })
    @IsInt()
    @Min(1)
    requestedQuantity: number;

    @ApiProperty({ description: 'Display order within withdrawal' })
    @IsInt()
    @Min(0)
    order: number;

    @ApiProperty({ required: false, description: 'Optional notes for this item' })
    @IsString()
    @IsOptional()
    notes?: string;
}

