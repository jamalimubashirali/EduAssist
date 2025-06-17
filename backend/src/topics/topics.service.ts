import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic } from './schema/topics.schema';
import { CreateTopicDto } from './dto/createtopic.dto';
import { UpdateTopicDto } from './dto/updatetopic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<Topic>
  ) { }

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    try {
      const existingTopic = await this.topicModel.findOne({
        topicName: createTopicDto.topicName,
        subjectId: createTopicDto.subjectId
      });
      if (existingTopic) {
        throw new Error('Topic with this name already exists for the given subject');
      }
      const newTopic = new this.topicModel(createTopicDto);
      return await newTopic.save();
    } catch (error) {
      throw new Error(`Failed to create topic: ${error.message}`);
    }
  }

  async findAll(): Promise<Topic[]> {
    return await this.topicModel
      .find()
      .populate('subjectId', 'subjectName subjectDescription')
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
      throw new NotFoundException('Invalid subject ID format');
    }

    return await this.topicModel
      .find({ subjectId })
      .populate('subjectId', 'subjectName subjectDescription')
      .exec();
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid topic ID format');
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

  async searchTopics(query: string): Promise<Topic[]> {
    return await this.topicModel
      .find({
        $or: [
          { topicName: { $regex: query, $options: 'i' } },
          { topicDescription: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('subjectId', 'subjectName subjectDescription')
      .exec();
  }
}
