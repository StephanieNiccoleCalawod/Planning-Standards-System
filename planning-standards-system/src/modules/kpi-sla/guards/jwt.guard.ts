import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    const secret = this.config.get<string>('JWT_SECRET');

    if (!secret) {
      req.user = {
        sub:    'mock-actor',
        office: req.headers['x-mock-office'] ?? 'mock-office',
      };
      return true;
    }


    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, secret) as any;
      req.user = {
        sub:    payload.sub,
        office: payload.office,   
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
