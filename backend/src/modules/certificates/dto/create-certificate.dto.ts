import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { CertificateTypeEnum } from './certificate.dto';

export class CreateCertificateDto {
  @ApiProperty({ description: 'Certificate number' })
  @IsString()
  @IsNotEmpty()
  certificateNumber: string;

  @ApiProperty({ description: 'Certificate name' })
  @IsString()
  @IsNotEmpty()
  certificateName: string;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Certificate type', enum: CertificateTypeEnum })
  @IsEnum(CertificateTypeEnum)
  @IsNotEmpty()
  certificateType: CertificateTypeEnum;

  @ApiProperty({ description: 'Issued date (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  issuedDate: string;

  @ApiProperty({ description: 'Validity date / Expiry date (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  validityDate: string;

  @ApiProperty({ description: 'Issuer name' })
  @IsString()
  @IsNotEmpty()
  issuerName: string;

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

  @ApiProperty({ description: 'Department ID' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Reminder days before expiry', default: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  reminderDays?: number;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
