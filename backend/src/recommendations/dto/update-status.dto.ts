import { IsNotEmpty, IsEnum } from 'class-validator';
import { RecommendationStatus } from 'common/enums';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(RecommendationStatus, {
    message: 'status must be one of: Pending, Accepted, Rejected, Completed',
  })
  status: RecommendationStatus;
}
