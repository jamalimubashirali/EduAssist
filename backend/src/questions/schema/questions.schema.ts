import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type QuestionSchema = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    @Prop({ required: true })
    questionDifficulty: string;

    @Prop({ required: true })
    questionDescription: string;

    @Prop({ required: true })
    answerOptions: string[];

    @Prop({ required: true })
    correctAnswer: string;

    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    subjectId: Types.ObjectId;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
