import { Module } from '@nestjs/common';
import { OpslyToolsService } from './tools/opsly-tools.service.js';
import { AgentFactoryService } from './agents/agent-factory.service.js';
import { ChatService } from './chat.service.js';
import { VoiceService } from './voice.service.js';
import { AiController } from './ai.controller.js';
import { WorkOrdersModule } from '../work-orders/work-orders.module.js';

@Module({
  imports: [WorkOrdersModule],
  controllers: [AiController],
  providers: [
    OpslyToolsService,
    AgentFactoryService,
    ChatService,
    VoiceService,
  ],
  exports: [ChatService, VoiceService],
})
export class AiModule {}
