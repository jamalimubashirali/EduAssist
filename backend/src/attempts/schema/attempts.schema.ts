import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type AttemptSchema = HydratedDocument<Attempt>;

@Schema({timestamps : true})
export class Attempt{
    @Prop({type : SchemaTypes.ObjectId , auto : true})
    _id : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Users" , required : true})
    userId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Topic" , required : true})
    topicId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Quiz" , required: true})
    quizId : Types.ObjectId;

    @Prop({type : SchemaTypes.ObjectId , ref : "Subject" , required : true})
    subjectId : Types.ObjectId;

    @Prop({default : 0})
    timeTaken : number;

    @Prop()
    answersRecorded: Object[];
    
    @Prop({default : Date.now})
    deteOfAttempt : Date;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);