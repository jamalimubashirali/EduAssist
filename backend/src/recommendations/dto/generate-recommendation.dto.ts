import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class GenerateRecommendationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  attemptId: string;

  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsNotEmpty()
  @IsString()
  topicId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  attemptScore: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageScore: number;
}