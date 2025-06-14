import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schema/quizzes.schema';
// import { CreateQuizDto } from './dto/create-quiz.dto';
// import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>
  ) {}

//   async create(createQuizDto: CreateQuizDto): Promise<Quiz> {
//     try {
//       // Validate that all questionIds are valid ObjectIds
//       const invalidIds = createQuizDto.questionIds.filter(id => !Types.ObjectId.isValid(id));
//       if (invalidIds.length > 0) {
//         throw new BadRequestException('Invalid question IDs provided');
//       }

//       const newQuiz = new this.quizModel(createQuizDto);
//       return await newQuiz.save();
//     } catch (error) {
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new Error(`Failed to create quiz: ${error.message}`);
//     }
//   }

  async findAll(): Promise<Quiz[]> {
    return await this.quizModel
      .find()
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async findById(id: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
      
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  async findByTopic(topicId: string): Promise<Quiz[]> {
    if (!Types.ObjectId.isValid(topicId)) {
      throw new NotFoundException('Invalid topic ID format');
    }

    return await this.quizModel
      .find({ topicId })
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async findByDifficulty(difficulty: string): Promise<Quiz[]> {
    return await this.quizModel
      .find({ quizDifficulty: difficulty })
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
      .exec();
  }

  async getQuizForAttempt(id: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'topicName topicDescription')
      .populate('questionIds', 'questionText questionDifficulty answerOptions') // Exclude correctAnswer for attempt
      .exec();
      
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

//   async update(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new NotFoundException('Invalid quiz ID format');
//     }

//     // Validate questionIds if provided
//     if (updateQuizDto.questionIds) {
//       const invalidIds = updateQuizDto.questionIds.filter(id => !Types.ObjectId.isValid(id));
//       if (invalidIds.length > 0) {
//         throw new BadRequestException('Invalid question IDs provided');
//       }
//     }

//     const updatedQuiz = await this.quizModel
//       .findByIdAndUpdate(id, updateQuizDto, { new: true })
//       .populate('topicId', 'topicName topicDescription')
//       .populate('questionIds', 'questionText questionDifficulty answerOptions correctAnswer')
//       .exec();

//     if (!updatedQuiz) {
//       throw new NotFoundException('Quiz not found');
//     }
//     return updatedQuiz;
//   }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid quiz ID format');
    }

    const result = await this.quizModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Quiz not found');
    }
  }

  async addQuestionToQuiz(quizId: string, questionId: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid quiz or question ID format');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.questionIds.includes(new Types.ObjectId(questionId))) {
      throw new BadRequestException('Question already exists in this quiz');
    }

    quiz.questionIds.push(new Types.ObjectId(questionId));
    return await quiz.save();
  }

  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<Quiz> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException('Invalid quiz or question ID format');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    quiz.questionIds = quiz.questionIds.filter(id => !id.equals(new Types.ObjectId(questionId)));
    return await quiz.save();
  }
}
