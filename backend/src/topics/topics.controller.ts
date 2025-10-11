import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Topic } from './schema/topics.schema';
import { CreateTopicDto } from './dto/createtopic.dto';
import { UpdateTopicDto } from './dto/updatetopic.dto';
import { SearchTopicsDto } from './dto/search.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post('create-topic')
  @HttpCode(HttpStatus.CREATED)
  async createTopic(
    @Body() createTopicDto: CreateTopicDto,
  ): Promise<Topic | null> {
    return this.topicsService.create(createTopicDto);
  }

  @Get('get-topics')
  @HttpCode(HttpStatus.OK)
  async getTopics(): Promise<Topic[]> {
    return this.topicsService.findAll();
  }

  @Get('get-topic-by-id/:topicId')
  @HttpCode(HttpStatus.OK)
  async getTopicById(@Param('topicId') topicId: string): Promise<Topic> {
    return this.topicsService.findById(topicId);
  }

  @Get('get-topics-by-subject/:subjectId')
  @HttpCode(HttpStatus.OK)
  async getTopicsBySubject(
    @Param('subjectId') subjectId: string,
  ): Promise<Topic[]> {
    return this.topicsService.findBySubject(subjectId);
  }

  @Patch('update-topic/:topicId')
  @HttpCode(HttpStatus.OK)
  async updateTopic(
    @Param('topicId') topicId: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ): Promise<Topic> {
    return this.topicsService.update(topicId, updateTopicDto);
  }

  @Delete('remove-topic/:topicId')
  @HttpCode(HttpStatus.OK)
  async removeTopic(
    @Param('topicId') topicId: string,
  ): Promise<{ deleted: boolean; message?: string }> {
    const deleted: boolean = await this.topicsService.remove(topicId);
    return {
      deleted,
      message: deleted ? 'Topic deleted successfully' : 'Topic not found',
    };
  }
  @Get('search-topic')
  @HttpCode(HttpStatus.OK)
  async searchTopics(@Query() searchDto: SearchTopicsDto): Promise<Topic[]> {
    try {
      if (!searchDto.q || searchDto.q.trim().length === 0) {
        return [];
      }
      return this.topicsService.searchTopics(searchDto.q.trim());
    } catch (error) {
      throw new BadRequestException('Invalid search query');
    }
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchTopicsAlternative(
    @Query() searchDto: SearchTopicsDto,
  ): Promise<Topic[]> {
    try {
      if (!searchDto.q || searchDto.q.trim().length === 0) {
        return [];
      }
      return this.topicsService.searchTopics(searchDto.q.trim());
    } catch (error) {
      throw new BadRequestException('Invalid search query');
    }
  }
}
