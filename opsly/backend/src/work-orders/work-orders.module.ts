import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller.js';
import { WorkOrdersService } from './work-orders.service.js';
import { VisionModule } from '../ai/vision.module.js';

@Module({
  imports: [VisionModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
