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
    Permission.COMMITMENTS_READ,
    Permission.COMMITMENTS_WRITE,
    Permission.COMMITMENTS_LOCK,
  ],
  [Role.STAFF]: [
    Permission.SERVICES_READ,
    Permission.KPIS_READ,
    Permission.HOLIDAYS_READ,
    Permission.PERIODS_READ,
    Permission.COMMITMENTS_READ,
  ],
};
