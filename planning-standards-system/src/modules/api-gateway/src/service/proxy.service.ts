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
     * Story 2 note: responseType is 'arraybuffer' so binary report
     * downloads (PDF/CSV) pass through untouched. This is safe for the
     * existing JSON routes too — content-type is carried over as-is and
     * the raw bytes are byte-identical to the original JSON body.
     */
    async forward(req: Request, res: Response, targetBaseUrl: string): Promise<void> {
        const cloudFallbackUrl = process.env.CLOUD_BACKEND_URL || 'https://icsa-api.onrender.com';
        const primaryTarget = (targetBaseUrl && targetBaseUrl !== 'undefined') ? targetBaseUrl : cloudFallbackUrl;
        const targetUrl = `${primaryTarget}${req.originalUrl}`;

        const headers: Record<string, string> = {
            'content-type': req.headers['content-type'] as string ?? 'application/json',
        };

        if (req.user) {
            headers['x-office'] = req.user.office ?? 'unknown-office';
            headers['x-role'] = req.user.role ?? 'Admin';
            headers['x-actor-id'] = req.user.userId ?? req.user.sub ?? 'system';
            headers['x-actor-username'] = req.user.username ?? req.user.userId ?? 'system';
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
                    responseType: 'arraybuffer',
                    validateStatus: () => true,
                }),
            );

            // If primary returned 404/502/503 and primary is not cloud fallback, try cloud fallback
            if ([404, 502, 503].includes(response.status) && primaryTarget !== cloudFallbackUrl) {
                try {
                    const fallbackEndpoint = req.originalUrl.replace(/^\/api/, '');
                    const fallbackResp = await firstValueFrom(
                        this.http.request({
                            method: req.method,
                            url: `${cloudFallbackUrl}${fallbackEndpoint}`,
                            data: req.body,
                            headers,
                            responseType: 'arraybuffer',
                            validateStatus: () => true,
                        }),
                    );
                    if (fallbackResp.status < 500) {
                        res.status(fallbackResp.status);
                        const contentType = fallbackResp.headers['content-type'] as string | undefined;
                        if (contentType) res.setHeader('content-type', contentType);
                        res.send(Buffer.from(fallbackResp.data));
                        return;
                    }
                } catch (_) { }
            }

            res.status(response.status);
            const contentType = response.headers['content-type'] as string | undefined;
            if (contentType) res.setHeader('content-type', contentType);
            const contentDisposition = response.headers['content-disposition'] as string | undefined;
            if (contentDisposition) res.setHeader('content-disposition', contentDisposition);
            res.send(Buffer.from(response.data));
        } catch (err) {
            if (primaryTarget !== cloudFallbackUrl) {
                try {
                    const fallbackEndpoint = req.originalUrl.replace(/^\/api/, '');
                    const fallbackResp = await firstValueFrom(
                        this.http.request({
                            method: req.method,
                            url: `${cloudFallbackUrl}${fallbackEndpoint}`,
                            data: req.body,
                            headers,
                            responseType: 'arraybuffer',
                            validateStatus: () => true,
                        }),
                    );
                    res.status(fallbackResp.status);
                    const contentType = fallbackResp.headers['content-type'] as string | undefined;
                    if (contentType) res.setHeader('content-type', contentType);
                    res.send(Buffer.from(fallbackResp.data));
                    return;
                } catch (_) { }
            }
            throw new HttpException(
                'Upstream service unreachable',
                503,
            );
        }
    }
}