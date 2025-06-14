import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recommendation } from './schema/recommendations.schema';
// import { CreateRecommendationDto } from './dto/create-recommendation.dto';
// import { UpdateRecommendationDto } from './dto/update-recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name) private recommendationModel: Model<Recommendation>
  ) {}

//   async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
//     try {
//       const newRecommendation = new this.recommendationModel(createRecommendationDto);
//       return await newRecommendation.save();
//     } catch (error) {
//       throw new Error(`Failed to create recommendation: ${error.message}`);
//     }
//   }

  async findAll(): Promise<Recommendation[]> {
    return await this.recommendationModel
      .find()
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Recommendation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const recommendation = await this.recommendationModel
      .findById(id)
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();
      
    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    return recommendation;
  }

  async findByUser(userId: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    return await this.recommendationModel
      .find({ userId })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserAndStatus(userId: string, status: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    return await this.recommendationModel
      .find({ userId, recommendationStatus: status })
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPendingRecommendations(userId: string): Promise<Recommendation[]> {
    return await this.findByUserAndStatus(userId, 'Pending');
  }

  async findBySubject(subjectId: string): Promise<Recommendation[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new NotFoundException('Invalid subject ID format');
    }

    return await this.recommendationModel
      .find({ subjectId })
      .populate('userId', 'name email')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .sort({ createdAt: -1 })
      .exec();
  }

  async generateRecommendationFromAttempt(
    userId: string,
    attemptId: string,
    subjectId: string,
    topicId: string,
    attemptScore: number,
    averageScore: number
  ): Promise<Recommendation> {
    let recommendationReason = '';
    let suggestedDifficulty = 'Medium';

    // Generate recommendation based on performance
    if (attemptScore < 40) {
      recommendationReason = 'Based on your recent quiz performance, we recommend reviewing the fundamental concepts and practicing with easier questions.';
      suggestedDifficulty = 'Easy';
    } else if (attemptScore < 70) {
      recommendationReason = 'Your performance shows room for improvement. Focus on practicing more questions at the current difficulty level.';
      suggestedDifficulty = 'Medium';
    } else if (attemptScore >= 85) {
      recommendationReason = 'Excellent performance! You\'re ready to challenge yourself with more difficult questions in this topic.';
      suggestedDifficulty = 'Hard';
    } else {
      recommendationReason = 'Good performance! Continue practicing to strengthen your understanding before moving to harder topics.';
      suggestedDifficulty = 'Medium';
    }

    // Adjust based on trend with average
    if (attemptScore > averageScore + 10) {
      recommendationReason += ' Your performance is improving - keep up the good work!';
    } else if (attemptScore < averageScore - 10) {
      recommendationReason += ' Consider reviewing previous materials before attempting new quizzes.';
    }

    const newRecommendation = new this.recommendationModel({
      userId,
      subjectId,
      topicId,
      attemptId,
      recommendationReason,
      suggestedDifficulty,
      recommendationStatus: 'Pending'
    });

    return await newRecommendation.save();
  }

  async updateStatus(id: string, status: string): Promise<Recommendation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Completed'];
    if (!validStatuses.includes(status)) {
      throw new NotFoundException('Invalid status provided');
    }

    const updatedRecommendation = await this.recommendationModel
      .findByIdAndUpdate(
        id, 
        { recommendationStatus: status }, 
        { new: true }
      )
      .populate('userId', 'name email')
      .populate('subjectId', 'subjectName')
      .populate('topicId', 'topicName')
      .populate('attemptId', 'score timeTaken')
      .exec();

    if (!updatedRecommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    return updatedRecommendation;
  }

  async getRecommendationStats(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const stats = await this.recommendationModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$recommendationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id.toLowerCase()] = stat.count;
      result.total += stat.count;
    });

    return result;
  }

//   async update(id: string, updateRecommendationDto: UpdateRecommendationDto): Promise<Recommendation> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new NotFoundException('Invalid recommendation ID format');
//     }

//     const updatedRecommendation = await this.recommendationModel
//       .findByIdAndUpdate(id, updateRecommendationDto, { new: true })
//       .populate('userId', 'name email')
//       .populate('subjectId', 'subjectName')
//       .populate('topicId', 'topicName')
//       .populate('attemptId', 'score timeTaken')
//       .exec();

//     if (!updatedRecommendation) {
//       throw new NotFoundException('Recommendation not found');
//     }
//     return updatedRecommendation;
//   }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid recommendation ID format');
    }

    const result = await this.recommendationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Recommendation not found');
    }
  }

  async removeByAttempt(attemptId: string): Promise<void> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new NotFoundException('Invalid attempt ID format');
    }

    await this.recommendationModel.deleteMany({ attemptId }).exec();
  }
}
