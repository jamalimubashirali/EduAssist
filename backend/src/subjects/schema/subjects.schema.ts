import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type SubjectSchema = HydratedDocument<Subject>;

@Schema({
    timestamps : true
})
export class Subject {
    @Prop({type : SchemaTypes.ObjectId , auto : true})
    _id : Types.ObjectId;

    @Prop({required : true , unique : true})
    subjectName : string

    @Prop({required : true})
    subjectDescription : string
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);