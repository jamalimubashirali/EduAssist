import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LearningAssistantController } from './learning-assistant.controller';
import { LearningAssistantService } from './learning-assistant.service';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema';
import { PerformanceModule } from '../../performance/performance.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    PerformanceModule, // Import to access PerformanceService
  ],
  controllers: [LearningAssistantController],
  providers: [LearningAssistantService],
  exports: [LearningAssistantService],
})
export class LearningAssistantModule {}
