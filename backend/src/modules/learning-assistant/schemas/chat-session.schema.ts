import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  sessionId: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: {
          weakTopics: [String],
          suggestedTopics: [String],
          difficulty: String,
        },
      },
    ],
    default: [],
  })
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: {
      weakTopics?: string[];
      suggestedTopics?: string[];
      difficulty?: string;
    };
  }>;

  @Prop({ type: [String], default: [] })
  contextTopics: string[];

  @Prop({ type: Date, default: Date.now })
  lastActivity: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

// Indexes for efficient queries
ChatSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
ChatSessionSchema.index({ userId: 1, lastActivity: -1 });
ChatSessionSchema.index({ isActive: 1, lastActivity: -1 });
