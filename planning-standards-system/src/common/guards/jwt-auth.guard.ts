import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

// ── FIX (Sprint 4): normalize ARMS-style role names to PSS role names ──────
// Internal service-to-service calls (e.g. commitment → kpi-sla period
// validation) forward x-role using the ARMS format (SUPER_ADMIN,
// SUBSYSTEM_ADMIN, ...), but RolesGuard's RolePermissions map is keyed by
// PSS role names (SuperAdmin, Admin, ...). Without this mapping the guard
// throws "Unrecognized role" (403), which the caller's blanket catch then
// masks as "Period ... not found in kpi-sla service".
const ROLE_NORMALIZE: Record<string, string> = {
    SUPER_ADMIN: 'SuperAdmin',
    PLANNING_OFFICER: 'PlanningOfficer',
    SUBSYSTEM_ADMIN: 'Admin',
    OPCR_EVALUATOR: 'OPCREvaluator',
    STAFF: 'Staff',
};

function normalizeRole(role: string | undefined): string {
    if (!role) return 'Staff';
    return ROLE_NORMALIZE[role] ?? role;
}

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
                role: normalizeRole(req.headers['x-role'] as string),
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
                    role: normalizeRole(payload.role),
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