import { Permission } from '../rbac/permission.enum';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
