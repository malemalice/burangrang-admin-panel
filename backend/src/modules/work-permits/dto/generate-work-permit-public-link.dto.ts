import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GenerateWorkPermitPublicLinkDto {
  @ApiProperty({
    required: false,
    description:
      'Work permit id to generate an anonymous applicant link for (preferred when known)',
  })
  @IsOptional()
  @IsString()
  workPermitId?: string;

  @ApiProperty({
    required: false,
    description:
      'Applicant (contractor) user id — resolves the latest work permit for that applicant when workPermitId is omitted',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

