import { ApiProperty } from '@nestjs/swagger';
import { RiskDto } from '../../risks/dto/risk.dto';

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

  @ApiProperty({ type: () => RiskDto, required: false })
  threat?: RiskDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 