import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateTypeEnum } from '@prisma/client';

export class ResponsibleDepartmentDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty({ type: [String], required: false })
    @Expose()
    emails?: string[] | null;
}

export class CertificateCategoryDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    code: string;

    @ApiProperty({ enum: CertificateTypeEnum })
    @Expose()
    certificateType: CertificateTypeEnum;

    @ApiProperty({ required: false })
    @Expose()
    description?: string | null;

    @ApiProperty()
    @Expose()
    isActive: boolean;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    @ApiProperty({ type: [ResponsibleDepartmentDto] })
    @Expose()
    @Type(() => ResponsibleDepartmentDto)
    responsibleDepartments: ResponsibleDepartmentDto[];

    constructor(partial: Partial<CertificateCategoryDto>) {
        Object.assign(this, partial);
    }
}

