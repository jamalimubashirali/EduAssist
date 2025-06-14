import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPerformance, PerformanceSchema } from './schema/performance.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserPerformance.name, schema: PerformanceSchema }])],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule { }
