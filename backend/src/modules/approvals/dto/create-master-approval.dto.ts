import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateMasterApprovalItemDto {
  @IsString()
  jobPositionId: string;

  @IsString()
  departmentId: string;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value) || 1)
  order: number;
}

export class CreateMasterApprovalDto {
  @IsString()
  entity: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMasterApprovalItemDto)
  items: CreateMasterApprovalItemDto[];
}
