import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, SchemaTypes, Types } from "mongoose";
import * as bcrypt from 'bcrypt';


export type UserSchema = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ type: SchemaTypes.ObjectId, auto: true })
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: null })
    token: string;

    @Prop({ type: [SchemaTypes.ObjectId], ref: 'Subject' , default: [] })
    preferences: Types.ObjectId[];

    @Prop({ default: 0 })
    leaderboardScore: number;

    @Prop({ default: 0 })
    level: number;

    @Prop({ default: 0 })
    xp_points: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

