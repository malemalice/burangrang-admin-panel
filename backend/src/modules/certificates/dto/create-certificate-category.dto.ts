import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { CertificateTypeEnum } from '@prisma/client';

export class CreateCertificateCategoryDto {
    @ApiProperty({ description: 'Name of the certificate category' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Unique code for the certificate category' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ enum: CertificateTypeEnum, description: 'Type of certificate' })
    @IsEnum(CertificateTypeEnum)
    @IsNotEmpty()
    certificateType: CertificateTypeEnum;

    @ApiProperty({ description: 'Description of the certificate category', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Whether the category is active', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({
        description: 'IDs of departments responsible for certificates in this category (notified on expiry)',
        type: [String],
        required: false,
    })
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    responsibleDepartmentIds?: string[];
}

