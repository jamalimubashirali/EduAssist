import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsObject,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  preferences?: Types.ObjectId[];

  @IsOptional()
  @IsString()
  avatar?: string | null;

  @IsOptional()
  @IsString()
  theme?: string | null;

  @IsOptional()
  @IsArray()
  goals?: string[];

  @IsOptional()
  @IsObject()
  onboarding?: any;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsNumber()
  leaderboardScore?: number;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsNumber()
  xp_points?: number;

  @IsOptional()
  @IsNumber()
  failedLoginAttempts?: number;

  @IsOptional()
  @IsDate()
  lockedUntil?: Date | null;

  @IsOptional()
  @IsDate()
  lastLoginAt?: Date | null;

  @IsOptional()
  @IsString()
  lastLoginIP?: string | null;

  @IsOptional()
  @IsNumber()
  totalQuizzesAttempted?: number;

  @IsOptional()
  @IsNumber()
  averageScore?: number;

  @IsOptional()
  @IsNumber()
  streakCount?: number;

  @IsOptional()
  @IsDate()
  lastQuizDate?: Date | null;

  @IsOptional()
  @IsNumber()
  longestStreak?: number;

  @IsOptional()
  @IsArray()
  completedQuests?: string[];

  @IsOptional()
  @IsArray()
  unlockedBadges?: string[];

  @IsOptional()
  @IsObject()
  questProgress?: Record<string, number>;

  @IsOptional()
  @IsNumber()
  dailyQuizCount?: number;

  @IsOptional()
  @IsNumber()
  weeklyQuizCount?: number;

  @IsOptional()
  @IsDate()
  lastResetDate?: Date | null;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
