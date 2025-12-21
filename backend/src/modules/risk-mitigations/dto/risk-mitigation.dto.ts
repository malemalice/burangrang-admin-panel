import { ApiProperty } from '@nestjs/swagger';
import { RiskDto } from '../../risks/dto/risk.dto';

export class RiskMitigationDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  eliminate?: string;

  @ApiProperty({ required: false })
  transfer?: string;

  @ApiProperty({ required: false })
  reduce?: string;

  @ApiProperty({ required: false })
  accept?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  riskId: string;

  @ApiProperty({ type: () => RiskDto, required: false })
  risk?: RiskDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
