import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ServiceUnavailableException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ARMS roles -> PSS internal roles (Admin / Staff)
// Per the PSS RBAC model (Stakeholder Reference, Section 4), PSS only
// distinguishes Admin (full CRUD) vs Staff (read-only). isCrossOffice
// (true for SUPER_ADMIN and OPCR_EVALUATOR, set by ARMS) separately controls
// whether office-scoped filters are applied.
const ARMS_ROLE_MAP: Record<string, string> = {
    SUPER_ADMIN: 'Admin',
    SUBSYSTEM_ADMIN: 'Admin',
    STAFF: 'Staff',
    OPCR_EVALUATOR: 'Staff', // read-only, but cross-office (sees all offices)
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

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
            // validateStatus: accept ANY status code as a "response" — we want
            // to distinguish "ARMS responded but rejected the token" (401/400)
            // from "ARMS is truly unreachable" (network error, ECONNREFUSED, etc).
            response = await firstValueFrom(
                this.http.post(`${armsAuthUrl}/auth/validate`, { token }, {
                    validateStatus: () => true,
                }),
            );
        } catch (err: any) {
            // Only TRUE network-level failures land here now.
            this.logger.error(`ARMS unreachable at ${armsAuthUrl}/auth/validate: ${err.message}`);
            throw new ServiceUnavailableException('ARMS auth service is unreachable');
        }

        // Log the actual response so we can see exactly what ARMS returned.
        this.logger.debug(`ARMS /auth/validate -> status=${response.status} body=${JSON.stringify(response.data)}`);

        const result = response.data;

        if (!result || typeof result.valid !== 'boolean') {
            // ARMS returned something we don't recognise (not a connection
            // error, since axios got a response — but the shape is wrong).
            throw new UnauthorizedException(
                `Unexpected response from ARMS auth service (HTTP ${response.status}): ${JSON.stringify(response.data)}`,
            );
        }

        if (!result.valid) {
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