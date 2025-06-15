import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator';
import { DifficultyLevel } from 'common/enums';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    topicId: string;

    @IsNotEmpty()
    @IsString()
    subjectId: string;

    @IsNotEmpty()
    @IsEnum(DifficultyLevel)
    questionDifficulty: DifficultyLevel;

    @IsNotEmpty()
    @IsString()
    questionText: string;

    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    answerOptions: string[];

    @IsNotEmpty()
    @IsString()
    correctAnswer: string;
}