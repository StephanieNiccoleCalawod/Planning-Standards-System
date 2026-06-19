import { Role } from './role.enum';
import { Permission } from './permission.enum';

export const RolePermissions: Record<Role, Permission[]> = {
    [Role.ADMIN]: [
        Permission.SERVICES_READ,
        Permission.SERVICES_WRITE,
        Permission.KPIS_READ,
        Permission.KPIS_WRITE,
        Permission.HOLIDAYS_READ,
        Permission.HOLIDAYS_WRITE,
        Permission.PERIODS_READ,
        Permission.PERIODS_WRITE,
        // RBAC Correction: SubsystemAdmin (mapped to Admin here) has NO commitment access.
        // COMMITMENTS_READ / WRITE / LOCK are intentionally omitted.
    ],
    [Role.STAFF]: [
        Permission.SERVICES_READ,
        Permission.KPIS_READ,
        Permission.HOLIDAYS_READ,
        Permission.PERIODS_READ,
        // RBAC Correction: Staff has NO commitment access.
    ],
    [Role.OPCR_EVALUATOR]: [
        // OPCREvaluator is the ONLY role that can create, edit, and lock
        // the OPCR commitment. They also need read access to services,
        // KPIs, periods, and holidays to build the commitment form.
        Permission.SERVICES_READ,
        Permission.KPIS_READ,
        Permission.HOLIDAYS_READ,
        Permission.PERIODS_READ,
        Permission.PERIODS_WRITE,   
        Permission.COMMITMENTS_READ,
        Permission.COMMITMENTS_WRITE,
        Permission.COMMITMENTS_LOCK,
    ],
};