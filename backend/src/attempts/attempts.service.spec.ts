import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AttemptsService } from './attempts.service';
import { Attempt } from './schema/attempts.schema';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { PerformanceService } from '../performance/performance.service';
import { createMockModel } from '../../test/setup';

describe('AttemptsService', () => {
  let service: AttemptsService;
  let mockAttemptModel: any;
  let mockRecommendationsService: Partial<RecommendationsService>;
  let mockPerformanceService: Partial<PerformanceService>;

  beforeEach(async () => {
    mockAttemptModel = createMockModel('Attempt');
    mockRecommendationsService = {
      generateRecommendationFromAttempt: jest.fn(),
    };
    mockPerformanceService = {
      updatePerformance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptsService,
        {
          provide: getModelToken(Attempt.name),
          useValue: mockAttemptModel,
        },
        {
          provide: RecommendationsService,
          useValue: mockRecommendationsService,
        },
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    service = module.get<AttemptsService>(AttemptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of attempts', async () => {
      const mockAttempts = [
        { _id: '1', userId: '1', quizId: '1', score: 85 },
      ];

      mockAttemptModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAttempts),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockAttempts);
      expect(mockAttemptModel.find).toHaveBeenCalled();
    });
  });
});
