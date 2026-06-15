import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export interface RequestContextData {
    actorRole?: string;
    actorUsername?: string;
    clientIp?: string;
}
export declare const RequestContext: {
    run<T>(data: RequestContextData, fn: () => T): T;
    get(): RequestContextData | undefined;
};
export declare class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
