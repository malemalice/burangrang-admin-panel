import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { SharedModule } from '../../shared/shared.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [SharedModule, EnrollmentsModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule { }
