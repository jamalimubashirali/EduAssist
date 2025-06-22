import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Attempt, AttemptSchema } from './schema/attempts.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Attempt.name, schema: AttemptSchema }])],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService]
})
export class AttemptsModule {}
