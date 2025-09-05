import { IsArray, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class GenerateAssessmentDto {
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;
}
