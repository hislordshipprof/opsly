import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { WsAuthGuard, WsUser } from './guards/ws-auth.guard.js';

@WebSocketGateway({
  cors: {
    origin: true, // Allow all origins for now - will use env config in production
    credentials: true,
  },
})
export class OpslyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OpslyGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.logger.log('WebSocket gateway instance created');
  }

  /** Register auth middleware — rejects before 'connect' event fires */
  afterInit(server: Server) {
    server.use((socket: Socket, next) => {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('WebSocket connection rejected: Missing authentication token');
        return next(new Error('Missing authentication token'));
      }

      try {
        const payload = this.jwtService.verify(token);
        socket.data.user = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        } as WsUser;
        this.logger.debug(`WebSocket auth successful: ${payload.email} (${payload.role})`);
        next();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`WebSocket JWT verification failed: ${message}`);
        next(new Error('Invalid or expired token'));
      }
    });
    this.logger.log('WebSocket gateway initialized with auth middleware');
  }

  /** Runs after middleware passes — auto-join role rooms */
  handleConnection(client: Socket) {
    const user = client.data.user as WsUser;
    this.joinRoleRooms(client, user);
    this.logger.log(
      `Connected: ${user.email} (${user.role}) — ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as WsUser | undefined;
    const label = user ? `${user.email} (${user.role})` : 'unauthenticated';
    this.logger.log(`Disconnected: ${label} — ${client.id}`);
  }

  /** Join a specific work order room (RBAC checked in handler) */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinWorkOrder')
  handleJoinWorkOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() workOrderId: string,
  ) {
    const user = client.data.user as WsUser;
    const room = `workorder:${workOrderId}`;
    client.join(room);
    this.logger.log(`${user.email} joined ${room}`);
    return { success: true, room };
  }

  /** Leave a work order room */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leaveWorkOrder')
  handleLeaveWorkOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() workOrderId: string,
  ) {
    const room = `workorder:${workOrderId}`;
    client.leave(room);
    return { success: true, room };
  }

  /** Auto-join role-based rooms on connection */
  private joinRoleRooms(client: Socket, user: WsUser): void {
    switch (user.role) {
      case 'MANAGER':
        client.join('ops:all');
        client.join('escalations');
        client.join('metrics:overview');
        break;
      case 'ADMIN':
        client.join('ops:all');
        client.join('escalations');
        client.join('metrics:overview');
        client.join('audit');
        break;
      case 'TECHNICIAN':
        client.join(`technician:${user.userId}`);
        break;
      case 'TENANT':
        client.join(`tenant:${user.userId}`);
        break;
    }
  }

  // ─── Emit Methods ──────────────────────────────────

  /** New work order created → managers + admins */
  emitWorkOrderCreated(workOrder: Record<string, unknown>) {
    this.emitToRoom('ops:all', 'workorder.created', workOrder);
  }

  /** Status changed → managers + tenant who reported it */
  emitWorkOrderStatusChanged(
    workOrder: Record<string, unknown>,
    tenantUserId: string,
  ) {
    this.emitToRoom('ops:all', 'workorder.status_changed', workOrder);
    this.emitToRoom(
      `tenant:${tenantUserId}`,
      'workorder.status_changed',
      workOrder,
    );
  }

  /** Technician assigned → managers + tenant + technician */
  emitTechnicianAssigned(
    workOrder: Record<string, unknown>,
    tenantUserId: string,
    technicianUserId: string,
  ) {
    this.emitToRoom('ops:all', 'workorder.technician_assigned', workOrder);
    this.emitToRoom(
      `tenant:${tenantUserId}`,
      'workorder.technician_assigned',
      workOrder,
    );
    this.emitToRoom(
      `technician:${technicianUserId}`,
      'workorder.technician_assigned',
      workOrder,
    );
  }

  /** Photo assessed by Gemini Vision → managers + admins */
  emitPhotoAssessed(workOrder: Record<string, unknown>) {
    this.emitToRoom('ops:all', 'workorder.photo_assessed', workOrder);
  }

  /** Escalation triggered → managers + admins */
  emitEscalationTriggered(escalation: Record<string, unknown>) {
    this.emitToRoom('escalations', 'escalation.triggered', escalation);
  }

  /** Escalation advanced to next contact → managers + admins */
  emitEscalationAdvanced(escalation: Record<string, unknown>) {
    this.emitToRoom('escalations', 'escalation.advanced', escalation);
  }

  /** Escalation acknowledged → managers + admins */
  emitEscalationAcknowledged(escalation: Record<string, unknown>) {
    this.emitToRoom('escalations', 'escalation.acknowledged', escalation);
  }

  /** Metrics snapshot updated → managers + admins */
  emitMetricsUpdated(metrics: Record<string, unknown>) {
    this.emitToRoom('metrics:overview', 'metrics.snapshot_updated', metrics);
  }

  /** Work order completed → managers + tenant */
  emitWorkOrderCompleted(
    workOrder: Record<string, unknown>,
    tenantUserId: string,
  ) {
    this.emitToRoom('ops:all', 'workorder.completed', workOrder);
    this.emitToRoom(
      `tenant:${tenantUserId}`,
      'workorder.completed',
      workOrder,
    );
  }

  /** ETA updated → managers + tenant */
  emitEtaUpdated(
    workOrder: Record<string, unknown>,
    tenantUserId: string,
  ) {
    this.emitToRoom('ops:all', 'workorder.eta_updated', workOrder);
    this.emitToRoom(
      `tenant:${tenantUserId}`,
      'workorder.eta_updated',
      workOrder,
    );
  }

  /** Generic emit to a specific room with standard envelope */
  private emitToRoom(
    room: string,
    event: string,
    data: Record<string, unknown>,
  ) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    this.server.to(room).emit(event, payload);
    this.logger.debug(`Emitted ${event} → ${room}`);
  }
}
