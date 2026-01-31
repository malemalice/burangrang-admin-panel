import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidentAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  attachmentUrl: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  order: number;
}
