import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attempt } from './schema/attempts.schema';
// import { CreateAttemptDto } from './dto/create-attempt.dto';
// import { UpdateAttemptDto } from './dto/update-attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name) private attemptModel: Model<Attempt>
  ) {}

//   async create(createAttemptDto: CreateAttemptDto): Promise<Attempt> {
//     try {
//       const newAttempt = new this.attemptModel({
//         ...createAttemptDto,
//         deteOfAttempt: new Date() // Set current date
//       });
//       return await newAttempt.save();
//     } catch (error) {
//       throw new Error(`Failed to create attempt: ${error.message}`);
//     }
//   }

  async findAll(): Promise<Attempt[]> {
    return await this.attemptModel
      .find()
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .populate('quizId', 'title quizDifficulty')
      .populate('subjectId', 'subjectName')
      .sort({ deteOfAttempt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Attempt> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .populate('quizId', 'title quizDifficulty')
      .populate('subjectId', 'subjectName')
      .exec();
      
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    return attempt;
  }

  async findByUser(userId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    return await this.attemptModel
      .find({ userId })
      .populate('topicId', 'topicName')
      .populate('quizId', 'title quizDifficulty')
      .populate('subjectId', 'subjectName')
      .sort({ deteOfAttempt: -1 })
      .exec();
  }

  async findByQuiz(quizId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    return await this.attemptModel
      .find({ quizId })
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .sort({ deteOfAttempt: -1 })
      .exec();
  }

  async findByUserAndSubject(userId: string, subjectId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid user or subject ID format');
    }

    return await this.attemptModel
      .find({ userId, subjectId })
      .populate('topicId', 'topicName')
      .populate('quizId', 'title quizDifficulty')
      .sort({ deteOfAttempt: -1 })
      .exec();
  }

  async findByUserAndTopic(userId: string, topicId: string): Promise<Attempt[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid user or topic ID format');
    }

    return await this.attemptModel
      .find({ userId, topicId })
      .populate('quizId', 'title quizDifficulty')
      .populate('subjectId', 'subjectName')
      .sort({ deteOfAttempt: -1 })
      .exec();
  }

  async calculateScore(attemptId: string, answers: any[]): Promise<number> {
    // This would calculate the score based on correct answers
    // Implementation depends on your scoring logic
    const attempt = await this.findById(attemptId);
    // Calculate score logic here
    return 0; // Placeholder
  }

  async getUserAttemptStats(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const stats = await this.attemptModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageTime: { $avg: '$timeTaken' },
          totalTime: { $sum: '$timeTaken' }
        }
      }
    ]);

    return stats[0] || { totalAttempts: 0, averageTime: 0, totalTime: 0 };
  }

  async getSubjectAttemptStats(subjectId: string): Promise<any> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    const stats = await this.attemptModel.aggregate([
      { $match: { subjectId: new Types.ObjectId(subjectId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageTime: { $avg: '$timeTaken' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      }
    ]);

    return stats[0] || { totalAttempts: 0, averageTime: 0, uniqueUsersCount: 0 };
  }

//   async update(id: string, updateAttemptDto: UpdateAttemptDto): Promise<Attempt> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new NotFoundException('Invalid attempt ID format');
//     }

//     const updatedAttempt = await this.attemptModel
//       .findByIdAndUpdate(id, updateAttemptDto, { new: true })
//       .populate('userId', 'name email')
//       .populate('topicId', 'topicName')
//       .populate('quizId', 'title quizDifficulty')
//       .populate('subjectId', 'subjectName')
//       .exec();

//     if (!updatedAttempt) {
//       throw new NotFoundException('Attempt not found');
//     }
//     return updatedAttempt;
//   }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    const result = await this.attemptModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Attempt not found');
    }
  }
}
