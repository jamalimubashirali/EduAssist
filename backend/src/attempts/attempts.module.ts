import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attempt, AttemptSchema } from './schema/attempts.schema';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { Topic, TopicSchema } from '../topics/schema/topics.schema';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
      { name: Topic.name, schema: TopicSchema },
      { name: User.name, schema: UserSchema },
    ]),
    RecommendationsModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
