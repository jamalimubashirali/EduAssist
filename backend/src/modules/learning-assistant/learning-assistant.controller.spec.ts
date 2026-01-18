import { Test, TestingModule } from '@nestjs/testing';
import { LearningAssistantController } from './learning-assistant.controller';
import { LearningAssistantService } from './learning-assistant.service';

describe('LearningAssistantController', () => {
  let controller: LearningAssistantController;
  let mockLearningAssistantService: Partial<LearningAssistantService>;

  beforeEach(async () => {
    mockLearningAssistantService = {
      generateResponse: jest.fn().mockResolvedValue({
        reply: 'Test response',
        suggestedTopics: [],
        difficulty: 'intermediate',
        followUpQuestions: [],
        relatedConcepts: [],
      }),
      getChatHistory: jest.fn().mockResolvedValue(null),
      getUserSessions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningAssistantController],
      providers: [
        {
          provide: LearningAssistantService,
          useValue: mockLearningAssistantService,
        },
      ],
    }).compile();

    controller = module.get<LearningAssistantController>(LearningAssistantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});