/**
 * permissions.js
 * Central source of truth for RBAC capability derivation.
 *
 * Roles (armsRole strings):
 *   OPCR_EVALUATOR  — cross-office evaluator (Ana)
 *   SUBSYSTEM_ADMIN — office head / admin (Maria / Pedro / Albert)
 *   STAFF           — read-only staff (Juan / Jose / Jillian)
 */

/**
 * Returns a permissions object based on the user's ARMS role and office scope.
 *
 * @param {object} user - The decoded user object.
 * @param {string} user.armsRole    - One of OPCR_EVALUATOR | SUBSYSTEM_ADMIN | STAFF
 * @param {string} user.office      - ACAD | OSAS | ADMIN | ALL
 * @param {boolean} user.isCrossOffice - true means bypass office scope filter
 * @returns {object} permissions
 */
export function getPermissions(user) {
    if (!user) {
        return buildPermissions({ role: 'STAFF', isCrossOffice: false, canWrite: false });
    }

    const { armsRole = 'STAFF', isCrossOffice = false } = user;

    switch (armsRole) {
        case 'OPCR_EVALUATOR':
            return buildPermissions({
                role: 'OPCREvaluator',
                isCrossOffice: true,
                // Service Catalogue / KPI — read-only
                canWriteServices: false,
                canWriteKpi: false,
                // SLA — full access
                canWriteSla: true,
                // Holidays and Periods — full access (Super Admin)
                canWriteHolidays: true,
                canWritePeriods: true,
                // Commitments — exclusive write access
                canWriteCommitments: true,
                canViewCommitments: true,
                // UI visibility flags
                canSeeAddServiceBtn: false,
                canSeeKpiActions: false,
                canSeeSlaForm: true,
                canSeeCommitmentsInSidebar: true,
                canSeeOtherOffices: true,
            });

        case 'SUBSYSTEM_ADMIN':
            return buildPermissions({
                role: 'Admin',
                isCrossOffice: false,
                canWriteServices: true,
                canWriteKpi: true,
                // SLA — read-only, view history only
                canWriteSla: false,
                // Holidays and Periods — no write access
                canWriteHolidays: false,
                canWritePeriods: false,
                // Admins cannot create/edit/lock commitments and cannot see the page
                canWriteCommitments: false,
                canViewCommitments: false,
                canSeeAddServiceBtn: true,
                canSeeKpiActions: true,
                canSeeSlaForm: false,
                canSeeCommitmentsInSidebar: false,
                canSeeOtherOffices: false,
            });

        case 'STAFF':
        default:
            return buildPermissions({
                role: 'Staff',
                isCrossOffice: false,
                canWriteServices: false,
                canWriteKpi: false,
                canWriteSla: false,
                canWriteHolidays: false,
                canWritePeriods: false,
                canWriteCommitments: false,
                canViewCommitments: false,
                canSeeAddServiceBtn: false,
                canSeeKpiActions: false,
                canSeeSlaForm: false,
                canSeeCommitmentsInSidebar: false,
                canSeeOtherOffices: false,
            });
    }
}

function buildPermissions(overrides) {
    return {
        role: 'Staff',
        isCrossOffice: false,
        canWriteServices: false,
        canWriteKpi: false,
        canWriteSla: false,
        canWriteHolidays: false,
        canWritePeriods: false,
        canWriteCommitments: false,
        canViewCommitments: false,
        canSeeAddServiceBtn: false,
        canSeeKpiActions: false,
        canSeeSlaForm: false,
        canSeeCommitmentsInSidebar: false,
        canSeeOtherOffices: false,
        ...overrides,
    };
}

/**
 * Checks whether a record's office matches the current user's office scope.
 * If `perms.canSeeOtherOffices` is true (cross-office), always returns true.
 *
 * @param {string} recordOffice - The office field on a record (e.g. service.responsible_unit)
 * @param {object} userOffice   - The user's own office scope (e.g. 'ACAD')
 * @param {object} perms        - The permissions object from getPermissions()
 * @returns {boolean}
 */
export function isInScope(recordOffice, userOffice, perms) {
    if (!perms || perms.canSeeOtherOffices) return true;
    if (!recordOffice || !userOffice) return true; // if no office tag, show to all
    return normalizeOffice(recordOffice) === normalizeOffice(userOffice);
}

/**
 * Normalize office strings for comparison.
 * Handles common variations like "Academic Affairs" → "ACAD".
 */
export function normalizeOffice(office) {
    if (!office) return '';
    const upper = office.toUpperCase().trim();
    // Common expansions
    if (upper.includes('ACAD') || upper.includes('ACADEMIC')) return 'ACAD';
    if (upper.includes('OSAS') || upper.includes('STUDENT')) return 'OSAS';
    if (upper.includes('ADMIN') || upper.includes('ADMINISTRATIVE')) return 'ADMIN';
    return upper;
}