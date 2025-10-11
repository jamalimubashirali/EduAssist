import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { DifficultyLevel } from 'common/enums';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(DifficultyLevel), required: true })
  questionDifficulty: DifficultyLevel;

  @Prop({ required: true })
  questionText: string;

  @Prop({ type: [String], required: true })
  answerOptions: string[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  explanation?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // Analytics fields
  @Prop({ type: Number, default: 0 })
  timesAsked: number;

  @Prop({ type: Number, default: 0 })
  timesAnsweredCorrectly: number;

  @Prop({ type: Number, default: 0 })
  averageTimeToAnswer: number; // in seconds

  @Prop({ type: Number, default: 50 }) // percentage
  difficultyRating: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  // Learning objectives
  @Prop({ type: [String], default: [] })
  learningObjectives: string[];

  @Prop({ type: [String], default: [] })
  prerequisites: string[];

  // Content metadata
  @Prop({ type: Object })
  metadata?: {
    bloomsTaxonomyLevel: string;
    cognitiveLevel: string;
    estimatedDifficulty: number;
    topicRelevance: number;
  };
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Indexes for efficient queries
QuestionSchema.index({ topicId: 1, questionDifficulty: 1, isActive: 1 });
QuestionSchema.index({ subjectId: 1, questionDifficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ difficultyRating: 1 });
QuestionSchema.index({ createdAt: -1 });
