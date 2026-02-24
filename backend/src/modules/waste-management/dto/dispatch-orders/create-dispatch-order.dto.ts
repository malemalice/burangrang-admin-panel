import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateDispatchOrderAttachmentDto } from './dispatch-order-attachment.dto';

export class CreateDispatchOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() dispatchCode: string;
  @ApiProperty() @IsDateString() dispatchDate: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() memo?: string;
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [CreateDispatchOrderAttachmentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDispatchOrderAttachmentDto)
  attachments?: CreateDispatchOrderAttachmentDto[];
}
