import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RiskMatrixService } from '../services/risk-matrix.service';
import { CalculateRiskDto } from '../dto/calculate-risk.dto';
import { RiskRating } from '../interfaces/risk-matrix.interface';

@ApiTags('Risk Matrix')
@Controller('risk-matrix')
export class RiskMatrixController {
  constructor(private readonly riskMatrixService: RiskMatrixService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate risk rating based on likelihood and consequence levels',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the calculated risk rating',
    type: 'object',
  })
  calculateRiskRating(@Body() calculateRiskDto: CalculateRiskDto): RiskRating {
    return this.riskMatrixService.calculateRiskRating(
      calculateRiskDto.likelihoodLevel,
      calculateRiskDto.consequenceLevel,
    );
  }
}