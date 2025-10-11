import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;
}

export class ChatResponseDto {
  reply: string;
  suggestedTopics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  followUpQuestions?: string[];
  relatedConcepts?: string[];
}
