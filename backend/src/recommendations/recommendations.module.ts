import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schema/recommendations.schema';

const RecommendationModelModule = MongooseModule.forFeature([
  { name: Recommendation.name, schema: RecommendationSchema }
]);

@Module({
  imports: [RecommendationModelModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService, RecommendationModelModule]
})
export class RecommendationsModule {}
