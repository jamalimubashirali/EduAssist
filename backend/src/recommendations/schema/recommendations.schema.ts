import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { RecommendationStatus, DifficultyLevel } from 'common/enums';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ timestamps: true })
export class Recommendation {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Attempt', required: true })
  attemptId: Types.ObjectId;

  @Prop({ default: '' })
  recommendationReason: string;

  @Prop({ type: String, enum: Object.values(DifficultyLevel), required: true })
  suggestedDifficulty: DifficultyLevel;

  @Prop({
    type: String,
    enum: Object.values(RecommendationStatus),
    default: RecommendationStatus.PENDING,
  })
  recommendationStatus: RecommendationStatus;

  // Enhanced fields for better recommendation tracking
  @Prop({ type: Number, default: 50 })
  priority: number;

  @Prop({ type: Number, default: 0 })
  urgency: number;

  @Prop({ type: Number, default: 20 })
  estimatedCompletionTime: number; // in minutes

  @Prop({ type: Date })
  actionTakenAt?: Date;

  @Prop({ type: String })
  userFeedback?: string;

  @Prop({ type: Number, min: 1, max: 5 })
  userRating?: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // New field for recommended existing quizzes based on this recommendation
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Quiz' }], default: [] })
  recommendedQuizzes: Types.ObjectId[];

  // Recommendation metadata
  @Prop({ type: Object })
  metadata?: {
    generatedBy: string;
    algorithmVersion: string;
    confidence: number;
    relatedRecommendations: Types.ObjectId[];
  };

  // Auto-populated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const RecommendationSchema =
  SchemaFactory.createForClass(Recommendation);

// Indexes for performance optimization
RecommendationSchema.index({ userId: 1, recommendationStatus: 1 });
RecommendationSchema.index({ userId: 1, createdAt: -1 });
RecommendationSchema.index({ subjectId: 1, topicId: 1 });
RecommendationSchema.index({ priority: -1, urgency: -1 });
RecommendationSchema.index({ isActive: 1, recommendationStatus: 1 });
