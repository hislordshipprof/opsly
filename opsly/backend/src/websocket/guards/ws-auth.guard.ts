import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export interface WsUser {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const user = this.extractAndVerify(client);
    client.data.user = user;
    return true;
  }

  /** Extracts and verifies JWT from socket handshake */
  extractAndVerify(client: Socket): WsUser {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token);
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }
}
