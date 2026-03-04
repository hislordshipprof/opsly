import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EscalationsService } from './escalations.service.js';
import { EscalationsController } from './escalations.controller.js';
import { SlaScannerService } from './sla-scanner.service.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [EscalationsController],
  providers: [EscalationsService, SlaScannerService],
  exports: [EscalationsService],
})
export class EscalationsModule {}
