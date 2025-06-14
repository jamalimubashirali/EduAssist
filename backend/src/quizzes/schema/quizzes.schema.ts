import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type QuizSchema = HydratedDocument<Quiz>;

@Schema({timestamps : true})
export class Quiz{
    @Prop({type : SchemaTypes.ObjectId , auto : true})
    _id : Types.ObjectId;
    
    @Prop({type : SchemaTypes.ObjectId , ref : "Topic" , required : true})
    topicId : Types.ObjectId;

    @Prop({type : [SchemaTypes.ObjectId] , ref : "Question" , required : true})
    questionIds : Types.ObjectId[];

    @Prop()
    quizDifficulty : string;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);