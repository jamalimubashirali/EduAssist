import { PartialType } from '@nestjs/mapped-types';
import { CreateAttemptDto } from './create-attempt.dto';
import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateAttemptDto extends PartialType(CreateAttemptDto) {
  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  timeTaken?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
