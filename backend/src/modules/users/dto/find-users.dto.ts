import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export interface FindUsersOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  roleId?: string;
  officeId?: string;
  departmentId?: string;
  jobPositionId?: string;
}

export class FindUsersDto implements FindUsersOptions {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : undefined))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(String(value), 10) : undefined))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value === undefined ? undefined : Boolean(value);
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  officeId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  jobPositionId?: string;
}
