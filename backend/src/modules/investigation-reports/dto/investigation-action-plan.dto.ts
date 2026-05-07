import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class InvestigationActionPlanDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  investigationReportId: string;

  @ApiProperty()
  @Expose()
  actionPlan: string;

  @ApiProperty({ required: false })
  @Expose()
  responsiblePerson?: string;

  @ApiProperty({ required: false })
  @Expose()
  targetDate?: Date;

  @ApiProperty({ required: false })
  @Expose()
  targetDateNotes?: string;

  @ApiProperty({ required: false })
  @Expose()
  verificationDate?: Date;

  @ApiProperty({ required: false })
  @Expose()
  verifiedBy?: string;

  @ApiProperty({ type: () => UserDto, required: false })
  @Expose()
  verifier?: UserDto;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<InvestigationActionPlanDto>) {
    Object.assign(this, partial);
  }
}

export class UpsertInvestigationActionPlanDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  actionPlan: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  responsiblePerson?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  targetDate?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  targetDateNotes?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  verificationDate?: Date;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  verifiedBy?: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
