import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const ONBOARDING_STEPS = [
  'WELCOME',
  'PROFILE',
  'SUBJECTS',
  'GOALS',
  'ASSESSMENT',
  'ONBOARDING-ASSESSMENT-RESULTS',
  'COMPLETION-SUMMARY',
];

class OnboardingGoalsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focus_areas?: string[];

  @IsOptional()
  @IsString()
  custom_goal?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  target_score?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weekly_study_hours?: number;
}

export class UpdateOnboardingDto {
  @IsOptional()
  @IsIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  @IsOptional()
  @IsIn(ONBOARDING_STEPS)
  step?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  grade_level?: string;

  @IsOptional()
  @IsString()
  learning_style?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OnboardingGoalsDto)
  goals?: OnboardingGoalsDto;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  lastUpdatedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  // Remove assessment property from UpdateOnboardingDto
  // If you need to store answers or progress, add them as top-level properties or in a dedicated field (e.g., answers, currentQuestionIndex)
  // Do NOT use an 'assessment' property here

  @IsOptional()
  diagnostic?: {
    subject?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    topics?: string[];
    questionCount?: number;
    preferredPace?: string;
  };
}

export class UpdateProfileBasicsDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsArray()
  goals?: string[];
}
