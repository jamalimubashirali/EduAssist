import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type PerformanceSchema = HydratedDocument<UserPerformance>;

@Schema({timestamps : true})
export class UserPerformance{
    @Prop({type : SchemaTypes.ObjectId , auto : true})
    _id : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Users" , required : true})
    userId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Subject" , required : true})
    subjectId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Topic" , required : true})
    topicId : Types.ObjectId;

    @Prop({required : true})
    totalAttempts : number;

    @Prop({required : true})
    accurracy : number;

    @Prop({required : true})
    averageScore : number;

    @Prop({required : true})
    bestScore : number;

    @Prop({required : true})
    worstScore : number;

    @Prop({required : true})
    progressTrend : string;

    @Prop({required : true})
    lastQuizAttempted : Date
}

export const PerformanceSchema = SchemaFactory.createForClass(UserPerformance);