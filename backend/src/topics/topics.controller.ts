import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Topic } from './schema/topics.schema';
import { CreateTopicDto } from './dto/createtopic.dto';
import { UpdateTopicDto } from './dto/updatetopic.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post("create-topic")
  @HttpCode(HttpStatus.CREATED)
  async createTopic(@Body() createTopicDto: CreateTopicDto) : Promise<Topic> {
    return this.topicsService.create(createTopicDto);
  }

  @Get('get-topics')
  @HttpCode(HttpStatus.OK)
  async getTopics(): Promise<Topic[]> {
    return this.topicsService.findAll();
  }

  @Get('get-topic-by-id/:id')
  @HttpCode(HttpStatus.OK)
  async getTopicById(@Param('id') id: string): Promise<Topic> {
    return this.topicsService.findById(id);
  }

  @Get('get-topics-by-subject/:subjectId')
  @HttpCode(HttpStatus.OK)
  async getTopicsBySubject(@Param('subjectId') subjectId: string): Promise<Topic[]> {
    return this.topicsService.findBySubject(subjectId);
  }

  @Patch('update-topic/:id')
  @HttpCode(HttpStatus.OK)
  async updateTopic(@Param('id') id: string ,@Body() updateTopicDto: UpdateTopicDto): Promise<Topic> {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Get('search-topics') 
  @HttpCode(HttpStatus.OK)
  async searchTopics(@Query('search-query') query: string): Promise<Topic[]> {
    return this.topicsService.searchTopics(query);
  }
}
