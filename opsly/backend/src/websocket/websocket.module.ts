import { Global, Module } from '@nestjs/common';
import { OpslyGateway } from './opsly.gateway.js';
import { WsAuthGuard } from './guards/ws-auth.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Global()
@Module({
  imports: [AuthModule],
  providers: [OpslyGateway, WsAuthGuard],
  exports: [OpslyGateway],
})
export class WebSocketModule {}
