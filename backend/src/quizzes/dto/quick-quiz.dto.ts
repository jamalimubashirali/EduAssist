import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { DifficultyLevel } from 'common/enums';

export class QuickQuizDto {
    @IsNotEmpty()
    @IsString()
    topicId: string;

    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(25)
    questionCount?: number = 10;

    @IsOptional()
    @IsEnum(DifficultyLevel)
    difficulty?: DifficultyLevel = DifficultyLevel.MEDIUM;

    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(60)
    timeLimit?: number = 15;
}