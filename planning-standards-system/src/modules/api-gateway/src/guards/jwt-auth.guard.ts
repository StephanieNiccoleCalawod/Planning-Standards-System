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

        if (token && token.startsWith('mock-token-')) {
            // Dynamic base64-decoded mock token format:
            //   mock-token-<base64(JSON_claims_payload)>
            // where JSON_claims_payload contains:
            //   { userId, username, displayName, armsRole, office, isCrossOffice }
            //
            // This allows the frontend to create any user/office/role combination
            // without requiring a backend redeploy.
            const b64Part = token.slice('mock-token-'.length);

            let claims: Record<string, any>;
            try {
                // Attempt to decode as base64 JSON (new dynamic format)
                const json = Buffer.from(b64Part, 'base64').toString('utf-8');
                claims = JSON.parse(json);
            } catch {
                // Fallback: old string format (e.g. mock-token-staff, mock-token-super_admin)
                // Map legacy strings to minimal claim objects for backward compatibility
                const legacyRole = b64Part.toUpperCase();
                const legacyMap: Record<string, Record<string, any>> = {
                    STAFF: { userId: 'mock-staff-id', username: 'mock_staff', armsRole: 'STAFF', office: 'ACAD', isCrossOffice: false },
                    SUBSYSTEM_ADMIN: { userId: 'mock-sub-admin-id', username: 'mock_subsystem_admin', armsRole: 'SUBSYSTEM_ADMIN', office: 'ACAD', isCrossOffice: false },
                    SUPER_ADMIN: { userId: 'mock-super-admin-id', username: 'mock_super_admin', armsRole: 'SUPER_ADMIN', office: 'ALL', isCrossOffice: true },
                    OPCR_EVALUATOR: { userId: 'mock-evaluator-id', username: 'mock_evaluator', armsRole: 'OPCR_EVALUATOR', office: 'ALL', isCrossOffice: true },
                };
                claims = legacyMap[legacyRole] ?? legacyMap['STAFF'];
            }

            const armsRole = claims.armsRole || claims.role || 'STAFF';

            req.user = {
                sub: claims.userId || 'mock-user',
                userId: claims.userId || 'mock-user',
                username: claims.username || 'mock_user',
                displayName: claims.displayName || claims.username || 'Mock User',
                office: claims.office || 'ACAD',
                isCrossOffice: !!claims.isCrossOffice,
                armsRole,
                role: ARMS_ROLE_MAP[armsRole] ?? 'Staff',
            };
            return true;
        }

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