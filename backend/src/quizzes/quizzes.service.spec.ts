import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let mockQuizzesService: any;

  beforeEach(async () => {
    mockQuizzesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      generatePersonalizedQuiz: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: QuizzesService,
          useValue: mockQuizzesService,
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});