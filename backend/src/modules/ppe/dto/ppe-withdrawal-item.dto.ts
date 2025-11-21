import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PPEWithdrawalItemDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    withdrawalId: string;

    @ApiProperty()
    @Expose()
    stockItemId: string;

    @ApiProperty()
    @Expose()
    requestedQuantity: number;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    approvedQuantity: number | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    issuedQuantity: number | null;

    @ApiProperty()
    @Expose()
    order: number;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    notes: string | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<PPEWithdrawalItemDto>) {
        Object.assign(this, partial);
    }
}

