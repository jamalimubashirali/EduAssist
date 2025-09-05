import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type QuestDocument = HydratedDocument<Quest>;

@Schema({ timestamps: true })
export class Quest {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ['daily', 'weekly', 'special'], required: true })
  type: 'daily' | 'weekly' | 'special';

  @Prop({ required: true })
  category: string;

  @Prop({ type: String, enum: ['easy', 'medium', 'hard'], required: true })
  difficulty: 'easy' | 'medium' | 'hard';

  @Prop({ required: true })
  xpReward: number;

  @Prop({ required: true })
  maxProgress: number;

  @Prop({ type: String, default: null })
  badgeReward?: string;

  @Prop({ type: Date, default: null })
  expiresAt?: Date;

  @Prop({ type: String, default: null })
  icon?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  // Auto-generated quest conditions
  @Prop({ type: Object, default: {} })
  conditions: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
