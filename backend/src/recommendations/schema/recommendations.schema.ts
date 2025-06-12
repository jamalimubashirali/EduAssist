import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type RecommendationSchema = HydratedDocument<Recommendation>;

@Schema({timestamps : true})
export class Recommendation{
    @Prop({type : SchemaTypes.ObjectId , auto : true})
    _id : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Users" , required : true})
    userId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Subject" , required : true})
    subjectId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Topic" , required : true})
    topicId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Attempt" , required : true})
    attemptId : Types.ObjectId;

    @Prop({default : ""})
    recommendationReason : string;

    @Prop({required : true})
    suggestedDifficulty : string;

    @Prop({required : true})
    recommendationStatus : string
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);