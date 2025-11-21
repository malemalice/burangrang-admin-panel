import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, IsEnum, Min } from 'class-validator';
import { CertificateTypeEnum } from '@prisma/client';

export class FindCertificatesOptions {
    @ApiProperty({ required: false, default: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number;

    @ApiProperty({ required: false, default: 10 })
    @IsInt()
    @Min(1)
    @IsOptional()
    limit?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({ enum: CertificateTypeEnum, required: false })
    @IsEnum(CertificateTypeEnum)
    @IsOptional()
    certificateType?: CertificateTypeEnum;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    departmentId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    personnelId?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    expired?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    expiringSoon?: boolean;
}

