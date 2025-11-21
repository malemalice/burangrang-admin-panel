import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateRenewalStatusEnum } from '@prisma/client';

export class CertificateRenewalDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    certificateId: string;

    @ApiProperty({ required: false })
    @Expose()
    certificate?: any;

    @ApiProperty()
    @Expose()
    requestDate: Date;

    @ApiProperty()
    @Expose()
    requestedBy: string;

    @ApiProperty({ required: false })
    @Expose()
    requester?: any;

    @ApiProperty({ enum: CertificateRenewalStatusEnum })
    @Expose()
    status: CertificateRenewalStatusEnum;

    @ApiProperty({ required: false })
    @Expose()
    processedBy?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    processor?: any;

    @ApiProperty({ required: false })
    @Expose()
    processedDate?: Date | null;

    @ApiProperty({ required: false })
    @Expose()
    newValidityDate?: Date | null;

    @ApiProperty({ required: false })
    @Expose()
    newDocumentUrl?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    notes?: string | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    constructor(partial: Partial<CertificateRenewalDto>) {
        Object.assign(this, partial);
    }
}

