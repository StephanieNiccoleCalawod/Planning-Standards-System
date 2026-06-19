export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                sub?: string;
                userId?: string;
                username?: string;
                displayName?: string;
                office?: string;
                role?: string;
                armsRole?: string;
                isCrossOffice?: boolean;
            };
            clientIp?: string;
        }
    }
}
