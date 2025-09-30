import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsEmail, IsNotEmpty, MinLength, IsUUID } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Associated User ID (optional - will create user if not provided)', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  // User creation fields (required if userId is not provided)
  @ApiProperty({ description: 'User email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'User password (minimum 6 characters)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiProperty({ description: 'User role ID (optional - will use default User role if not provided)', required: false })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({ description: 'User office ID (optional - will use default office if not provided)', required: false })
  @IsOptional()
  @IsUUID()
  officeId?: string;

  @ApiProperty({ description: 'User department ID', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'User job position ID', required: false })
  @IsOptional()
  @IsUUID()
  jobPositionId?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'State', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Postal code', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Is customer active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
