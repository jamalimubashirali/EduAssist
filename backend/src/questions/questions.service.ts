import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from './schema/questions.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { DifficultyLevel } from 'common/enums';
import { GenerateAssessmentDto } from './dto/generate-assessment.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question | null> {
    try {
      // Validate ObjectId formats
      if (!Types.ObjectId.isValid(createQuestionDto.topicId)) {
        throw new BadRequestException('Invalid topic ID format');
      }
      if (!Types.ObjectId.isValid(createQuestionDto.subjectId)) {
        throw new BadRequestException('Invalid subject ID format');
      }

      // Validate that correct answer is in answer options
      if (
        !createQuestionDto.answerOptions.includes(
          createQuestionDto.correctAnswer,
        )
      ) {
        throw new BadRequestException(
          'Correct answer must be one of the answer options',
        );
      }

      const questionData = {
        ...createQuestionDto,
        topicId: new Types.ObjectId(createQuestionDto.topicId),
        subjectId: new Types.ObjectId(createQuestionDto.subjectId),
      };

      const newQuestion = new this.questionModel(questionData);
      const savedQuestion = await newQuestion.save();

      return await this.questionModel
        .findById(savedQuestion._id)
        .populate('topicId', 'topicName')
        .populate('subjectId', 'subjectName')
        .exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create question: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Question[]> {
    return await this.questionModel
      .find({ isActive: true })
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<Question> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    const question = await this.questionModel
      .findById(id)
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .exec();

    if (!question || !question.isActive) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async findByTopic(topicId: string): Promise<Question[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid topic ID format');
    }

    // Use aggregation pipeline for better performance
    return await this.questionModel
      .aggregate([
        {
          $match: {
            topicId: new Types.ObjectId(topicId),
            isActive: true,
          },
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subjectData',
            pipeline: [{ $project: { subjectName: 1 } }],
          },
        },
        {
          $addFields: {
            subjectId: {
              _id: '$subjectId',
              subjectName: { $arrayElemAt: ['$subjectData.subjectName', 0] },
            },
          },
        },
        { $unset: ['subjectData'] },
        { $sort: { questionDifficulty: 1, createdAt: -1 } },
      ])
      .exec();
  }

  async findBySubject(subjectId: string): Promise<Question[]> {
    if (!Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('Invalid subject ID format');
    }

    // Use aggregation pipeline for better performance
    return await this.questionModel
      .aggregate([
        {
          $match: {
            subjectId: new Types.ObjectId(subjectId),
            isActive: true,
          },
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topicData',
            pipeline: [{ $project: { topicName: 1 } }],
          },
        },
        {
          $addFields: {
            topicId: {
              _id: '$topicId',
              topicName: { $arrayElemAt: ['$topicData.topicName', 0] },
            },
          },
        },
        { $unset: ['topicData'] },
        { $sort: { 'topicId._id': 1, questionDifficulty: 1 } },
      ])
      .exec();
  }

  async findByDifficulty(difficulty: DifficultyLevel): Promise<Question[]> {
    return await this.questionModel
      .find({
        questionDifficulty: difficulty,
        isActive: true,
      })
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByTopicAndDifficulty(
    topicId: string,
    difficulty: DifficultyLevel,
  ): Promise<Question[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new BadRequestException('Invalid topic ID format');
    }

    // Use aggregation pipeline for better performance with random sampling
    return await this.questionModel
      .aggregate([
        {
          $match: {
            topicId: new Types.ObjectId(topicId),
            questionDifficulty: difficulty,
            isActive: true,
          },
        },
        { $sample: { size: 100 } }, // Add randomization
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subjectData',
            pipeline: [{ $project: { subjectName: 1 } }],
          },
        },
        {
          $addFields: {
            subjectId: {
              _id: '$subjectId',
              subjectName: { $arrayElemAt: ['$subjectData.subjectName', 0] },
            },
          },
        },
        { $unset: ['subjectData'] },
        { $sort: { createdAt: -1 } },
      ])
      .exec();
  }

  async generateAssessment(
    generateAssessmentDto: GenerateAssessmentDto,
  ): Promise<Question[]> {
    const { subjectIds, count = 10 } = generateAssessmentDto;

    if (!subjectIds || subjectIds.length === 0) {
      throw new BadRequestException(
        'At least one subject ID must be provided.',
      );
    }

    const validSubjectIds = subjectIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (validSubjectIds.length === 0) {
      throw new BadRequestException('No valid subject IDs provided.');
    }

    try {
      console.log(
        `[generateAssessment] Starting assessment generation for ${validSubjectIds.length} subjects, requesting ${count} questions`,
      );
      const startTime = Date.now();

      // Optimized single aggregation pipeline with better random selection and timeout handling
      const questions = (await Promise.race([
        this.questionModel
          .aggregate([
            { $match: { subjectId: { $in: validSubjectIds }, isActive: true } },
            // Add random field for shuffling
            {
              $addFields: {
                randomField: { $rand: {} },
              },
            },
            // Sort by random field for shuffling
            { $sort: { randomField: 1 } },
            // Group by subject to ensure balanced distribution
            {
              $group: {
                _id: '$subjectId',
                questions: { $push: '$$ROOT' },
                count: { $sum: 1 },
              },
            },
            // Sample questions from each subject proportionally
            {
              $project: {
                _id: 1,
                questions: {
                  $slice: [
                    '$questions',
                    { $ceil: { $divide: [count, validSubjectIds.length] } },
                  ],
                },
              },
            },
            { $unwind: '$questions' },
            { $replaceRoot: { newRoot: '$questions' } },
            // Remove the random field
            { $unset: ['randomField'] },
            // Populate topic and subject data in single pipeline
            {
              $lookup: {
                from: 'topics',
                localField: 'topicId',
                foreignField: '_id',
                as: 'topicData',
                pipeline: [{ $project: { topicName: 1 } }],
              },
            },
            {
              $lookup: {
                from: 'subjects',
                localField: 'subjectId',
                foreignField: '_id',
                as: 'subjectData',
                pipeline: [{ $project: { subjectName: 1 } }],
              },
            },
            // Transform to expected format
            {
              $addFields: {
                topicId: {
                  _id: '$topicId',
                  topicName: { $arrayElemAt: ['$topicData.topicName', 0] },
                },
                subjectId: {
                  _id: '$subjectId',
                  subjectName: {
                    $arrayElemAt: ['$subjectData.subjectName', 0],
                  },
                },
              },
            },
            { $unset: ['topicData', 'subjectData'] },
            // Final random selection of exact count needed
            { $sample: { size: Math.min(count, 50) } },
          ])
          .exec(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Assessment generation timeout')),
            20000,
          ),
        ),
      ])) as Question[];

      if (questions.length === 0) {
        // Optimized fallback with timeout handling
        const fallbackQuestions = (await Promise.race([
          this.questionModel
            .aggregate([
              { $match: { isActive: true } },
              { $sample: { size: Math.min(count * 2, 100) } },
              {
                $lookup: {
                  from: 'topics',
                  localField: 'topicId',
                  foreignField: '_id',
                  as: 'topicData',
                  pipeline: [{ $project: { topicName: 1 } }],
                },
              },
              {
                $lookup: {
                  from: 'subjects',
                  localField: 'subjectId',
                  foreignField: '_id',
                  as: 'subjectData',
                  pipeline: [{ $project: { subjectName: 1 } }],
                },
              },
              {
                $addFields: {
                  topicId: {
                    _id: '$topicId',
                    topicName: { $arrayElemAt: ['$topicData.topicName', 0] },
                  },
                  subjectId: {
                    _id: '$subjectId',
                    subjectName: {
                      $arrayElemAt: ['$subjectData.subjectName', 0],
                    },
                  },
                },
              },
              { $unset: ['topicData', 'subjectData'] },
              { $sample: { size: Math.min(count, 50) } },
            ])
            .exec(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Fallback assessment generation timeout')),
              15000,
            ),
          ),
        ])) as Question[];
        console.log(
          `[generateAssessment] Fallback completed in ${Date.now() - startTime}ms, returning ${fallbackQuestions.length} questions`,
        );
        return fallbackQuestions;
      }

      console.log(
        `[generateAssessment] Completed in ${Date.now() - startTime}ms, returning ${questions.length} questions`,
      );
      return questions;
    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new BadRequestException(
          'Assessment generation is taking too long. Please try again.',
        );
      }

      console.error('Aggregation failed, trying simple fallback:', error);

      // Simple fallback query
      try {
        const fallbackQuestions = await this.questionModel
          .find({
            subjectId: { $in: validSubjectIds },
            isActive: true,
          })
          .populate('topicId', 'topicName')
          .populate('subjectId', 'subjectName')
          .limit(count * 2)
          .exec();

        // Shuffle and limit the results
        const shuffled = fallbackQuestions.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, count);

        console.log(
          `[generateAssessment] Fallback completed, returning ${result.length} questions`,
        );
        return result;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new BadRequestException(
          `Failed to generate assessment: ${error.message}`,
        );
      }
    }
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    // Validate ObjectIds if provided
    if (
      updateQuestionDto.topicId &&
      !Types.ObjectId.isValid(updateQuestionDto.topicId)
    ) {
      throw new BadRequestException('Invalid topic ID format');
    }
    if (
      updateQuestionDto.subjectId &&
      !Types.ObjectId.isValid(updateQuestionDto.subjectId)
    ) {
      throw new BadRequestException('Invalid subject ID format');
    }

    // Validate correct answer if provided
    if (updateQuestionDto.answerOptions && updateQuestionDto.correctAnswer) {
      if (
        !updateQuestionDto.answerOptions.includes(
          updateQuestionDto.correctAnswer,
        )
      ) {
        throw new BadRequestException(
          'Correct answer must be one of the answer options',
        );
      }
    }

    const updatedQuestion = await this.questionModel
      .findByIdAndUpdate(id, updateQuestionDto, { new: true })
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .exec();

    if (!updatedQuestion) {
      throw new NotFoundException('Question not found');
    }

    return updatedQuestion;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    // Soft delete by setting isActive to false
    const result = await this.questionModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!result) {
      throw new NotFoundException('Question not found');
    }
  }

  async searchQuestions(searchTerm: string): Promise<Question[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const searchRegex = new RegExp(searchTerm.trim(), 'i');

    return await this.questionModel
      .find({
        $and: [
          { isActive: true },
          {
            $or: [
              { questionText: { $regex: searchRegex } },
              { tags: { $in: [searchRegex] } },
              { explanation: { $regex: searchRegex } },
            ],
          },
        ],
      })
      .populate('topicId', 'topicName')
      .populate('subjectId', 'subjectName')
      .limit(20)
      .sort({ timesAsked: -1, createdAt: -1 })
      .exec();
  }

  async getQuestionStats(id: string): Promise<{
    question: Question;
    stats: {
      totalAttempts: number;
      correctAttempts: number;
      accuracy: number;
      averageTime: number;
      difficultyRating: number;
    };
  }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    const question = await this.findById(id);

    const stats = {
      totalAttempts: question.timesAsked || 0,
      correctAttempts: question.timesAnsweredCorrectly || 0,
      accuracy:
        question.timesAsked > 0
          ? Math.round(
              (question.timesAnsweredCorrectly / question.timesAsked) * 100,
            )
          : 0,
      averageTime: question.averageTimeToAnswer || 0,
      difficultyRating: question.difficultyRating || 50,
    };

    return { question, stats };
  }

  async updateQuestionStats(
    questionId: string,
    isCorrect: boolean,
    timeSpent: number,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(questionId)) {
      return;
    }

    const question = await this.questionModel.findById(questionId);
    if (!question) return;

    const updateData: any = {
      $inc: {
        timesAsked: 1,
        ...(isCorrect ? { timesAnsweredCorrectly: 1 } : {}),
      },
    };

    // Update average time
    const currentAverage = question.averageTimeToAnswer || 0;
    const currentCount = question.timesAsked || 0;
    const newAverage =
      (currentAverage * currentCount + timeSpent) / (currentCount + 1);

    updateData.averageTimeToAnswer = Math.round(newAverage);

    await this.questionModel.findByIdAndUpdate(questionId, updateData);
  }

  /**
   * Get questions with subject and topic data using aggregation pipeline
   */
  async getQuestionsWithSubjectTopicData(
    questionIds: Types.ObjectId[],
  ): Promise<any[]> {
    return await this.questionModel
      .aggregate([
        { $match: { _id: { $in: questionIds }, isActive: true } },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subjectData',
          },
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topicData',
          },
        },
        {
          $project: {
            _id: 1,
            questionText: 1,
            answerOptions: 1,
            correctAnswer: 1,
            explanation: 1,
            questionDifficulty: 1,
            tags: 1,
            timesAsked: 1,
            timesAnsweredCorrectly: 1,
            averageTimeToAnswer: 1,
            subjectId: {
              _id: '$subjectId',
              subjectName: { $arrayElemAt: ['$subjectData.subjectName', 0] },
            },
            topicId: {
              _id: '$topicId',
              topicName: { $arrayElemAt: ['$topicData.topicName', 0] },
            },
          },
        },
      ])
      .exec();
  }
}
