import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PPEStockItemDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    stockId: string;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    safetyEquipmentId: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    equipmentName: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    equipmentType: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    equipmentSize: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    expiryDate: Date | null;

    @ApiProperty()
    @Expose()
    initialQuantity: number;

    @ApiProperty()
    @Expose()
    currentQuantity: number;

    @ApiProperty()
    @Expose()
    reservedQuantity: number;

    @ApiProperty({ enum: ['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISPOSED'] })
    @Expose()
    status: string;

    @ApiProperty()
    @Expose()
    order: number;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<PPEStockItemDto>) {
        Object.assign(this, partial);
    }
}

