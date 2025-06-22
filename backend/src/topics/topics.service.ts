import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic } from './schema/topics.schema';
import { CreateTopicDto } from './dto/createtopic.dto';
import { UpdateTopicDto } from './dto/updatetopic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic | null> {
    try {
      // Validate subject ID
      if (!Types.ObjectId.isValid(createTopicDto.subjectId)) {
        throw new BadRequestException('Invalid subject ID format');
      }

      // Check for duplicate topic name within the same subject
      const existingTopic = await this.topicModel.findOne({
        topicName: createTopicDto.topicName,
        subjectId: new Types.ObjectId(createTopicDto.subjectId)
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this name already exists in this subject');
      }

      const topicData = {
        ...createTopicDto,
        subjectId: new Types.ObjectId(createTopicDto.subjectId),
      };

      const newTopic = new this.topicModel(topicData);
      const savedTopic = await newTopic.save();

      return await this.topicModel
        .findById(savedTopic._id)
        .populate('subjectId', 'subjectName subjectDescription')
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create topic: ${error.message}`);
    }
  }

  async findAll(): Promise<Topic[]> {
    return await this.topicModel
      .find()
      .populate('subjectId', 'subjectName')
      .sort({ subjectId: 1, topicName: 1 })
      .exec();
  }

  async findById(id: string): Promise<Topic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    const topic = await this.topicModel
      .findById(id)
      .populate('subjectId', 'subjectName subjectDescription')
      .exec();

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return topic;
  }

  async findBySubject(subjectId: string): Promise<Topic[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID format');
    }

    return await this.topicModel
      .find({ subjectId: new Types.ObjectId(subjectId) })
      .populate('subjectId', 'subjectName')
      .sort({ topicName: 1 })
      .exec();
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    // Validate subject ID if provided
    if (updateTopicDto.subjectId && !Types.ObjectId.isValid(updateTopicDto.subjectId)) {
      throw new BadRequestException('Invalid subject ID format');
    }

    // Check for duplicate name if updating topic name
    if (updateTopicDto.topicName) {
      const existingTopic = await this.topicModel.findOne({
        _id: { $ne: id },
        topicName: updateTopicDto.topicName,
        subjectId: updateTopicDto.subjectId 
          ? new Types.ObjectId(updateTopicDto.subjectId)
          : { $exists: true }
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this name already exists');
      }
    }

    const updatedTopic = await this.topicModel
      .findByIdAndUpdate(id, updateTopicDto, { new: true })
      .populate('subjectId', 'subjectName subjectDescription')
      .exec();

    if (!updatedTopic) {
      throw new NotFoundException('Topic not found');
    }

    return updatedTopic;
  }

  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    const result = await this.topicModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Topic not found');
    }

    return true;
  }

  async searchTopics(searchTerm: string): Promise<Topic[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const searchRegex = new RegExp(searchTerm.trim(), 'i');

    return await this.topicModel
      .find({
        $or: [
          { topicName: { $regex: searchRegex } },
          { topicDescription: { $regex: searchRegex } }
        ]
      })
      .populate('subjectId', 'subjectName')
      .limit(20)
      .sort({ topicName: 1 })
      .exec();
  }

  async getTopicStats(id: string): Promise<{
    topic: Topic;
    stats: {
      totalQuestions: number;
      totalQuizzes: number;
      averageDifficulty: string;
      popularityScore: number;
    };
  }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    const topic = await this.findById(id);

    // These would be actual aggregations in a real implementation
    const stats = {
      totalQuestions: 0,
      totalQuizzes: 0,
      averageDifficulty: 'Medium',
      popularityScore: 0
    };

    return { topic, stats };
  }
}
