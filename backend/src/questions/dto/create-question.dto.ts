import { IsNotEmpty, IsString, IsArray, IsEnum, ArrayMinSize, IsIn, ValidateIf } from 'class-validator';
import { DifficultyLevel } from 'common/enums';
import { Transform } from 'class-transformer';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    topicId: string;

    @IsNotEmpty()
    @IsString()
    subjectId: string;

    @IsNotEmpty()
    @IsEnum(DifficultyLevel, {
        message: 'questionDifficulty must be one of: Easy, Medium, Hard'
    })
    questionDifficulty: DifficultyLevel;

    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value?.trim()) // Remove extra spaces
    questionStatement: string;

    @IsNotEmpty()
    @IsArray()
    @ArrayMinSize(2, { message: 'At least 2 answer options are required' })
    @IsString({ each: true })
    @Transform(({ value }) => value?.map((option: string) => option?.trim())) // Clean options
    answerOptions: string[];

    @IsNotEmpty()
    @IsString()
    @Transform(({ value }) => value?.trim())
    correctAnswer: string;
}