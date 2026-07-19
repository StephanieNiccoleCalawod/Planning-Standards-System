import React, { createContext, useContext } from 'react';

// ---------------------------------------------------------------------------
// Role and Permission Type Definitions
// ---------------------------------------------------------------------------
export type ARMS_ROLE = 'SUPER_ADMIN' | 'PLANNING_OFFICER' | 'OPCR_EVALUATOR' | 'SUBSYSTEM_ADMIN' | 'STAFF';

export interface RBACPermission {
    role: string;
    isCrossOffice: boolean;
    canWriteServices: boolean;
    canWriteKpi: boolean;
    canWriteSla: boolean;
    canWriteHolidays: boolean;
    canWritePeriods: boolean;
    canWriteCommitments: boolean;
    canLockCommitments: boolean;
    canViewCommitments: boolean;
    canSeeAddServiceBtn: boolean;
    canSeeKpiActions: boolean;
    canSeeSlaForm: boolean;
    canSeeCommitmentsInSidebar: boolean;
    canSeeOtherOffices: boolean;
    canSeePlanningTimeline: boolean;
    canSeeServiceModes: boolean;
    canExportOpcr: boolean;
    canRequestRevision: boolean;
    canSeeServiceCatalogue: boolean;
}

// ---------------------------------------------------------------------------
// Central Role Configuration (Single Source of Truth)
// ---------------------------------------------------------------------------
export const ROLE_PERMISSIONS: Record<ARMS_ROLE, RBACPermission> = {
    SUPER_ADMIN: {
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
        canSeeServiceCatalogue: true,
    },
    PLANNING_OFFICER: {
        role: 'PlanningOfficer',
        isCrossOffice: true,
        canWriteServices: false,
        canSeeAddServiceBtn: false,
        canWriteKpi: true,
        canSeeKpiActions: true,
        canWriteSla: true,
        canSeeSlaForm: true,
        canWriteHolidays: true,
        canWritePeriods: true,
        canWriteCommitments: false,
        canLockCommitments: true,
        canViewCommitments: true,
        canSeeCommitmentsInSidebar: true,
        canSeeOtherOffices: true,
        canSeePlanningTimeline: true,
        canSeeServiceModes: true,
        canExportOpcr: true,
        canRequestRevision: false,
        canSeeServiceCatalogue: false,
    },
    OPCR_EVALUATOR: {
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
        canViewCommitments: true,
        canSeeCommitmentsInSidebar: true,
        canSeeOtherOffices: true,
        canSeePlanningTimeline: false,
        canSeeServiceModes: false,
        canExportOpcr: true,
        canRequestRevision: false,
        canSeeServiceCatalogue: false,
    },
    SUBSYSTEM_ADMIN: {
        role: 'Admin',
        isCrossOffice: false,
        canWriteServices: true,
        canSeeAddServiceBtn: true,
        canWriteKpi: true,
        canSeeKpiActions: true,
        canWriteSla: false,
        canSeeSlaForm: false,
        canWriteHolidays: true,
        canWritePeriods: false,
        canWriteCommitments: true,
        canLockCommitments: false,
        canViewCommitments: true,
        canSeeCommitmentsInSidebar: true,
        canSeeOtherOffices: false,
        canSeePlanningTimeline: false,
        canSeeServiceModes: false,
        canExportOpcr: true,
        canRequestRevision: true,
        canSeeServiceCatalogue: true,
    },
    STAFF: {
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
        canSeeServiceCatalogue: true,
    },
};

export const DEFAULT_PERMISSIONS: RBACPermission = ROLE_PERMISSIONS.STAFF;

// ---------------------------------------------------------------------------
// UI Theme Color Mappings per Role
// ---------------------------------------------------------------------------
export const ROLE_COLORS: Record<ARMS_ROLE, { bg: string; text: string; border: string; badgeClass: string }> = {
    SUPER_ADMIN: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', badgeClass: 'role-superadmin' },
    PLANNING_OFFICER: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', badgeClass: 'role-planner' },
    OPCR_EVALUATOR: { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF', badgeClass: 'role-head' },
    SUBSYSTEM_ADMIN: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', badgeClass: 'role-head' },
    STAFF: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', badgeClass: 'role-staff' },
};

// ---------------------------------------------------------------------------
// Human-readable Role Labels
// ---------------------------------------------------------------------------
export const ROLE_LABELS: Record<ARMS_ROLE, string> = {
    SUPER_ADMIN: 'Super Admin',
    PLANNING_OFFICER: 'Planning Officer',
    OPCR_EVALUATOR: 'Campus Director / Evaluator',
    SUBSYSTEM_ADMIN: 'Office Head',
    STAFF: 'Staff',
};

// ---------------------------------------------------------------------------
// Default Landing Page per Role (for redirect on login/switch)
// ---------------------------------------------------------------------------
export const ROLE_DEFAULT_PAGE: Record<ARMS_ROLE, string> = {
    SUPER_ADMIN: 'dashboard',
    PLANNING_OFFICER: 'dashboard', // default page mapping (originally planningTimeline which fell back to dashboard)
    SUBSYSTEM_ADMIN: 'dashboard',
    STAFF: 'serviceCatalogue',
    OPCR_EVALUATOR: 'opcrCommitments',
};

// ---------------------------------------------------------------------------
// Page Access Gating Rules
// ---------------------------------------------------------------------------
export const PAGE_ACCESS: Record<string, keyof RBACPermission | null> = {
    dashboard: 'canViewCommitments',
    serviceCatalogue: 'canSeeServiceCatalogue',
    kpiStandards: 'canWriteKpi',
    slaConfiguration: 'canSeeSlaForm',
    holidayCalendar: 'canWriteHolidays',
    evaluationPeriods: 'canWritePeriods',
    opcrCommitments: 'canViewCommitments',
};

// ---------------------------------------------------------------------------
// Sidebar Navigation Layout & Required Permissions
// ---------------------------------------------------------------------------
export interface SidebarItem {
    key: string;
    label: string;
    routeKey: string;
    icon: string;
    requiredPermission?: keyof RBACPermission;
}

export interface SidebarSection {
    section: string;
    items: SidebarItem[];
}

export const SIDEBAR_STRUCTURE: SidebarSection[] = [
    {
        section: "Main",
        items: [
            { key: "dashboard", label: "Dashboard", routeKey: "dashboard", icon: "dashboard", requiredPermission: 'canViewCommitments' },
            { key: "serviceCatalogue", label: "Service Catalogue", routeKey: "serviceCatalogue", icon: "catalogue", requiredPermission: 'canSeeServiceCatalogue' },
            { key: "kpiStandards", label: "KPI Standards", routeKey: "kpiStandards", icon: "target", requiredPermission: 'canWriteKpi' },
            { key: "slaConfiguration", label: "SLA Configuration", routeKey: "slaConfiguration", icon: "sliders", requiredPermission: 'canSeeSlaForm' },
            { key: "holidayCalendar", label: "Holiday Calendar", routeKey: "holidayCalendar", icon: "calendar", requiredPermission: 'canWriteHolidays' },
            { key: "evaluationPeriods", label: "Evaluation Periods", routeKey: "evaluationPeriods", icon: "clock", requiredPermission: 'canWritePeriods' },
        ],
    },
    {
        section: "Insights",
        items: [
            { key: "opcrCommitments", label: "OPCR Commitments", routeKey: "opcrCommitments", icon: "file", requiredPermission: 'canSeeCommitmentsInSidebar' },
        ],
    },
];

// ---------------------------------------------------------------------------
// React Context, Hook, and Guard Component
// ---------------------------------------------------------------------------
export const RBACContext = createContext<RBACPermission | null>(null);

export const useRBAC = () => {
    const permissions = useContext(RBACContext);
    return {
        permissions,
        hasPermission: (permission: keyof RBACPermission | null | undefined): boolean => {
            if (!permission) return true;
            return permissions ? !!permissions[permission] : false;
        },
    };
};

export interface RBACGuardProps {
    permission: keyof RBACPermission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RBACGuard: React.FC<RBACGuardProps> = ({ permission, children, fallback = null }) => {
    const { hasPermission } = useRBAC();
    return (hasPermission(permission) ? children : fallback) as any;
};
