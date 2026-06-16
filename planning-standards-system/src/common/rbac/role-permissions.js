"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = void 0;
const role_enum_1 = require("./role.enum");
const permission_enum_1 = require("./permission.enum");
exports.RolePermissions = {
    [role_enum_1.Role.ADMIN]: [
        permission_enum_1.Permission.SERVICES_READ,
        permission_enum_1.Permission.SERVICES_WRITE,
        permission_enum_1.Permission.KPIS_READ,
        permission_enum_1.Permission.KPIS_WRITE,
        permission_enum_1.Permission.HOLIDAYS_READ,
        permission_enum_1.Permission.HOLIDAYS_WRITE,
        permission_enum_1.Permission.PERIODS_READ,
        permission_enum_1.Permission.PERIODS_WRITE,
        permission_enum_1.Permission.COMMITMENTS_READ,
        permission_enum_1.Permission.COMMITMENTS_WRITE,
        permission_enum_1.Permission.COMMITMENTS_LOCK,
    ],
    [role_enum_1.Role.STAFF]: [
        permission_enum_1.Permission.SERVICES_READ,
        permission_enum_1.Permission.KPIS_READ,
        permission_enum_1.Permission.HOLIDAYS_READ,
        permission_enum_1.Permission.PERIODS_READ,
        permission_enum_1.Permission.COMMITMENTS_READ,
    ],
};
//# sourceMappingURL=role-permissions.js.map