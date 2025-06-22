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
    async createQuestion(@Body() createQuestionDto: CreateQuestionDto): Promise<Question | null> {
        return this.questionsService.create(createQuestionDto);
    }

    @Get('all')
    @HttpCode(HttpStatus.OK)
    async getQuestions(): Promise<Question[]> {
        return this.questionsService.findAll();
    }

    @Get('search')
    @HttpCode(HttpStatus.OK)
    async searchQuestions(@Query('q') query: string): Promise<Question[]> {
        return this.questionsService.searchQuestions(query);
    }

    @Get('topic/:topicId')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByTopic(@Param('topicId') topicId: string): Promise<Question[]> {
        return this.questionsService.findByTopic(topicId);
    }

    @Get('subject/:subjectId')
    @HttpCode(HttpStatus.OK)
    async getQuestionsBySubject(@Param('subjectId') subjectId: string): Promise<Question[]> {
        return this.questionsService.findBySubject(subjectId);
    }

    @Get('difficulty')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByDifficulty(@Query('level') difficulty: DifficultyLevel): Promise<Question[]> {
        return this.questionsService.findByDifficulty(difficulty);
    }

    @Get('topic/:topicId/difficulty/:difficulty')
    @HttpCode(HttpStatus.OK)
    async getQuestionsByTopicAndDifficulty(
        @Param('topicId') topicId: string,
        @Param('difficulty') difficulty: DifficultyLevel
    ): Promise<Question[]> {
        return this.questionsService.findByTopicAndDifficulty(topicId, difficulty);
    }

    @Get('stats/:id')
    @HttpCode(HttpStatus.OK)
    async getQuestionStats(@Param('id') id: string) {
        return this.questionsService.getQuestionStats(id);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getQuestionById(@Param('id') questionId: string): Promise<Question> {
        return this.questionsService.findById(questionId);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateQuestion(@Param('id') questionId: string, @Body() updateQuestionDto: UpdateQuestionDto): Promise<Question> {
        return this.questionsService.update(questionId, updateQuestionDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestion(@Param('id') questionId: string): Promise<void> {
        await this.questionsService.remove(questionId);
    }
}
