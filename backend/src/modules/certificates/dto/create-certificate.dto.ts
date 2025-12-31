import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsInt, IsUUID, Min } from 'class-validator';
import { CertificateTypeEnum } from '@prisma/client';

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
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ enum: CertificateTypeEnum, description: 'Type of certificate' })
  @IsEnum(CertificateTypeEnum)
  @IsNotEmpty()
  certificateType: CertificateTypeEnum;

  @ApiProperty({ description: 'Issued date' })
  @IsDateString()
  @IsNotEmpty()
  issuedDate: string;

  @ApiProperty({ description: 'Validity date' })
  @IsDateString()
  @IsNotEmpty()
  validityDate: string;

  @ApiProperty({ description: 'Issuer name' })
  @IsString()
  @IsNotEmpty()
  issuerName: string;

  @ApiProperty({ description: 'Document URL', required: false })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiProperty({ description: 'Personnel ID (if certificate is for personnel)', required: false })
  @IsUUID()
  @IsOptional()
  personnelId?: string;

  @ApiProperty({ description: 'Personnel name (if personnelId is not provided)', required: false })
  @IsString()
  @IsOptional()
  personnelName?: string;

  @ApiProperty({ description: 'Equipment ID (if certificate is for equipment)', required: false })
  @IsString()
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({ description: 'Equipment name (required for equipment certificates)', required: false })
  @IsString()
  @IsOptional()
  equipmentName?: string;

  @ApiProperty({ description: 'Department ID' })
  @IsUUID()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Reminder days before expiry', default: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  reminderDays?: number;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

