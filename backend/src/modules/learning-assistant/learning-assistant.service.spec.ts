import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LearningAssistantService } from './learning-assistant.service';
import { PerformanceService } from '../../performance/performance.service';
import { ChatSession } from './schemas/chat-session.schema';

describe('LearningAssistantService', () => {
  let service: LearningAssistantService;
  let performanceService: PerformanceService;

  const mockChatModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockPerformanceService = {
    getUserTopicPerformances: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningAssistantService,
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
        {
          provide: getModelToken(ChatSession.name),
          useValue: mockChatModel,
        },
      ],
    }).compile();

    service = module.get<LearningAssistantService>(LearningAssistantService);
    performanceService = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildLearningContext', () => {
    it('should return empty context when no performances exist', async () => {
      mockPerformanceService.getUserTopicPerformances.mockResolvedValue([]);

      const context = await service['buildLearningContext']('user123');

      expect(context).toEqual({
        weakTopics: [],
        strongTopics: [],
        targetScore: 75,
        currentAverageScore: 0,
        recentPerformance: [],
      });
    });

    it('should identify weak and strong topics correctly', async () => {
      const mockPerformances = [
        {
          topicId: { name: 'Algebra' },
          averageScore: 45,
          progressTrend: 'declining',
        },
        {
          topicId: { name: 'Geometry' },
          averageScore: 85,
          progressTrend: 'improving',
        },
      ];

      mockPerformanceService.getUserTopicPerformances.mockResolvedValue(
        mockPerformances,
      );

      const context = await service['buildLearningContext']('user123');

      expect(context.weakTopics).toContain('Algebra');
      expect(context.strongTopics).toContain('Geometry');
      expect(context.currentAverageScore).toBe(65);
    });
  });
});
