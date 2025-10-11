import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class SubmitAnswerDto {
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @IsNotEmpty()
  @IsString()
  selectedAnswer: string;

  @IsNotEmpty()
  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}
