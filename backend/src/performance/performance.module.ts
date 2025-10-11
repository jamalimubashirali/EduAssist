import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import {
  UserPerformance,
  UserPerformanceSchema,
} from './schema/performance.schema';
import { Attempt, AttemptSchema } from '../attempts/schema/attempts.schema';
import { User, UserSchema } from 'src/users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPerformance.name, schema: UserPerformanceSchema },
      { name: Attempt.name, schema: AttemptSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
