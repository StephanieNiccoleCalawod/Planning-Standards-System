/**
 * permissions.js
 * Central source of truth for RBAC capability derivation.
 *
 * Roles (armsRole strings):
 *   SUPER_ADMIN      — full access to everything
 *   PLANNING_OFFICER — cross-office, manages KPIs/SLA/Periods/OPCR compile+lock
 *   OPCR_EVALUATOR   — campus director, review-only on OPCR
 *   SUBSYSTEM_ADMIN  — office head, manages own office services/KPIs
 *   STAFF            — read-only on service catalogue only
 */

export function getPermissions(user) {
    if (!user) {
        return buildPermissions({ role: 'STAFF', isCrossOffice: false });
    }

    const { armsRole = 'STAFF', isCrossOffice = false } = user;

    switch (armsRole) {

        case 'SUPER_ADMIN':
            return buildPermissions({
                role: 'SuperAdmin',
                isCrossOffice: true,
                canWriteServices: true,
                canWriteKpi: true,
                canWriteSla: true,
                canWriteHolidays: true,
                canWritePeriods: true,
                canWriteCommitments: true,
                canLockCommitments: true,
                canViewCommitments: true,
                canSeeAddServiceBtn: true,
                canSeeKpiActions: true,
                canSeeSlaForm: true,
                canSeeCommitmentsInSidebar: true,
                canSeeOtherOffices: true,
                canSeePlanningTimeline: true,
                canSeeServiceModes: true,
                canExportOpcr: true,
                canRequestRevision: true,
            });

        case 'PLANNING_OFFICER':
            return buildPermissions({
                role: 'PlanningOfficer',
                isCrossOffice: true,
                canWriteServices: false,       // ❌ NO Service Catalogue write
                canSeeAddServiceBtn: false,
                canWriteKpi: true,             // ✅ KPI Standards — all offices
                canSeeKpiActions: true,
                canWriteSla: true,             // ✅ SLA Rules — full
                canSeeSlaForm: true,
                canWriteHolidays: true,        // ✅ Holidays — full
                canWritePeriods: true,         // ✅ Evaluation Periods — full
                canWriteCommitments: true,     // ✅ Campus OPCR — Compile
                canLockCommitments: true,      // ✅ Campus OPCR — Lock
                canViewCommitments: true,
                canSeeCommitmentsInSidebar: true,
                canSeeOtherOffices: true,
                canSeePlanningTimeline: true,  // ✅ Planning Timeline
                canSeeServiceModes: true,      // ✅ Service Mode Library
                canExportOpcr: true,           // ✅ Export OPCR
                canRequestRevision: false,     // ❌ NO Request Revision
            });

        case 'OPCR_EVALUATOR':
            return buildPermissions({
                role: 'OPCREvaluator',
                isCrossOffice: true,
                canWriteServices: false,
                canSeeAddServiceBtn: false,
                canWriteKpi: false,
                canSeeKpiActions: false,
                canWriteSla: false,
                canSeeSlaForm: false,
                canWriteHolidays: false,
                canWritePeriods: false,
                canWriteCommitments: false,
                canLockCommitments: false,
                canViewCommitments: true,      // ✅ Review Only
                canSeeCommitmentsInSidebar: true,
                canSeeOtherOffices: true,
                canSeePlanningTimeline: false,
                canSeeServiceModes: false,
                canExportOpcr: true,           // ✅ Download only
                canRequestRevision: false,
            });

        case 'SUBSYSTEM_ADMIN':
            return buildPermissions({
                role: 'Admin',
                isCrossOffice: false,
                canWriteServices: true,        // ✅ own office
                canSeeAddServiceBtn: true,
                canWriteKpi: true,             // ✅ own office
                canSeeKpiActions: true,
                canWriteSla: false,            // ❌ NO SLA Rules write
                canSeeSlaForm: false,
                canWriteHolidays: true,        // ✅ own office
                canWritePeriods: false,        // ❌ NO Periods write
                canWriteCommitments: true,     // ✅ submit own targets
                canLockCommitments: false,     // ❌ NO lock
                canViewCommitments: true,      // ✅ view-only OPCR
                canSeeCommitmentsInSidebar: true,
                canSeeOtherOffices: false,
                canSeePlanningTimeline: false,
                canSeeServiceModes: false,
                canExportOpcr: true,           // ✅ download
                canRequestRevision: true,      // ✅ own office
            });

        case 'STAFF':
        default:
            return buildPermissions({
                role: 'Staff',
                isCrossOffice: false,
                canWriteServices: false,
                canSeeAddServiceBtn: false,
                canWriteKpi: false,
                canSeeKpiActions: false,
                canWriteSla: false,
                canSeeSlaForm: false,
                canWriteHolidays: false,
                canWritePeriods: false,
                canWriteCommitments: false,
                canLockCommitments: false,
                canViewCommitments: false,
                canSeeCommitmentsInSidebar: false,
                canSeeOtherOffices: false,
                canSeePlanningTimeline: false,
                canSeeServiceModes: false,
                canExportOpcr: false,
                canRequestRevision: false,
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
        canLockCommitments: false,
        canViewCommitments: false,
        canSeeAddServiceBtn: false,
        canSeeKpiActions: false,
        canSeeSlaForm: false,
        canSeeCommitmentsInSidebar: false,
        canSeeOtherOffices: false,
        canSeePlanningTimeline: false,
        canSeeServiceModes: false,
        canExportOpcr: false,
        canRequestRevision: false,
        ...overrides,
    };
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