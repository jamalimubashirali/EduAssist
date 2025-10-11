import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAttemptDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  quizId: string;

  @IsNotEmpty()
  @IsString()
  topicId: string;

  @IsOptional()
  @IsString()
  subjectId?: string;
}
