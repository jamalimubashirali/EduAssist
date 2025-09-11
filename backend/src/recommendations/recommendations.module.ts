import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schema/recommendations.schema';
import { QuizzesModule } from 'src/quizzes/quizzes.module';
import { QuizzesService } from 'src/quizzes/quizzes.service';
import { Quiz, QuizSchema } from 'src/quizzes/schema/quizzes.schema';
import { QuestionsModule } from 'src/questions/questions.module';
import { Question, QuestionSchema } from 'src/questions/schema/questions.schema';
import { Topic, TopicSchema } from 'src/topics/schema/topics.schema';
import { UserPerformance, UserPerformanceSchema } from 'src/performance/schema/performance.schema';
import { Attempt, AttemptSchema } from 'src/attempts/schema/attempts.schema';
import { User, UserSchema } from 'src/users/schema/user.schema';

const RecommendationModelModule = MongooseModule.forFeature([
  { name: Recommendation.name, schema: RecommendationSchema },
  { name: Quiz.name, schema: QuizSchema },
  { name: Question.name, schema: QuestionSchema },
  { name: Topic.name, schema: TopicSchema },
  {
    name: UserPerformance.name, schema: UserPerformanceSchema
  },
  {
    name: Attempt.name, schema: AttemptSchema
  },
  {
    name: User.name, schema: UserSchema
  }
]);

@Module({
  imports: [RecommendationModelModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService, RecommendationModelModule]
})
export class RecommendationsModule {}
