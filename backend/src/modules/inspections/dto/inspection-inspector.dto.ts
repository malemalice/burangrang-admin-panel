import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class InspectionInspectorDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionId: string;

  @ApiProperty()
  @Expose()
  inspectorId: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  inspector: UserDto;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<InspectionInspectorDto>) {
    Object.assign(this, partial);
  }
}

