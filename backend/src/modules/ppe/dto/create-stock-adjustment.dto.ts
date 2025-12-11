import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsNotEmpty, IsEnum, Min } from 'class-validator';

export enum AdjustmentType {
    DISPOSAL = 'DISPOSAL',
    DAMAGE = 'DAMAGE',
    CORRECTION = 'CORRECTION',
    EXPIRY_REMOVAL = 'EXPIRY_REMOVAL',
    RETURN = 'RETURN',
}

export class CreateStockAdjustmentDto {
    @ApiProperty({ enum: AdjustmentType, description: 'Type of adjustment' })
    @IsEnum(AdjustmentType)
    @IsNotEmpty()
    adjustmentType: AdjustmentType;

    @ApiProperty({ description: 'Quantity after adjustment' })
    @IsInt()
    @Min(0)
    quantityAfter: number;

    @ApiProperty({ description: 'Reason for adjustment' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}

