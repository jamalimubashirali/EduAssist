import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { UserRole } from 'common/enums';
import * as bcrypt from 'bcrypt';

export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum OnboardingStep {
  WELCOME = 'WELCOME',
  PROFILE = 'PROFILE',
  SUBJECTS = 'SUBJECTS',
  GOALS = 'GOALS',
  ASSESSMENT = 'ASSESSMENT',
  ONBOARDING_ASSESSMENT_RESULTS = 'ONBOARDING-ASSESSMENT-RESULTS',
  COMPLETION_SUMMARY = 'COMPLETION-SUMMARY',
}

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

  // Onboarding and profile customization
  @Prop({ type: String, default: null })
  avatar: string | null;

  @Prop({ type: String, default: null })
  theme: string | null;

  @Prop({ type: [String], default: [] })
  goals: string[];

  @Prop({
    type: {
      status: {
        type: String,
        enum: Object.values(OnboardingStatus),
        default: OnboardingStatus.NOT_STARTED,
      },
      step: {
        type: String,
        enum: Object.values(OnboardingStep),
        default: OnboardingStep.WELCOME,
      },
      startedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      lastUpdatedAt: { type: Date, default: null },
      // Enhanced assessment tracking
      assessmentData: {
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        overallScore: { type: Number, default: 0 },
        proficiencyLevel: { type: String, default: 'BEGINNER' },
        timeSpent: { type: Number, default: 0 },
        subjectBreakdown: { type: Object, default: {} },
        weakAreas: { type: [String], default: [] },
        strongAreas: { type: [String], default: [] },
        learningStyle: { type: String, default: null },
        recommendedPath: { type: String, default: null },
        initialDifficulty: { type: String, default: 'MEDIUM' },
        completedAt: { type: Date, default: null },
      },
      // Learning preferences and goals
      learningPreferences: {
        studyTimePerDay: { type: Number, default: 30 }, // minutes
        preferredDifficulty: { type: String, default: 'MEDIUM' },
        focusAreas: { type: [String], default: [] },
        targetScore: { type: Number, default: 75 },
        weeklyGoal: { type: Number, default: 5 }, // quizzes per week
      },
      // Progress tracking
      progressMetrics: {
        questionsAnswered: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        improvementRate: { type: Number, default: 0 },
        consistencyScore: { type: Number, default: 0 },
        engagementLevel: { type: String, default: 'LOW' },
      },
      // Goal progress tracking
      goalProgress: {
        targetScore: { type: Number, default: 75 },
        currentAverageScore: { type: Number, default: 0 },
        scoreGap: { type: Number, default: 0 },
        progressPercentage: { type: Number, default: 0 },
        topicsAtTarget: { type: Number, default: 0 },
        totalTopics: { type: Number, default: 0 },
        weeklyGoalProgress: {
          target: { type: Number, default: 5 },
          completed: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
          isOnTrack: { type: Boolean, default: false },
        },
      },
      // Focus area progress
      focusAreaProgress: { type: Array, default: [] },
      // Improving and declining topics
      improvingTopics: { type: [String], default: [] },
      decliningTopics: { type: [String], default: [] },
    },
    default: {
      status: OnboardingStatus.NOT_STARTED,
      step: OnboardingStep.WELCOME,
      assessmentData: {},
      learningPreferences: {},
      progressMetrics: {},
    },
  })
  onboarding: any;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
  })
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

  // Enhanced learning analytics fields
  @Prop({ type: Number, default: 0 })
  totalQuizzesAttempted: number;

  @Prop({ type: Number, default: 0 })
  averageScore: number;

  @Prop({ type: Number, default: 0 })
  streakCount: number;

  @Prop({ type: Date, default: null })
  lastQuizDate: Date | null;

  // Advanced learning analytics
  @Prop({ type: Object, default: {} })
  learningAnalytics: {
    studyPatterns?: {
      preferredTimeOfDay?: string;
      averageSessionLength?: number;
      studyFrequency?: string;
      peakPerformanceHours?: string[];
    };
    performanceTrends?: {
      weeklyProgress?: number[];
      monthlyImprovement?: number;
      subjectMastery?: Record<string, number>;
      difficultyProgression?: Record<string, number>;
    };
    behaviorMetrics?: {
      questionSkipRate?: number;
      averageThinkingTime?: number;
      helpSeekingFrequency?: number;
      retryPatterns?: Record<string, number>;
    };
    adaptiveLearning?: {
      currentDifficultyLevel?: string;
      recommendedNextTopics?: string[];
      personalizedQuestionTypes?: string[];
      optimalChallengeLevel?: number;
    };
  };

  // Gamification fields
  @Prop({ type: Number, default: 0 })
  longestStreak: number;

  @Prop({ type: [String], default: [] })
  completedQuests: string[];

  @Prop({ type: [String], default: [] })
  unlockedBadges: string[];

  @Prop({ type: Object, default: {} })
  questProgress: Record<string, number>;

  @Prop({ type: Number, default: 0 })
  dailyQuizCount: number;

  @Prop({ type: Number, default: 0 })
  weeklyQuizCount: number;

  @Prop({ type: Date, default: null })
  lastResetDate: Date | null;

  // Timestamp fields (automatically added by Mongoose with timestamps: true)
  createdAt: Date;

  updatedAt: Date;

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
