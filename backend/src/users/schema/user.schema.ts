import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserSchema = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    // @Prop()
    // token: string;

    // @Prop({ default: []})
    // preferences: string[];

    // @Prop({ default: 0 })
    // leaderboardScore: number;

    // @Prop({ default: 0 })
    // level: number;

    // @Prop({ default: 0 })
    // xp_points: number;
}

export const UserSchema = SchemaFactory.createForClass(User);