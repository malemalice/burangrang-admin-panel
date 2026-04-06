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

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    createdByName: string | null;

    @ApiProperty({ required: false, type: [PPEWithdrawalItemDto] })
    @Expose()
    items?: PPEWithdrawalItemDto[];

    // Approval action flags — populated only on detail (GET /ppe/withdrawals/:id)
    @ApiProperty({ required: false, nullable: true })
    @Expose()
    canApprove?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    @Expose()
    canReject?: boolean | null;

    @ApiProperty({
        required: false,
        nullable: true,
        description: 'Next approver in the approval chain, or null when none pending',
    })
    @Expose()
    nextApprover?: {
        line: number;
        department: { id: string; name: string };
        jobPosition: { id: string; name: string };
    } | null;

    constructor(partial: Partial<PPEWithdrawalDto>) {
        Object.assign(this, partial);
    }
}

