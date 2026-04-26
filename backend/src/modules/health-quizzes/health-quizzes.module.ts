import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { HealthQuizzesController } from './health-quizzes.controller';
import { HealthQuizzesService } from './health-quizzes.service';

@Module({
  imports: [SharedModule, QuizzesModule],
  controllers: [HealthQuizzesController],
  providers: [HealthQuizzesService],
  exports: [HealthQuizzesService],
})
export class HealthQuizzesModule {}
