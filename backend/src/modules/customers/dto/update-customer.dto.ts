import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateCustomerDto {
  // Only customer-specific fields can be updated (no user fields)
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
  dateOfBirth?: string;

  @ApiProperty({ description: 'Gender', required: false })
  @IsOptional()
  @IsString()
  gender?: string;
}
