import { Module } from '@nestjs/common';
import { OpslyToolsService } from './tools/opsly-tools.service.js';
import { AgentFactoryService } from './agents/agent-factory.service.js';
import { ChatService } from './chat.service.js';
import { VoiceService } from './voice.service.js';
import { InsightsService } from './insights.service.js';
import { AiController } from './ai.controller.js';
import { WorkOrdersModule } from '../work-orders/work-orders.module.js';
import { VisionModule } from './vision.module.js';

@Module({
  imports: [WorkOrdersModule, VisionModule],
  controllers: [AiController],
  providers: [
    OpslyToolsService,
    AgentFactoryService,
    ChatService,
    VoiceService,
    InsightsService,
  ],
  exports: [ChatService, VoiceService],
})
export class AiModule {}
