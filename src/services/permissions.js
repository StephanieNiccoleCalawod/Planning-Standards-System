import { ROLE_PERMISSIONS, DEFAULT_PERMISSIONS } from "../rbac-config";

/**
 * permissions.js
 * CENTRALIZED DELEGATE — now delegates to src/rbac-config.ts.
 */
export function getPermissions(user) {
    if (!user) {
        return DEFAULT_PERMISSIONS;
    }

    const { armsRole = 'STAFF' } = user;
    return ROLE_PERMISSIONS[armsRole] || DEFAULT_PERMISSIONS;
}

/**
 * Checks whether a record's office matches the current user's office scope.
 * If perms.canSeeOtherOffices is true (cross-office), always returns true.
 */
export function isInScope(recordOffice, userOffice, perms) {
    if (!perms || perms.canSeeOtherOffices) return true;
    if (!recordOffice || !userOffice) return true;
    return normalizeOffice(recordOffice) === normalizeOffice(userOffice);
}

/**
 * Normalize office strings for comparison.
 */
export function normalizeOffice(office) {
    if (!office) return '';
    const upper = office.toUpperCase().trim();
    if (upper.includes('ACAD') || upper.includes('ACADEMIC')) return 'ACAD';
    if (upper.includes('OSAS') || upper.includes('STUDENT')) return 'OSAS';
    if (upper.includes('ADMIN') || upper.includes('ADMINISTRATIVE')) return 'ADMIN';
    return upper;
}