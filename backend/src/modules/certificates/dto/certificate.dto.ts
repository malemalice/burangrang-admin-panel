import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateTypeEnum } from '@prisma/client';
import { CertificateCategoryDto } from './certificate-category.dto';

export class CertificateDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    certificateNumber: string;

    @ApiProperty()
    @Expose()
    certificateName: string;

    @ApiProperty()
    @Expose()
    categoryId: string;

    @ApiProperty({ required: false })
    @Expose()
    category?: CertificateCategoryDto;

    @ApiProperty({ enum: CertificateTypeEnum })
    @Expose()
    certificateType: CertificateTypeEnum;

    @ApiProperty()
    @Expose()
    issuedDate: Date;

    @ApiProperty()
    @Expose()
    validityDate: Date;

    @ApiProperty()
    @Expose()
    issuerName: string;

    @ApiProperty({ required: false })
    @Expose()
    documentUrl?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    personnelId?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    personnelName?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    equipmentId?: string | null;

    @ApiProperty({ required: false })
    @Expose()
    equipmentName?: string | null;

    @ApiProperty()
    @Expose()
    departmentId: string;

    @ApiProperty({ required: false })
    @Expose()
    department?: any;

    @ApiProperty()
    @Expose()
    reminderDays: number;

    @ApiProperty({ required: false })
    @Expose()
    notes?: string | null;

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

    @ApiProperty({ required: false })
    @Expose()
    creator?: any;

    constructor(partial: Partial<CertificateDto>) {
        Object.assign(this, partial);
    }
}

