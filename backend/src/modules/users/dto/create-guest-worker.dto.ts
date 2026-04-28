import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGuestWorkerDto {
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

  @ApiProperty({ required: false, description: 'Contractor / vendor company' })
  @IsUUID()
  @IsOptional()
  companyId?: string;
}
