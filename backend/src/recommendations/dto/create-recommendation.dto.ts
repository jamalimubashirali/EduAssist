import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { DifficultyLevel, RecommendationStatus } from 'common/enums';

export class CreateRecommendationDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsNotEmpty()
  @IsString()
  topicId: string;

  @IsNotEmpty()
  @IsString()
  attemptId: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  recommendationReason?: string;

  @IsNotEmpty()
  @IsEnum(DifficultyLevel, {
    message: 'suggestedDifficulty must be one of: Easy, Medium, Hard',
  })
  suggestedDifficulty: DifficultyLevel;

  @IsOptional()
  @IsEnum(RecommendationStatus, {
    message:
      'recommendationStatus must be one of: Pending, Accepted, Rejected, Completed',
  })
  recommendationStatus?: RecommendationStatus = RecommendationStatus.PENDING;
}
