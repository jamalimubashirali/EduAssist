import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Question } from './schema/questions.schema';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { DifficultyLevel } from 'common/enums';

@Controller('questions')
export class QuestionsController {
    constructor(private questionsService: QuestionsService) {}

    @Post('create-question')
    @HttpCode(HttpStatus.CREATED)
    async createQuestion(@Body() createQuestionDto: CreateQuestionDto): Promise<Question> {
        return this.questionsService.create(createQuestionDto);
    }

    @Get('get-questions')
    @HttpCode(HttpStatus.OK)
    async getQuestions(): Promise<Question[]> {
        return this.questionsService.findAll();
    }

    @Get('get-question-by-id/:questionId')
    @HttpCode(HttpStatus.OK)
    async getQuestionById(@Param('questionId') questionId: string): Promise<Question> {
        return this.questionsService.findById(questionId);
    }

    @Get('get-questions-by-topic/:topicId')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByTopic(@Param('topicId') topicId: string): Promise<Question[]> {
        return this.questionsService.findByTopic(topicId);
    }

    @Get('get-questions-by-difficulty')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByDifficulty(@Query('difficulty') difficulty: DifficultyLevel): Promise<Question[]> {
        return this.questionsService.findByDifficulty(difficulty);
    }

    @Get('get-questions-by-topic-and-difficulty/:topicId')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByTopicAndDifficulty(
        @Param('topicId') topicId: string,
        @Query('difficulty') difficulty: DifficultyLevel
    ): Promise<Question[]> {
        return this.questionsService.findByTopicAndDifficulty(topicId, difficulty);
    }

    @Patch('update-question/:questionId')
    @HttpCode(HttpStatus.OK)
    async updateQuestion(@Param('questionId') questionId: string, @Body() updateQuestionDto: UpdateQuestionDto): Promise<Question> {
        return this.questionsService.update(questionId, updateQuestionDto);
    }

    @Delete('delete-question/:questionId')
    @HttpCode(HttpStatus.OK)
    async deleteQuestion(@Param('questionId') questionId: string): Promise<void> {
        return this.questionsService.remove(questionId);
    }
}
