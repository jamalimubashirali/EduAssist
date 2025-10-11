import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ timestamps: true })
export class Attempt {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Quiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject' })
  subjectId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({ type: Number, default: 0 })
  timeTaken: number; // in seconds

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({
    type: [
      {
        questionId: {
          type: SchemaTypes.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        timeSpent: { type: Number, default: 0 }, // seconds for this question
        answeredAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  answersRecorded: {
    questionId: Types.ObjectId;
    selectedAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    answeredAt: Date;
  }[];

  // Enhanced analytics
  @Prop({ type: Number, default: 0 })
  correctAnswers: number;

  @Prop({ type: Number, default: 0 })
  totalQuestions: number;

  @Prop({ type: Number, default: 0 })
  percentageScore: number;

  @Prop({ type: String })
  sessionId?: string;

  @Prop({ type: Boolean, default: false })
  isPersonalizedQuiz: boolean;

  // Performance metrics
  @Prop({ type: Object })
  performanceMetrics?: {
    averageTimePerQuestion: number;
    difficultyBreakdown: Record<string, { correct: number; total: number }>;
    streakCount: number;
    fastestQuestion: number; // seconds
    slowestQuestion: number; // seconds
  };

  @Prop({ type: String })
  deviceInfo?: string;

  @Prop({ type: String })
  ipAddress?: string;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);

// Indexes for performance
AttemptSchema.index({ userId: 1, createdAt: -1 });
AttemptSchema.index({ quizId: 1, userId: 1 });
AttemptSchema.index({ topicId: 1, userId: 1 });
AttemptSchema.index({ sessionId: 1 });
AttemptSchema.index({ isCompleted: 1, createdAt: -1 });
