import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SearchTopicsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  q: string;
}
