import { 
    IsNotEmpty, 
    IsString, 
    IsArray, 
    IsEnum, 
    IsOptional, 
    IsNumber, 
    Min, 
    Max, 
    ArrayMinSize, 
    IsBoolean,
    Length,
    Matches,
    ValidateNested,
    IsObject
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DifficultyLevel, QuizType } from 'common/enums';

class PersonalizationMetadataDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsObject()
    difficultyDistribution?: Record<string, number>;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    focusAreas?: string[];

    @IsOptional()
    @Type(() => Date)
    generatedAt?: Date;
}

export class CreateQuizDto {
    @IsNotEmpty({ message: 'Topic ID is required' })
    @IsString()
    @Matches(/^[0-9a-fA-F]{24}$/, { message: 'Invalid topic ID format' })
    topicId: string;

    @IsNotEmpty({ message: 'Question IDs are required' })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least 1 question is required' })
    @ArrayMinSize(50, { message: 'Maximum 50 questions allowed' })
    @IsString({ each: true })
    @Matches(/^[0-9a-fA-F]{24}$/, { each: true, message: 'Invalid question ID format' })
    questionIds: string[];

    @IsNotEmpty({ message: 'Quiz difficulty is required' })
    @IsEnum(DifficultyLevel, {
        message: 'quizDifficulty must be one of: Easy, Medium, Hard'
    })
    quizDifficulty: DifficultyLevel;

    @IsNotEmpty({ message: 'Quiz type is required' })
    @IsEnum(QuizType, {
        message: 'quizType must be one of: Practice, Assessment, Challenge'
    })
    quizType: QuizType;

    @IsNotEmpty({ message: 'Quiz title is required' })
    @IsString()
    @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
    @Transform(({ value }) => value?.trim())
    title: string;

    @IsOptional()
    @IsString()
    @Length(0, 500, { message: 'Description cannot exceed 500 characters' })
    @Transform(({ value }) => value?.trim())
    description?: string;

    @IsOptional()
    @IsNumber({}, { message: 'Time limit must be a number' })
    @Min(5, { message: 'Time limit must be at least 5 minutes' })
    @Max(180, { message: 'Time limit cannot exceed 180 minutes' })
    timeLimit?: number = 30;

    @IsOptional()
    @IsString()
    @Length(16, 16, { message: 'Session ID must be exactly 16 characters' })
    sessionId?: string;

    @IsOptional()
    @IsBoolean()
    isPersonalized?: boolean = false;

    @IsOptional()
    @ValidateNested()
    @Type(() => PersonalizationMetadataDto)
    personalizationMetadata?: PersonalizationMetadataDto;
}