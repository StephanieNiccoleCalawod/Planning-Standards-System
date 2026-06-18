import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ARMS roles -> PSS internal roles (Admin / Staff / OPCREvaluator)
// Per the RBAC Correction (Developer Guide): SubsystemAdmin and SuperAdmin
// map to 'Admin' (service catalogue / KPI / SLA management only).
// Staff maps to 'Staff' (read-only across all modules except commitments).
// OPCR_EVALUATOR maps to 'OPCREvaluator' — the ONLY role that can create,
// edit, and lock OPCR commitments. isCrossOffice controls whether
// office-scoped filters are bypassed (still true for SUPER_ADMIN and
// OPCR_EVALUATOR).
const ARMS_ROLE_MAP: Record<string, string> = {
    SUPER_ADMIN: 'Admin',
    SUBSYSTEM_ADMIN: 'Admin',
    STAFF: 'Staff',
    OPCR_EVALUATOR: 'OPCREvaluator',
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }
        const token = authHeader.split(' ')[1];

        const armsAuthUrl = this.config.get<string>('ARMS_AUTH_URL');

        let response;
        try {
            response = await firstValueFrom(
                this.http.post(`${armsAuthUrl}/auth/validate`, { token }),
            );
        } catch (err) {
            // Contract A1: if ARMS is unreachable, PSS returns 503 — never fall back silently
            throw new ServiceUnavailableException('ARMS auth service is unreachable');
        }

        const result = response.data;
        if (!result?.valid) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const claims = result.claims ?? {};
        const armsRole = claims.role ?? 'STAFF';

        req.user = {
            sub: claims.userId,
            userId: claims.userId,
            username: claims.username,
            office: claims.office,
            isCrossOffice: !!claims.isCrossOffice,
            armsRole,
            role: ARMS_ROLE_MAP[armsRole] ?? 'Staff',
        };

        return true;
    }
}