import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTopicDto {
  @IsString({ message: 'Subject ID must be a string' })
  @IsNotEmpty({ message: 'Subject ID is required' })
  subjectId: string;

  @IsString({ message: 'Topic Name must be a string' })
  @IsNotEmpty({ message: 'Topic Name is required' })
  topicName: string;

  @IsString({ message: 'Topic Description must be a string' })
  @IsNotEmpty({ message: 'Topic Description is required' })
  topicDescription: string;
}
