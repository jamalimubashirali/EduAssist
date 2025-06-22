import { IsArray, IsOptional, ValidateNested , IsString , IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateQuizDto } from './update-quiz.dto';

class QuizUpdateItem extends UpdateQuizDto {
    @IsNotEmpty()
    @IsString()
    quizId: string;
}

export class BulkUpdateQuizDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuizUpdateItem)
    quizzes: QuizUpdateItem[];

    @IsOptional()
    @IsString()
    reason?: string;
}