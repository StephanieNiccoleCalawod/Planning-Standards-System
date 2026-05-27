import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Verifies the JWT issued by auth-service (ARMS).
 * Extracts `office` and `sub` claims and attaches to req.user.
 *
 * Mock mode: if JWT_SECRET is not set, falls back to mock values
 * so you can test without auth-service running.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    const secret = this.config.get<string>('JWT_SECRET');

    // ── MOCK MODE (no JWT_SECRET set) ─────────────────────────────────────
    if (!secret) {
      req.user = {
        sub:    'mock-actor',
        office: req.headers['x-mock-office'] ?? 'mock-office',
      };
      return true;
    }

    // ── PRODUCTION MODE ───────────────────────────────────────────────────
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, secret) as any;
      req.user = {
        sub:    payload.sub,
        office: payload.office,   // ARMS sets this claim
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
