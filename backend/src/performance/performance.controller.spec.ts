import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  let mockPerformanceService: Partial<PerformanceService>;

  beforeEach(async () => {
    mockPerformanceService = {
      getUserPerformance: jest.fn().mockResolvedValue([]),
      updatePerformance: jest.fn().mockResolvedValue({}),
      getPerformanceAnalytics: jest.fn().mockResolvedValue({}),
      getUserGoalProgress: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});