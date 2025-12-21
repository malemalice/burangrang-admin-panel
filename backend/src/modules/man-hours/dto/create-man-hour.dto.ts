import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ManHourGroupEnum, MonthEnum } from '@prisma/client';

export class CreateManHourDto {
  @ApiProperty({ description: 'Name/class identifier', example: 'Year 1-2' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ManHourGroupEnum, description: 'Group type (STUDENT or NON_STUDENT)' })
  @IsEnum(ManHourGroupEnum)
  group: ManHourGroupEnum;

  @ApiProperty({ description: 'Quantity of people', example: 100 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ description: 'Man hours per day', example: 6.5 })
  @IsNumber()
  @Min(0)
  @Max(24)
  manHourPerDay: number;

  @ApiProperty({ enum: MonthEnum, description: 'Month' })
  @IsEnum(MonthEnum)
  month: MonthEnum;

  @ApiProperty({ description: 'Year', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
