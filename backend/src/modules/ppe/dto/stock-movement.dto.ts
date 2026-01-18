import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class StockMovementDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    movementType: string;

    @ApiProperty({ required: false })
    @Expose()
    adjustmentType?: string;

    @ApiProperty()
    @Expose()
    quantity: number;

    @ApiProperty()
    @Expose()
    runningBalance: number;

    @ApiProperty()
    @Expose()
    date: Date;

    @ApiProperty({ required: false })
    @Expose()
    referenceCode?: string;

    @ApiProperty({ required: false })
    @Expose()
    notes?: string;

    @ApiProperty()
    @Expose()
    performedBy: {
        id: string;
        name: string;
    };

    @ApiProperty({ required: false })
    @Expose()
    metadata?: Record<string, any>;

    constructor(partial: Partial<StockMovementDto>) {
        Object.assign(this, partial);
    }
}
