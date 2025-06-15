import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schema/recommendations.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Recommendation.name, schema: RecommendationSchema }])],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
