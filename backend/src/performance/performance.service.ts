import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserPerformance } from './schema/performance.schema';
// import { CreatePerformanceDto } from './dto/create-performance.dto';
// import { UpdatePerformanceDto } from './dto/update-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(UserPerformance.name) private performanceModel: Model<UserPerformance>
  ) {}

//   async create(createPerformanceDto: CreatePerformanceDto): Promise<UserPerformance> {
//     try {
//       const newPerformance = new this.performanceModel(createPerformanceDto);
//       return await newPerformance.save();
//     } catch (error) {
//       throw new Error(`Failed to create performance record: ${error.message}`);
//     }
//   }

  async findAll(): Promise<UserPerformance[]> {
    return await this.performanceModel
      .find()
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .exec();
  }

  async findById(id: string): Promise<UserPerformance> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid performance ID format');
    }

    const performance = await this.performanceModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .exec();
      
    if (!performance) {
      throw new NotFoundException('Performance record not found');
    }
    return performance;
  }

  async findByUser(userId: string): Promise<UserPerformance[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    return await this.performanceModel
      .find({ userId })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .exec();
  }

  async findByUserAndSubject(userId: string, subjectId: string): Promise<UserPerformance[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid user or subject ID format');
    }

    return await this.performanceModel
      .find({ userId, subjectId })
      .populate('topicId', 'topicName')
      .exec();
  }

  async findBySubject(subjectId: string): Promise<UserPerformance[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    return await this.performanceModel
      .find({ subjectId })
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .exec();
  }

  async getTopPerformers(subjectId?: string, limit: number = 10): Promise<UserPerformance[]> {
    const filter = subjectId ? { subjectId: new Types.ObjectId(subjectId) } : {};
    
    return await this.performanceModel
      .find(filter)
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .sort({ averageScore: -1, bestScore: -1 })
      .limit(limit)
      .exec();
  }

  async getUserOverallPerformance(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const performance = await this.performanceModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: '$totalAttempts' },
          averageAccuracy: { $avg: '$accurracy' }, // Note: typo in schema field name
          averageScore: { $avg: '$averageScore' },
          bestScore: { $max: '$bestScore' },
          worstScore: { $min: '$worstScore' },
          subjectsCount: { $sum: 1 }
        }
      }
    ]);

    return performance[0] || {
      totalAttempts: 0,
      averageAccuracy: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      subjectsCount: 0
    };
  }

  // async updatePerformanceFromAttempt(
  //   userId: string,
  //   subjectId: string,
  //   topicId: string,
  //   attemptData: any
  // ): Promise<UserPerformance> {
  //   if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(subjectId) || !Types.ObjectId.isValid(topicId)) {
  //     throw new NotFoundException('Invalid ID format');
  //   }

  //   let performance = await this.performanceModel.findOne({
  //     userId,
  //     subjectId,
  //     topicId
  //   });

  //   if (!performance) {
  //     // Create new performance record
  //     performance = new this.performanceModel({
  //       userId,
  //       subjectId,
  //       topicId,
  //       totalAttempts: 1,
  //       accurracy: attemptData.accuracy,
  //       averageScore: attemptData.score,
  //       bestScore: attemptData.score,
  //       worstScore: attemptData.score,
  //       progressTrend: 'Steady',
  //       lastQuizAttempted: new Date()
  //     });
  //   } else {
  //     // Update existing performance record
  //     const newTotalAttempts = performance.totalAttempts + 1;
  //     const newAverageScore = ((performance.averageScore * performance.totalAttempts) + attemptData.score) / newTotalAttempts;
  //     const newAverageAccuracy = ((performance.accurracy * performance.totalAttempts) + attemptData.accuracy) / newTotalAttempts;

  //     performance.totalAttempts = newTotalAttempts;
  //     performance.averageScore = Math.round(newAverageScore);
  //     performance.accurracy = parseFloat(newAverageAccuracy.toFixed(2));
  //     performance.bestScore = Math.max(performance.bestScore, attemptData.score);
  //     performance.worstScore = Math.min(performance.worstScore, attemptData.score);
  //     performance.lastQuizAttempted = new Date();

  //     // Determine progress trend (simplified logic)
  //     if (attemptData.score > performance.averageScore) {
  //       performance.progressTrend = 'Improving';
  //     } else if (attemptData.score < performance.averageScore) {
  //       performance.progressTrend = 'Declining';
  //     } else {
  //       performance.progressTrend = 'Steady';
  //     }
  //   }

  //   return await performance.save();
  // }

//   async update(id: string, updatePerformanceDto: UpdatePerformanceDto): Promise<UserPerformance> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new NotFoundException('Invalid performance ID format');
//     }

//     const updatedPerformance = await this.performanceModel
//       .findByIdAndUpdate(id, updatePerformanceDto, { new: true })
//       .populate('userId', 'name email')
//       .populate('subjectId', 'subjectName')
//       .populate('topicId', 'topicName')
//       .exec();

//     if (!updatedPerformance) {
//       throw new NotFoundException('Performance record not found');
//     }
//     return updatedPerformance;
//   }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid performance ID format');
    }

    const result = await this.performanceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Performance record not found');
    }
  }
}
