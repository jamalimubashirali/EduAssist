import { Test, TestingModule } from '@nestjs/testing';
import { LearningAssistantController } from './learning-assistant.controller';
import { LearningAssistantService } from './learning-assistant.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('LearningAssistantController', () => {
  let controller: LearningAssistantController;
  let service: LearningAssistantService;

  const mockLearningAssistantService = {
    generateResponse: jest.fn(),
    getChatHistory: jest.fn(),
    getUserSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningAssistantController],
      providers: [
        {
          provide: LearningAssistantService,
          useValue: mockLearningAssistantService,
        },
      ],
    }).compile();

    controller = module.get<LearningAssistantController>(
      LearningAssistantController,
    );
    service = module.get<LearningAssistantService>(LearningAssistantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chatWithAssistant', () => {
    it('should return chat response successfully', async () => {
      const mockRequest = { user: { sub: 'user123' } };
      const mockChatDto = { message: 'Help me with algebra' };
      const mockResponse = {
        reply: 'I can help you with algebra!',
        suggestedTopics: ['Linear Equations'],
        difficulty: 'intermediate' as const,
        followUpQuestions: ['What specific part of algebra?'],
        relatedConcepts: ['Variables'],
      };

      mockLearningAssistantService.generateResponse.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.chatWithAssistant(
        mockRequest,
        mockChatDto,
      );

      expect(result).toEqual(mockResponse);
      expect(service.generateResponse).toHaveBeenCalledWith(
        'user123',
        'Help me with algebra',
        undefined,
      );
    });

    it('should throw HttpException when user is not authenticated', async () => {
      const mockRequest = { user: {} };
      const mockChatDto = { message: 'Help me with algebra' };

      await expect(
        controller.chatWithAssistant(mockRequest, mockChatDto),
      ).rejects.toThrow(
        new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('getChatHistory', () => {
    it('should return chat history successfully', async () => {
      const mockRequest = { user: { sub: 'user123' } };
      const mockHistory = {
        sessionId: 'session123',
        messages: [],
        contextTopics: [],
        lastActivity: new Date(),
      };

      mockLearningAssistantService.getChatHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await controller.getChatHistory(mockRequest, 'session123');

      expect(result).toEqual(mockHistory);
    });

    it('should throw HttpException when session not found', async () => {
      const mockRequest = { user: { sub: 'user123' } };

      mockLearningAssistantService.getChatHistory.mockResolvedValue(null);

      await expect(
        controller.getChatHistory(mockRequest, 'session123'),
      ).rejects.toThrow(
        new HttpException('Chat session not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
