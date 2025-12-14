import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CreateDispatchOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() dispatchCode: string;
  @ApiProperty() @IsDateString() dispatchDate: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() memo?: string;
  @ApiProperty({ required: false }) @IsBoolean() @IsOptional() isActive?: boolean;
}
