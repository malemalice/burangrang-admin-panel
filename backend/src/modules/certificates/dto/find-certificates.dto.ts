import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { FindAllQueryDto } from '../../../shared/types/pagination-params';
import { CertificateTypeEnum } from './certificate.dto';

export class FindCertificatesDto extends FindAllQueryDto {
  @ApiProperty({
    description: 'Filter by certificate type',
    enum: CertificateTypeEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CertificateTypeEnum)
  certificateType?: CertificateTypeEnum;

  @ApiProperty({
    description: 'Filter by department ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
