import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LearningAssistantService } from './learning-assistant.service';
import { ChatMessageDto, ChatResponseDto } from './dtos/chat.dto';

@Controller('learning-assistant')
export class LearningAssistantController {
  constructor(private readonly assistantService: LearningAssistantService) {}

  @Post('chat')
  async chatWithAssistant(
    @Req() req: any,
    @Body() chatDto: ChatMessageDto,
    @Query('sessionId') sessionId?: string,
  ): Promise<ChatResponseDto> {
    try {
      const userId = req.user.sub;

      if (!userId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const response = await this.assistantService.generateResponse(
        userId,
        chatDto.message,
        sessionId,
      );

      return {
        reply: response.reply,
        suggestedTopics: response.suggestedTopics,
        difficulty: response.difficulty,
        followUpQuestions: response.followUpQuestions,
        relatedConcepts: response.relatedConcepts,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to process chat message. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getChatHistory(@Req() req: any, @Query('sessionId') sessionId: string) {
    try {
      const userId = req.user.sub;

      if (!sessionId) {
        throw new HttpException(
          'Session ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const history = await this.assistantService.getChatHistory(
        userId,
        sessionId,
      );

      if (!history) {
        throw new HttpException('Chat session not found', HttpStatus.NOT_FOUND);
      }

      return {
        sessionId: history.sessionId,
        messages: history.messages,
        contextTopics: history.contextTopics,
        lastActivity: history.lastActivity,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions')
  async getUserSessions(@Req() req: any) {
    try {
      const userId = req.user.sub;
      const sessions = await this.assistantService.getUserSessions(userId);

      return sessions.map((session) => ({
        sessionId: session.sessionId,
        lastActivity: session.lastActivity,
        messageCount: session.messages.length,
        contextTopics: session.contextTopics,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve user sessions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
