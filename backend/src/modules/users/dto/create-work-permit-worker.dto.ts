import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/** Body for POST /users/work-permit-worker — creates a user with CONTRACTOR role and random password */
export class CreateWorkPermitWorkerDto {
  @ApiProperty({ description: 'Worker email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Worker first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Worker last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    required: false,
    description:
      'Contractor / vendor company. Required when created by Super Admin; ignored for company-scoped users (uses requester company).',
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty({
    required: false,
    description: 'Default profession for this contractor (optional)',
  })
  @IsUUID()
  @IsOptional()
  professionId?: string;

  @ApiProperty({
    required: false,
    description: 'Worker ID number (e.g. national ID), optional',
  })
  @IsString()
  @IsOptional()
  idNumber?: string;
}
