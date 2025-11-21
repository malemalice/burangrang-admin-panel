import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CertificateRenewalStatusEnum } from '@prisma/client';

export class UpdateCertificateRenewalDto {
    @ApiProperty({ enum: CertificateRenewalStatusEnum, description: 'Renewal status', required: false })
    @IsEnum(CertificateRenewalStatusEnum)
    @IsOptional()
    status?: CertificateRenewalStatusEnum;

    @ApiProperty({ description: 'New validity date', required: false })
    @IsDateString()
    @IsOptional()
    newValidityDate?: string;

    @ApiProperty({ description: 'New document URL', required: false })
    @IsString()
    @IsOptional()
    newDocumentUrl?: string;

    @ApiProperty({ description: 'Notes', required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

