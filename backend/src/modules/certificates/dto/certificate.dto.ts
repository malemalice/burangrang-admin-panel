import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsInt, IsBoolean, IsEnum, IsDateString } from 'class-validator';

export enum CertificateTypeEnum {
  PERSONNEL_LICENSE = 'PERSONNEL_LICENSE',
  PERSONNEL_CERTIFICATE = 'PERSONNEL_CERTIFICATE',
  EQUIPMENT_CALIBRATION = 'EQUIPMENT_CALIBRATION',
  EQUIPMENT_INSTALLATION = 'EQUIPMENT_INSTALLATION',
  EQUIPMENT_OPERATIONAL_PERMIT = 'EQUIPMENT_OPERATIONAL_PERMIT',
}

export class CertificateDto {
  @ApiProperty({ description: 'Certificate unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Certificate number' })
  @Expose()
  @IsString()
  certificateNumber: string;

  @ApiProperty({ description: 'Certificate name' })
  @Expose()
  @IsString()
  certificateName: string;

  @ApiProperty({ description: 'Category ID' })
  @Expose()
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Certificate type', enum: CertificateTypeEnum })
  @Expose()
  @IsEnum(CertificateTypeEnum)
  certificateType: CertificateTypeEnum;

  @ApiProperty({ description: 'Issued date' })
  @Expose()
  @IsDate()
  issuedDate: Date;

  @ApiProperty({ description: 'Validity date (expiry date)' })
  @Expose()
  @IsDate()
  validityDate: Date;

  @ApiProperty({ description: 'Issuer name' })
  @Expose()
  @IsString()
  issuerName: string;

  @ApiProperty({ description: 'Document URL', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiProperty({ description: 'Personnel ID (user ID)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  personnelId?: string;

  @ApiProperty({ description: 'Personnel name (free text)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  personnelName?: string;

  @ApiProperty({ description: 'Equipment ID', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  equipmentId?: string;

  @ApiProperty({ description: 'Equipment name (free text)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  equipmentName?: string;

  @ApiProperty({ description: 'Department ID' })
  @Expose()
  @IsString()
  departmentId: string;

  @ApiProperty({ description: 'Reminder days before expiry', default: 30 })
  @Expose()
  @IsInt()
  reminderDays: number;

  @ApiProperty({ description: 'Notes', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Whether certificate is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Created by user ID' })
  @Expose()
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @IsDate()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Certificate category', required: false })
  @Expose()
  @IsOptional()
  category?: {
    id: string;
    name: string;
    code: string;
    certificateType: CertificateTypeEnum;
  };

  @ApiProperty({ description: 'Department', required: false })
  @Expose()
  @IsOptional()
  department?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Personnel (user)', required: false })
  @Expose()
  @IsOptional()
  personnel?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  constructor(partial: Partial<CertificateDto>) {
    Object.assign(this, partial);
  }
}
