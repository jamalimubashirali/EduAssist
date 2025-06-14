import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from './schema/questions.schema';
// import { CreateQuestionDto } from './dto/create-question.dto';
// import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>
  ) {}

//   async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
//     try {
//       // Validate that correctAnswer is one of the answerOptions
//       if (!createQuestionDto.answerOptions.includes(createQuestionDto.correctAnswer)) {
//         throw new BadRequestException('Correct answer must be one of the answer options');
//       }

//       const newQuestion = new this.questionModel(createQuestionDto);
//       return await newQuestion.save();
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new Error(`Failed to create question: ${error.message}`);
//     }
//   }

  async findAll(): Promise<Question[]> {
    return await this.questionModel
      .find()
      .populate('topicId', 'topicName topicDescription')
      .populate('subjectId', 'subjectName')
      .exec();
  }

  async findById(id: string): Promise<Question> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    const question = await this.questionModel
      .findById(id)
      .populate('topicId', 'topicName topicDescription')
      .populate('subjectId', 'subjectName')
      .exec();
      
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async findByTopic(topicId: string): Promise<Question[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    return await this.questionModel
      .find({ topicId })
      .populate('topicId', 'topicName topicDescription')
      .populate('subjectId', 'subjectName')
      .exec();
  }

  async findByDifficulty(difficulty: string): Promise<Question[]> {
    return await this.questionModel
      .find({ questionDifficulty: difficulty })
      .populate('topicId', 'topicName topicDescription')
      .populate('subjectId', 'subjectName')
      .exec();
  }

  async findByTopicAndDifficulty(topicId: string, difficulty: string): Promise<Question[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    return await this.questionModel
      .find({ topicId, questionDifficulty: difficulty })
      .populate('topicId', 'topicName topicDescription')
      .populate('subjectId', 'subjectName')
      .exec();
  }

  async getRandomQuestions(topicId: string, count: number, difficulty?: string): Promise<Question[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    const filter: any = { topicId };
    if (difficulty) {
      filter.questionDifficulty = difficulty;
    }

    return await this.questionModel
      .aggregate([
        { $match: filter },
        { $sample: { size: count } },
        {
          $lookup: {
            from: 'topics',
            localField: 'topicId',
            foreignField: '_id',
            as: 'topicId'
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subjectId'
          }
        }
      ])
      .exec();
  }

//   async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new NotFoundException('Invalid question ID format');
//     }

//     // Validate correctAnswer if provided
//     if (updateQuestionDto.correctAnswer && updateQuestionDto.answerOptions) {
//       if (!updateQuestionDto.answerOptions.includes(updateQuestionDto.correctAnswer)) {
//         throw new BadRequestException('Correct answer must be one of the answer options');
//       }
//     }

//     const updatedQuestion = await this.questionModel
//       .findByIdAndUpdate(id, updateQuestionDto, { new: true })
//       .populate('topicId', 'topicName topicDescription')
//       .populate('subjectId', 'subjectName')
//       .exec();

//     if (!updatedQuestion) {
//       throw new NotFoundException('Question not found');
//     }
//     return updatedQuestion;
//   }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid question ID format');
    }

    const result = await this.questionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Question not found');
    }
  }
}
