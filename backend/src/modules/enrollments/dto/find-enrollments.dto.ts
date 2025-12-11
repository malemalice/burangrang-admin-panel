import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FindAllQueryDto } from '../../../shared/types/pagination-params';

export class FindEnrollmentsDto extends FindAllQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, enum: ['INVITED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedBy?: string;
}
