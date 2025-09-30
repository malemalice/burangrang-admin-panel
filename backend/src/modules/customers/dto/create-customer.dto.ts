import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEmail, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
  // Essential fields for lean form
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  // Phone OR Email required (at least one)
  @ApiProperty({ description: 'Phone number (required if email not provided)', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'User email address (required if phone not provided)', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Optional user fields (will use defaults if not provided)
  @ApiProperty({ description: 'User department ID (optional - will be null if not provided)', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ description: 'User job position ID (optional - will be null if not provided)', required: false })
  @IsOptional()
  @IsUUID()
  jobPositionId?: string;

  // Optional customer-specific fields (hidden by default in lean form)
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
  dateOfBirth?: string;

  @ApiProperty({ description: 'Gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;
}
