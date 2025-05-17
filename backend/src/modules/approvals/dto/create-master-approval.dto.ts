import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMasterApprovalItemDto {
  @IsString()
  role_id: string;

  @IsString()
  department_id: string;

  @IsString()
  createdBy: string;

  @IsOptional()
  order?: number;
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
