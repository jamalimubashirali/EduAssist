import { Test, TestingModule } from '@nestjs/testing';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

describe('AttemptsController', () => {
  let controller: AttemptsController;
  let mockAttemptsService: Partial<AttemptsService>;

  beforeEach(async () => {
    mockAttemptsService = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptsController],
      providers: [
        {
          provide: AttemptsService,
          useValue: mockAttemptsService,
        },
      ],
    }).compile();

    controller = module.get<AttemptsController>(AttemptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});