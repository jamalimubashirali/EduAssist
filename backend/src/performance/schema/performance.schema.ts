import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import { PerformanceMetric } from 'common/enums';

export type PerformanceSchema = HydratedDocument<UserPerformance>;

@Schema({ timestamps: true })
export class UserPerformance {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "User", required: true })
    userId: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "Subject", required: true })
    subjectId: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: "Topic", required: true })
    topicId: Types.ObjectId;

    @Prop({ required: true, default: 0 })
    totalAttempts: number;

    @Prop({ required: true, default: 0 })
    accuracy: number; 

    @Prop({ required: true, default: 0 })
    averageScore: number;

    @Prop({ required: true, default: 0 })
    bestScore: number;

    @Prop({ required: true, default: 0 })
    worstScore: number;

    @Prop({ type: String, enum: Object.values(PerformanceMetric), default: PerformanceMetric.STEADY })
    progressTrend: PerformanceMetric;

    @Prop({ default: Date.now })
    lastQuizAttempted: Date;
}

export const PerformanceSchema = SchemaFactory.createForClass(UserPerformance);