import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let mockPerformanceService: any;

  beforeEach(async () => {
    mockPerformanceService = {
      getUserPerformance: jest.fn(),
      updatePerformance: jest.fn(),
      getPerformanceAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
