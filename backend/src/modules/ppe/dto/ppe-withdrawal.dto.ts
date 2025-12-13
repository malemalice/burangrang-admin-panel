import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PPEWithdrawalItemDto } from './ppe-withdrawal-item.dto';

export class PPEWithdrawalDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    withdrawalCode: string;

    @ApiProperty()
    @Expose()
    withdrawalDate: Date;

    @ApiProperty()
    @Expose()
    requestedBy: string;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    requestedFor: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    requestedForName: string | null;

    @ApiProperty()
    @Expose()
    departmentId: string;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    departmentName: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    jobPositionId: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    jobPositionName: string | null;

    @ApiProperty({ enum: ['PENDING', 'APPROVED', 'COLLECTED', 'CANCELLED'] })
    @Expose()
    status: string;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    withdrawalLetterUrl: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    collectedDate: Date | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    collectedBy: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    notes: string | null;

    @ApiProperty()
    @Expose()
    isActive: boolean;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    deletedAt: Date | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    @ApiProperty()
    @Expose()
    createdBy: string;

    @ApiProperty({ required: false, type: [PPEWithdrawalItemDto] })
    @Expose()
    items?: PPEWithdrawalItemDto[];

    constructor(partial: Partial<PPEWithdrawalDto>) {
        Object.assign(this, partial);
    }
}

