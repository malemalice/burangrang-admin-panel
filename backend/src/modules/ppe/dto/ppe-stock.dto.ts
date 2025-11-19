import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PPEStockItemDto } from './ppe-stock-item.dto';

export class PPEStockDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    stockCode: string;

    @ApiProperty()
    @Expose()
    receivedDate: Date;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    notes: string | null;

    @ApiProperty()
    @Expose()
    isActive: boolean;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    @ApiProperty()
    @Expose()
    createdBy: string;

    @ApiProperty({ required: false, type: [PPEStockItemDto] })
    @Expose()
    items?: PPEStockItemDto[];

    constructor(partial: Partial<PPEStockDto>) {
        Object.assign(this, partial);
    }
}

