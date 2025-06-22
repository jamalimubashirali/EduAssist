import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from './schema/quizzes.schema';
import { Question, QuestionSchema } from '../questions/schema/questions.schema';
import { UserPerformance, UserPerformanceSchema } from '../performance/schema/performance.schema';
import { Attempt, AttemptSchema } from '../attempts/schema/attempts.schema';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: UserPerformance.name, schema: UserPerformanceSchema },
      { name: Attempt.name, schema: AttemptSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  providers: [QuizzesService],
  controllers: [QuizzesController],
  exports: [QuizzesService]
})
export class QuizzesModule {}
