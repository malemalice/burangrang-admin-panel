import { IsUUID, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInspectionInspectorDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  inspectorId: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({ minimum: 1 })
  order: number;
}

