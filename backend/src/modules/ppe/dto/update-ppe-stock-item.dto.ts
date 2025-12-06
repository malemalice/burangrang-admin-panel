import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsDateString, Min, IsUUID } from 'class-validator';

export class UpdatePPEStockItemDto {
    @ApiProperty({ required: false, description: 'Item ID (required for update, omit for create)' })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty({ required: false, description: 'Reference to safety equipment master data' })
    @IsUUID()
    @IsOptional()
    safetyEquipmentId?: string;

    @ApiProperty({ required: false, description: 'Equipment name (free-text if not using master data)' })
    @IsString()
    @IsOptional()
    equipmentName?: string;

    @ApiProperty({ required: false, description: 'Equipment type (free-text if not using master data)' })
    @IsString()
    @IsOptional()
    equipmentType?: string;

    @ApiProperty({ required: false, description: 'Equipment size (free-text if not using master data)' })
    @IsString()
    @IsOptional()
    equipmentSize?: string;

    @ApiProperty({ required: false, description: 'Expiry date of the PPE item' })
    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @ApiProperty({ required: false, description: 'Initial quantity received' })
    @IsInt()
    @Min(1)
    @IsOptional()
    initialQuantity?: number;

    @ApiProperty({ required: false, description: 'Display order within stock entry' })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}

