import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { DifficultyLevel } from 'common/enums';

export type QuestionSchema = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(DifficultyLevel), required: true })
    questionDifficulty: DifficultyLevel;

    @Prop({ required: true })
    questionText: string; // Updated from questionDescription

    @Prop({ required: true, type: [String] })
    answerOptions: string[];

    @Prop({ required: true })
    correctAnswer: string;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
    subjectId: Types.ObjectId;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
