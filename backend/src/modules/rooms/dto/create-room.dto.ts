import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ description: 'Room name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique room code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Room description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Associated area ID' })
  @IsUUID()
  @IsNotEmpty()
  areaId: string;

  @ApiProperty({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
