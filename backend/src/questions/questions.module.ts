import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schema/questions.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService, MongooseModule]
})
export class QuestionsModule {}
