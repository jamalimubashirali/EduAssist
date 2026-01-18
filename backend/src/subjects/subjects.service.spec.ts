import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';

// Mock the SubjectsService to avoid database dependencies
const mockSubjectsService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('SubjectsService', () => {
  let service: SubjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SubjectsService,
          useValue: mockSubjectsService,
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of subjects', async () => {
      const mockSubjects = [
        { _id: '1', subjectName: 'Math', subjectDescription: 'Mathematics' },
        { _id: '2', subjectName: 'Science', subjectDescription: 'Science' },
      ];

      mockSubjectsService.findAll.mockResolvedValue(mockSubjects);

      const result = await service.findAll();
      expect(result).toEqual(mockSubjects);
      expect(mockSubjectsService.findAll).toHaveBeenCalled();
    });
  });
});
