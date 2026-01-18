import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';

describe('TopicsService', () => {
  let service: TopicsService;
  let mockTopicsService: any;

  beforeEach(async () => {
    mockTopicsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TopicsService,
          useValue: mockTopicsService,
        },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
