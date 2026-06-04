import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    const secret = this.config.get<string>('JWT_SECRET');
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const mockEnabled = this.config.get<string>('MOCK_JWT_ENABLED') === 'true';

  
    if (!isProd && (mockEnabled || !secret)) {
      const role = this.config.get<string>('MOCK_JWT_ROLE') || req.headers['x-mock-role'] || 'Admin';
      req.user = {
        sub:    'mock-actor',
        office: req.headers['x-mock-office'] ?? 'mock-office',
        role,
      };
    } else {
   
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }

      try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, secret) as any;
        req.user = {
          sub:    payload.sub,
          office: payload.office,
          role:   payload.role || 'Admin',
        };
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    if (req.user.role === 'Staff' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      throw new ForbiddenException('Staff members have read-only access');
    }

    return true;
  }
}
