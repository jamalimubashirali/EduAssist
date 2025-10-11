import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { Attempt, AttemptSchema } from '../attempts/schema/attempts.schema';
import { QuestionsModule } from '../questions/questions.module';
import { PerformanceModule } from '../performance/performance.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { SubjectsModule } from 'src/subjects/subjects.module';
import { SubjectsService } from 'src/subjects/subjects.service';
import { Subject, SubjectSchema } from 'src/subjects/schema/subjects.schema';
import { TopicsModule } from 'src/topics/topics.module';
import { TopicsService } from 'src/topics/topics.service';
import { Topic, TopicSchema } from 'src/topics/schema/topics.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Attempt.name, schema: AttemptSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Topic.name, schema: TopicSchema },
    ]),
    SubjectsModule,
    QuestionsModule,
    PerformanceModule,
    RecommendationsModule,
    TopicsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, SubjectsService, TopicsService],
  exports: [UsersService],
})
export class UsersModule {}
