import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CertificateTypeEnum } from '@prisma/client';

export class UpdateCertificateCategoryDto {
    @ApiProperty({ description: 'Name of the certificate category', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Unique code for the certificate category', required: false })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({ enum: CertificateTypeEnum, description: 'Type of certificate', required: false })
    @IsEnum(CertificateTypeEnum)
    @IsOptional()
    certificateType?: CertificateTypeEnum;

    @ApiProperty({ description: 'Description of the certificate category', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Whether the category is active', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

