import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { UserRole } from 'common/enums';
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

    @Prop({ type: String, default: null })
    token: string | null;

    @Prop({ type: [SchemaTypes.ObjectId], ref: 'Subject', default: [] })
    preferences: Types.ObjectId[];
    
    @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.STUDENT })
    role: UserRole;

    @Prop({ default: 0 })
    leaderboardScore: number;

    @Prop({ default: 1 })
    level: number;

    @Prop({ default: 0 })
    xp_points: number;

    // Enhanced security fields
    @Prop({ type: Number, default: 0 })
    failedLoginAttempts: number;

    @Prop({ type: Date, default: null })
    lockedUntil: Date | null;

    @Prop({ type: Date, default: null })
    lastLoginAt: Date | null;

    @Prop({ type: String, default: null })
    lastLoginIP: string | null;

    // Learning analytics fields
    @Prop({ type: Number, default: 0 })
    totalQuizzesAttempted: number;

    @Prop({ type: Number, default: 0 })
    averageScore: number;

    @Prop({ type: Number, default: 0 })
    streakCount: number;

    @Prop({ type: Date, default: null })
    lastQuizDate: Date | null;

    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }

    // Check if account is locked
    isLocked(): boolean | null {
        return this.lockedUntil && this.lockedUntil > new Date();
    }

    // Increment failed login attempts
    incrementFailedAttempts(): void {
        this.failedLoginAttempts += 1;
        if (this.failedLoginAttempts >= 5) {
            this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
    }

    // Reset failed attempts
    resetFailedAttempts(): void {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
    }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook for password hashing
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

