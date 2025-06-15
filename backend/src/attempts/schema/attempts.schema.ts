import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { AttemptStatus } from 'common/enums';

export type AttemptSchema = HydratedDocument<Attempt>;

@Schema({ timestamps: true })
export class Attempt {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "User", required: true })
    userId: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "Topic", required: true })
    topicId: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "Quiz", required: true })
    quizId: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "Subject", required: true })
    subjectId: Types.ObjectId;

    @Prop({ default: 0 })
    timeTaken: number; // in seconds

    @Prop({ type: [Object] })
    answersRecorded: {
        questionId: Types.ObjectId;
        selectedAnswer: string;
        isCorrect: boolean;
        timeTaken?: number;
    }[];

    @Prop({ default: 0 })
    score: number;

    @Prop({ type: String, enum: Object.values(AttemptStatus), default: AttemptStatus.IN_PROGRESS })
    status: AttemptStatus;

    @Prop({ default: Date.now })
    dateOfAttempt: Date; // Fixed typo from deteOfAttempt
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);