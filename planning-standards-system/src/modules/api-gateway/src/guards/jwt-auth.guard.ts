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


const ARMS_ROLE_MAP: Record<string, string> = {
    SUPER_ADMIN: 'SuperAdmin',
    PLANNING_OFFICER: 'PlanningOfficer',
    SUBSYSTEM_ADMIN: 'Admin',
    OPCR_EVALUATOR: 'OPCREvaluator',
    STAFF: 'Staff',
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

        // ── Mock token path (dev only) ────────────────────────────────────
        if (token && token.startsWith('mock-token-') && process.env.NODE_ENV !== 'production') {
            const b64Part = token.slice('mock-token-'.length);

            let claims: Record<string, any>;
            try {
                const json = Buffer.from(b64Part, 'base64').toString('utf-8');
                claims = JSON.parse(json);
            } catch {
                // Legacy string fallback
                const legacyRole = b64Part.toUpperCase();
                const legacyMap: Record<string, Record<string, any>> = {
                    STAFF: { userId: 'mock-staff-id', username: 'mock_staff', displayName: 'Mock Staff', armsRole: 'STAFF', office: 'ACAD', isCrossOffice: false },
                    SUBSYSTEM_ADMIN: { userId: 'mock-admin-id', username: 'mock_admin', displayName: 'Mock Admin', armsRole: 'SUBSYSTEM_ADMIN', office: 'ACAD', isCrossOffice: false },
                    SUPER_ADMIN: { userId: 'mock-super-id', username: 'mock_super', displayName: 'Mock SuperAdmin', armsRole: 'SUPER_ADMIN', office: 'ALL', isCrossOffice: true },
                    OPCR_EVALUATOR: { userId: 'mock-opcr-id', username: 'mock_opcr', displayName: 'Mock OPCR', armsRole: 'OPCR_EVALUATOR', office: 'ALL', isCrossOffice: true },
                    PLANNING_OFFICER: { userId: 'mock-planner-id', username: 'mock_planner', displayName: 'Mock Planner', armsRole: 'PLANNING_OFFICER', office: 'ALL', isCrossOffice: true },
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
            displayName: claims.displayName || claims.username,
            office: claims.office,
            isCrossOffice: !!claims.isCrossOffice,
            armsRole,
            role: ARMS_ROLE_MAP[armsRole] ?? 'Staff',
        };

        return true;
    }
}