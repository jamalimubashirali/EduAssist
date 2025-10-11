import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { DifficultyLevel, QuizType } from 'common/enums';

export type QuizDocument = HydratedDocument<Quiz>;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'Question', required: true })
  questionIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: Object.values(DifficultyLevel),
    default: DifficultyLevel.MEDIUM,
  })
  quizDifficulty: DifficultyLevel;

  @Prop({
    type: String,
    enum: Object.values(QuizType),
    default: QuizType.PRACTICE,
  })
  quizType: QuizType;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: 30 })
  timeLimit: number;

  // Personalization fields
  @Prop({ type: String })
  sessionId?: string;

  @Prop({ type: Boolean, default: false })
  isPersonalized: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Object })
  personalizationMetadata?: {
    userId: Types.ObjectId;
    difficultyDistribution: Record<string, number>;
    focusAreas: string[];
    generatedAt: Date;
    userLevel: number;
    masteryScore: number;
  };

  // Usage statistics
  @Prop({ type: Number, default: 0 })
  attemptCount: number;

  @Prop({ type: Number, default: 0 })
  averageScore: number;

  @Prop({ type: Number, default: 0 })
  averageCompletionTime: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: true })
  isPublished: boolean;

  @Prop({ type: Number, default: 100 })
  xpReward: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

// Indexes for performance
QuizSchema.index({ topicId: 1, isActive: 1 });
QuizSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
QuizSchema.index({ createdBy: 1, createdAt: -1 });
QuizSchema.index({ isPersonalized: 1, 'personalizationMetadata.userId': 1 });
