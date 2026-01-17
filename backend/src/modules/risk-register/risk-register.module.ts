import { Module } from '@nestjs/common';
import { RiskRegisterController } from './controllers/risk-register.controller';
import { RiskRegisterService } from './services/risk-register.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [RiskRegisterController],
  providers: [RiskRegisterService],
  exports: [RiskRegisterService],
})
export class RiskRegisterModule {}
