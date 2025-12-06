import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateCertificateRenewalDto {
    @ApiProperty({ description: 'Notes for the renewal request', required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

