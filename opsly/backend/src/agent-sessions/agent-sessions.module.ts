import { Module } from '@nestjs/common';
import { AgentSessionsController } from './agent-sessions.controller.js';
import { AgentSessionsService } from './agent-sessions.service.js';

@Module({
  controllers: [AgentSessionsController],
  providers: [AgentSessionsService],
  exports: [AgentSessionsService],
})
export class AgentSessionsModule {}
