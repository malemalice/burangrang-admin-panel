import { PartialType } from '@nestjs/swagger';
import { CreateManHourDto } from './create-man-hour.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateManHourDto extends PartialType(CreateManHourDto) {
  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
