import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { DifficultyLevel, QuizType } from 'common/enums';

export type QuizSchema = HydratedDocument<Quiz>;

@Schema({ timestamps: true })
export class Quiz {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;
    
    @Prop({ type: SchemaTypes.ObjectId, ref: "Topic", required: true })
    topicId: Types.ObjectId;

    @Prop({ type: [SchemaTypes.ObjectId], ref: "Question", required: true })
    questionIds: Types.ObjectId[];

    @Prop({ type: String, enum: Object.values(DifficultyLevel), default: DifficultyLevel.MEDIUM })
    quizDifficulty: DifficultyLevel;

    @Prop({ type: String, enum: Object.values(QuizType), default: QuizType.PRACTICE })
    quizType: QuizType;

    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ default: 30 }) // Default 30 minutes
    timeLimit: number; // in minutes
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);