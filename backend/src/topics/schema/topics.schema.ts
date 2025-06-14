import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";

export type TopicSchema = HydratedDocument<Topic>;

@Schema({
    timestamps: true
})
export class Topic {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'Subject', required: true })
    subjectId: Types.ObjectId;

    @Prop({ required: true })
    topicName: string;

    @Prop({ required: true })
    topicDescription: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);