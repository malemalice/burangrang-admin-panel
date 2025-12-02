import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { CertificateTypeEnum } from './certificate.dto';

export class UpdateCertificateDto {
  @ApiProperty({ description: 'Certificate number', required: false })
  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @ApiProperty({ description: 'Certificate name', required: false })
  @IsOptional()
  @IsString()
  certificateName?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Certificate type', enum: CertificateTypeEnum, required: false })
  @IsOptional()
  @IsEnum(CertificateTypeEnum)
  certificateType?: CertificateTypeEnum;

  @ApiProperty({ description: 'Issued date (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiProperty({ description: 'Validity date / Expiry date (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  validityDate?: string;

  @ApiProperty({ description: 'Issuer name', required: false })
  @IsOptional()
  @IsString()
  issuerName?: string;

  @ApiProperty({ description: 'Document URL', required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiProperty({ description: 'Personnel ID (user ID)', required: false })
  @IsOptional()
  @IsString()
  personnelId?: string;

  @ApiProperty({ description: 'Personnel name (free text)', required: false })
  @IsOptional()
  @IsString()
  personnelName?: string;

  @ApiProperty({ description: 'Equipment ID', required: false })
  @IsOptional()
  @IsString()
  equipmentId?: string;

  @ApiProperty({ description: 'Equipment name (free text)', required: false })
  @IsOptional()
  @IsString()
  equipmentName?: string;

  @ApiProperty({ description: 'Department ID', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ description: 'Reminder days before expiry', required: false, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  reminderDays?: number;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Whether certificate is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
