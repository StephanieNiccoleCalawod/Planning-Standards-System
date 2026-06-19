import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class ProxyService {
    constructor(private readonly http: HttpService) { }

    /**
     * Forwards the incoming request to a downstream PSS microservice.
     *
     * - Strips the incoming Authorization header (downstream services don't
     *   validate JWTs themselves — that's the gateway's job).
     * - Injects headers derived from the validated req.user (set by
     *   JwtAuthGuard) so downstream guards / audit logging keep working:
     *     x-office     -> office for office-scoping (existing pattern)
     *     x-role       -> PSS role (Admin/Staff) for RolesGuard
     *     x-actor-id           -> ARMS userId
     *     x-actor-username     -> ARMS username (for Kafka audit userName)
     *     x-actor-display-name -> Human-readable display name (e.g. "Ana Reyes")
     *     x-arms-role          -> original ARMS role (for Kafka audit userRole)
     *     x-is-cross-office    -> true/false
     *     x-client-ip          -> real client IP (for audit ip_address)
     */
    async forward(req: Request, res: Response, targetBaseUrl: string): Promise<void> {
        const targetUrl = `${targetBaseUrl}${req.originalUrl}`;

        const headers: Record<string, string> = {
            'content-type': req.headers['content-type'] as string ?? 'application/json',
        };

        if (req.user) {
            headers['x-office'] = req.user.office ?? 'unknown-office';
            headers['x-role'] = req.user.role ?? 'Admin';
            headers['x-actor-id'] = req.user.userId ?? req.user.sub ?? 'system';
            headers['x-actor-username'] = req.user.username ?? req.user.userId ?? 'system';
            headers['x-actor-display-name'] = req.user.displayName ?? req.user.username ?? req.user.userId ?? 'system';
            headers['x-arms-role'] = req.user.armsRole ?? req.user.role ?? 'STAFF';
            headers['x-is-cross-office'] = req.user.isCrossOffice ? 'true' : 'false';
        }

        if (req.clientIp) {
            headers['x-client-ip'] = req.clientIp;
        }

        try {
            const response = await firstValueFrom(
                this.http.request({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    headers,
                    validateStatus: () => true, // pass through downstream status codes as-is
                }),
            );

            res.status(response.status).json(response.data);
        } catch (err) {
            throw new HttpException(
                'Upstream service unreachable',
                503,
            );
        }
    }
}
