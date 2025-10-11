import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ProgressTrend } from 'common/enums';

export type UserPerformanceDocument = HydratedDocument<UserPerformance>;

@Schema({ timestamps: true })
export class UserPerformance {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  totalAttempts: number;

  @Prop({ type: Number, default: 0 })
  averageScore: number;

  @Prop({ type: Number, default: 0 })
  bestScore: number;

  @Prop({ type: Number, default: 0 })
  worstScore: number;

  @Prop({ type: Number, default: 0 })
  totalTimeSpent: number; // in seconds

  @Prop({ type: Number, default: 0 })
  averageTimePerQuestion: number; // in seconds

  @Prop({
    type: String,
    enum: Object.values(ProgressTrend),
    default: ProgressTrend.STEADY,
  })
  progressTrend: ProgressTrend;

  @Prop({ type: Date, default: null })
  lastQuizAttempted: Date | null;

  @Prop({ type: Number, default: 0 })
  streakCount: number;

  @Prop({ type: Number, default: 0 })
  masteryLevel: number; // 0-100

  @Prop({ type: [Number], default: [] })
  recentScores: number[]; // Last 10 scores

  // Difficulty-wise performance
  @Prop({ type: Object, default: {} })
  difficultyPerformance: {
    Easy?: { attempts: number; averageScore: number };
    Medium?: { attempts: number; averageScore: number };
    Hard?: { attempts: number; averageScore: number };
  };

  // Learning velocity (improvement rate)
  @Prop({ type: Number, default: 0 })
  learningVelocity: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const UserPerformanceSchema =
  SchemaFactory.createForClass(UserPerformance);

// Index for efficient queries
UserPerformanceSchema.index({ userId: 1, topicId: 1 }, { unique: true });
UserPerformanceSchema.index({ userId: 1, subjectId: 1 });
