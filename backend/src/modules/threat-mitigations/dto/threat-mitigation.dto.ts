import { ApiProperty } from '@nestjs/swagger';
import { ThreatDto } from '../../threats/dto/threat.dto';

export class ThreatMitigationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  mitigationDescription: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  threatId: string;

  @ApiProperty({ type: () => ThreatDto, required: false })
  threat?: ThreatDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 