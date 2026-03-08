import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { WorkOrdersModule } from './work-orders/work-orders.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { UnitsModule } from './units/units.module.js';
import { WebSocketModule } from './websocket/websocket.module.js';
import { AgentSessionsModule } from './agent-sessions/agent-sessions.module.js';
import { AiModule } from './ai/ai.module.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { EscalationsModule } from './escalations/escalations.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkOrdersModule,
    PropertiesModule,
    UnitsModule,
    WebSocketModule,
    AgentSessionsModule,
    AiModule,
    SchedulesModule,
    EscalationsModule,
    ChatModule,
  ],
})
export class AppModule {}
