import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from './schema/subjects.schema';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';
import { SubjectStats } from 'common/types';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    try {
      const existingSubject = await this.subjectModel.findOne({
        subjectName: createSubjectDto.subjectName,
      });

      if (existingSubject) {
        throw new ConflictException('Subject with this name already exists');
      }

      const newSubject = new this.subjectModel(createSubjectDto);
      return await newSubject.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create subject: ${error.message}`);
    }
  }

  async findAll(): Promise<Subject[]> {
    return await this.subjectModel.find().exec();
  }

  async findById(id: string): Promise<Subject> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async findByName(subjectName: string): Promise<Subject | null> {
    return await this.subjectModel.findOne({ subjectName }).exec();
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<Subject> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    // Check if new name conflicts with existing subjects
    if (updateSubjectDto.subjectName) {
      const existingSubject = await this.subjectModel.findOne({
        subjectName: updateSubjectDto.subjectName,
        _id: { $ne: id },
      });

      if (existingSubject) {
        throw new ConflictException('Subject with this name already exists');
      }
    }

    const updatedSubject = await this.subjectModel
      .findByIdAndUpdate(id, updateSubjectDto, { new: true })
      .exec();

    if (!updatedSubject) {
      throw new NotFoundException('Subject not found');
    }
    return updatedSubject;
  }

  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    const result = await this.subjectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Subject not found');
    }

    return true;
  }
  
  async getSubjectStats(id: string): Promise<{ subjectStats: SubjectStats; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    // This would aggregate data from related collections
    // Implementation depends on your specific requirements
    const subjectStats = await this.subjectModel.aggregate([
      {
        $match : { _id: new Types.ObjectId(id) },
      },
      {
          $lookup: {
            from: 'topics',
            localField: '_id',
            foreignField: 'subjectId',
            as: 'topics'
          }
      },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: 'subjectId',
          as: 'questions'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'subjectId',
          as: 'quizzes'
        }
      },
      {
        $project: {
          subjectName: 1,
          description: 1,
          topicsCount: { $size: '$topics' },
          questionsCount: { $size: '$questions' },
          quizzesCount: { $size: '$quizzes' },
        },
      },
    ]);

    return {
      subjectStats: subjectStats.length > 0 ? subjectStats[0] : null,
      message: subjectStats.length > 0 ? 'Subject stats retrieved successfully' : 'No stats found for this subject',
    };
  }

  async searchSubjects(query: string): Promise<Subject[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return await this.subjectModel.find({
      $or: [
        { subjectName: { $regex: query, $options: 'i' } },
        { subjectDescription: { $regex: query, $options: 'i' } }
      ]
    }).exec();
  }
}
