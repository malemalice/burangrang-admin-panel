import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { HseTargetTypeEnum, MonthEnum } from '@prisma/client';

export class CreateHseTargetDto {
  @ApiProperty({ enum: HseTargetTypeEnum, description: 'Target type: incident, risk, inspection, audit' })
  @IsEnum(HseTargetTypeEnum)
  type: HseTargetTypeEnum;

  @ApiProperty({ description: 'Sub-dimension identifier', example: 'FATALITY' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Display label for the target scope' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: MonthEnum, description: 'Nullable for yearly-only targets' })
  @IsOptional()
  @IsEnum(MonthEnum)
  month?: MonthEnum;

  @ApiProperty({ description: 'Year', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Target value', example: 0 })
  @IsNumber()
  @Min(0)
  target: number;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
