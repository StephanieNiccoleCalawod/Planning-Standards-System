import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly config: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];
        const secret = this.config.get<string>('JWT_SECRET');

        // ── Primary path: behind the PSS API Gateway ────────────────────────
        // The gateway validates the token against ARMS (/auth/validate) and
        // forwards the resulting office/role/actor/cross-office info as headers.
        // This module trusts those headers — it is not directly internet-facing.
        if (req.headers['x-actor-id'] || req.headers['x-office']) {
            req.user = {
                sub: req.headers['x-actor-id'] ?? 'system',
                username: req.headers['x-actor-username'] ?? req.headers['x-actor-id'] ?? 'system',
                office: req.headers['x-office'] ?? 'unknown-office',
                role: req.headers['x-role'] ?? 'Staff',
                armsRole: req.headers['x-arms-role'] ?? req.headers['x-role'] ?? 'STAFF',
                isCrossOffice: req.headers['x-is-cross-office'] === 'true',
            };
            return true;
        }

        // ── Fallback path: a raw Bearer JWT was sent directly to this module ─
        // (e.g. local testing without going through the gateway).
        // Also handles mock tokens for dev testing directly on module ports.
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            // Mock token fallback for direct module testing
            if (token?.startsWith('mock-token-') && process.env.NODE_ENV !== 'production') {
                req.user = {
                    sub: 'mock-user',
                    username: 'mock_user',
                    office: 'ACAD',
                    role: 'Admin',
                    armsRole: 'SUBSYSTEM_ADMIN',
                    isCrossOffice: false,
                };
                return true;
            }

            if (!secret) {
                throw new UnauthorizedException('Missing or invalid Authorization header');
            }

            try {
                const payload = jwt.verify(token, secret) as any;
                req.user = {
                    sub: payload.sub,
                    username: payload.username ?? payload.sub,
                    office: payload.office,
                    role: payload.role || 'Staff',
                    armsRole: payload.armsRole ?? payload.role,
                    isCrossOffice: !!payload.isCrossOffice,
                };
                return true;
            } catch {
                throw new UnauthorizedException('Invalid or expired token');
            }
        }

        throw new UnauthorizedException('Missing or invalid Authorization header');
    }
}