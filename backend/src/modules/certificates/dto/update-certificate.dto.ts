import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsInt, IsUUID, Min } from 'class-validator';

export class UpdateCertificateDto {
  @ApiProperty({ description: 'Certificate number', required: false })
  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @ApiProperty({ description: 'Certificate name', required: false })
  @IsString()
  @IsOptional()
  certificateName?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Issued date', required: false })
  @IsDateString()
  @IsOptional()
  issuedDate?: string;

  @ApiProperty({ description: 'Validity date', required: false })
  @IsDateString()
  @IsOptional()
  validityDate?: string;

  @ApiProperty({ description: 'Issuer name', required: false })
  @IsString()
  @IsOptional()
  issuerName?: string;

  @ApiProperty({ description: 'Document URL', required: false })
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @ApiProperty({ description: 'Personnel ID', required: false })
  @IsUUID()
  @IsOptional()
  personnelId?: string;

  @ApiProperty({ description: 'Personnel name', required: false })
  @IsString()
  @IsOptional()
  personnelName?: string;

  @ApiProperty({ description: 'Equipment ID', required: false })
  @IsString()
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({ description: 'Equipment name', required: false })
  @IsString()
  @IsOptional()
  equipmentName?: string;

  @ApiProperty({ description: 'Department ID', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ description: 'Reminder days before expiry', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  reminderDays?: number;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Whether the certificate is active', required: false })
  @IsOptional()
  isActive?: boolean;
}

