// Handles receiving and storing the ARMS-issued JWT in the PSS frontend.
//
// ARMS and PSS are different origins (different ports), so localStorage is
// NOT shared between them. The expected flow is:
//
//   1. User logs into ARMS (e.g. http://localhost:5173)
//   2. A "Go to PSS" link/button in ARMS navigates to:
//        http://<pss-frontend>/?token=<jwt>
//   3. On load, PSS reads ?token= from the URL, stores it under PSS_TOKEN_KEY,
//      and removes it from the URL (so it isn't bookmarked/shared).
//   4. All subsequent api.js requests attach this token as
//      `Authorization: Bearer <token>`.
//
// MOCK TOKEN FORMAT:
//   For local dev, the token format is:
//     mock-token-<base64(JSON_claims_payload)>
//   where JSON_claims_payload = {
//     userId, username, armsRole, office, isCrossOffice, displayName
//   }
//   This is decoded dynamically by the backend jwt-auth.guard.ts and the
//   frontend decodeCurrentUser() below. No hardcoded role strings.

const PSS_TOKEN_KEY = 'pss_token';

// ---------------------------------------------------------------------------
// ARMS role → PSS internal role mapping (shared between frontend and backend)
// ---------------------------------------------------------------------------
const ARMS_ROLE_MAP = {
    SUPER_ADMIN: 'Admin',
    SUBSYSTEM_ADMIN: 'Admin',
    STAFF: 'Staff',
    OPCR_EVALUATOR: 'OPCREvaluator',
};

// ---------------------------------------------------------------------------
// Predefined Mock User Directory
// 7 mock users spanning 3 offices (ACAD, OSAS, ADMIN) + cross-office evaluator
// ---------------------------------------------------------------------------
export const PREDEFINED_MOCK_USERS = [
    {
        id: 'mock-juan',
        displayName: 'Juan dela Cruz',
        username: 'juan.delacruz',
        armsRole: 'STAFF',
        office: 'ACAD',
        isCrossOffice: false,
        roleLabel: 'Staff',
        officeLabel: 'Academic Affairs (ACAD)',
        description: 'Read-only access to ACAD services. OPCR Commitments hidden.',
    },
    {
        id: 'mock-jose',
        displayName: 'Jose Santos',
        username: 'jose.santos',
        armsRole: 'STAFF',
        office: 'OSAS',
        isCrossOffice: false,
        roleLabel: 'Staff',
        officeLabel: 'Student Affairs (OSAS)',
        description: 'Read-only access to OSAS services. OPCR Commitments hidden.',
    },
    {
        id: 'mock-jillian',
        displayName: 'Jillian Reyes',
        username: 'jillian.reyes',
        armsRole: 'STAFF',
        office: 'ADMIN',
        isCrossOffice: false,
        roleLabel: 'Staff',
        officeLabel: 'Administration (ADMIN)',
        description: 'Read-only access to ADMIN services. OPCR Commitments hidden.',
    },
    {
        id: 'mock-maria',
        displayName: 'Maria Garcia',
        username: 'maria.garcia',
        armsRole: 'SUBSYSTEM_ADMIN',
        office: 'ACAD',
        isCrossOffice: false,
        roleLabel: 'Office Head',
        officeLabel: 'Academic Affairs (ACAD)',
        description: 'Manage Services/KPIs/SLAs/Holidays for ACAD only.',
    },
    {
        id: 'mock-pedro',
        displayName: 'Pedro Bautista',
        username: 'pedro.bautista',
        armsRole: 'SUBSYSTEM_ADMIN',
        office: 'OSAS',
        isCrossOffice: false,
        roleLabel: 'Office Head',
        officeLabel: 'Student Affairs (OSAS)',
        description: 'Manage Services/KPIs/SLAs/Holidays for OSAS only.',
    },
    {
        id: 'mock-albert',
        displayName: 'Albert Lim',
        username: 'albert.lim',
        armsRole: 'SUBSYSTEM_ADMIN',
        office: 'ADMIN',
        isCrossOffice: false,
        roleLabel: 'Office Head',
        officeLabel: 'Administration (ADMIN)',
        description: 'Manage Services/KPIs/SLAs/Holidays for ADMIN only.',
    },
    {
        id: 'mock-ana',
        displayName: 'Ana Reyes',
        username: 'ana.reyes',
        armsRole: 'OPCR_EVALUATOR',
        office: 'ALL',
        isCrossOffice: true,
        roleLabel: 'Campus Director / Evaluator',
        officeLabel: 'All Offices (Cross-Office)',
        description: 'Cross-office evaluator. Only role with full OPCR Commitment access.',
    },
    {
        id: 'mock-carlo',
        displayName: 'Carlo Mendoza',
        username: 'carlo.mendoza',
        armsRole: 'PLANNING_OFFICER',
        office: 'ALL',
        isCrossOffice: true,
        roleLabel: 'Planning Officer',
        officeLabel: 'All Offices (Cross-Office)',
        description: 'Cross-office planning officer. Manages KPIs, SLA Rules, Evaluation Periods, Service Modes, and compiles/locks Campus OPCR.',
    },
    {
        id: 'mock-superadmin',
        displayName: 'Ricardo Santos',
        username: 'ricardo.santos',
        armsRole: 'SUPER_ADMIN',
        office: 'ALL',
        isCrossOffice: true,
        roleLabel: 'Super Admin',
        officeLabel: 'All Offices (Cross-Office)',
        description: 'Super Admin. Full access to all modules across all offices.',
    },
];

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export function getToken() {
    return localStorage.getItem(PSS_TOKEN_KEY);
}

export function setToken(token) {
    if (token) {
        localStorage.setItem(PSS_TOKEN_KEY, token);
    }
}

export function clearToken() {
    localStorage.removeItem(PSS_TOKEN_KEY);
}

/**
 * Encodes a claims object into the `mock-token-<base64>` format.
 * This token is recognized by both the frontend decodeCurrentUser()
 * and the backend JwtAuthGuard.
 */
export function encodeMockToken(claims) {
    const json = JSON.stringify(claims);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return `mock-token-${b64}`;
}

/**
 * Decodes the current active token and returns a normalized user object.
 * Returns null if no token is present or the token is invalid.
 *
 * Returned shape:
 *   { userId, username, displayName, armsRole, role, office, isCrossOffice }
 */
export function decodeCurrentUser() {
    const token = getToken();
    if (!token) return null;

    if (token.startsWith('mock-token-')) {
        const b64Part = token.slice('mock-token-'.length);
        try {
            const json = decodeURIComponent(escape(atob(b64Part)));
            const claims = JSON.parse(json);
            return {
                userId: claims.userId || claims.id || 'mock-user',
                username: claims.username || 'mock_user',
                displayName: claims.displayName || claims.username || 'Mock User',
                armsRole: claims.armsRole || claims.role || 'STAFF',
                role: ARMS_ROLE_MAP[claims.armsRole || claims.role] || 'Staff',
                office: claims.office || 'ACAD',
                isCrossOffice: !!claims.isCrossOffice,
            };
        } catch (e) {
            console.warn('[auth] Failed to decode mock token:', e);
            return null;
        }
    }

    // Real JWT — decode the payload section
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map((c) =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const armsRole = decoded.role || decoded.claims?.role || 'STAFF';
        return {
            userId: decoded.sub || decoded.userId,
            username: decoded.username,
            displayName: decoded.displayName || decoded.username,
            armsRole,
            role: ARMS_ROLE_MAP[armsRole] || 'Staff',
            office: decoded.office || 'ACAD',
            isCrossOffice: !!decoded.isCrossOffice,
        };
    } catch (e) {
        console.warn('[auth] Failed to decode JWT:', e);
        return null;
    }
}

/**
 * @deprecated Use decodeCurrentUser() instead.
 * Kept for backward compatibility with components still referencing this.
 */
export function getUserRoleFromToken() {
    const user = decodeCurrentUser();
    return user?.role || 'Staff';
}

/**
 * @deprecated Use decodeCurrentUser() instead.
 */
export function decodeJwt(token) {
    if (!token) return null;
    if (token.startsWith('mock-token-')) {
        // Reconstruct a slim object so legacy callers get something useful
        const b64Part = token.slice('mock-token-'.length);
        try {
            const json = decodeURIComponent(escape(atob(b64Part)));
            return JSON.parse(json);
        } catch {
            // If it can't be decoded, it might be the OLD format
            const role = b64Part.toUpperCase();
            return { role, username: `mock_${role.toLowerCase()}` };
        }
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isAuthenticated() {
    const token = getToken();
    return !!token;
}

/**
 * Call once on app startup (before the first render). If the URL contains
 * ?token=<jwt>, store it and strip it from the address bar.
 */
export function initTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        setToken(token);

        params.delete('token');
        const newSearch = params.toString();
        const newUrl =
            window.location.pathname +
            (newSearch ? `?${newSearch}` : '') +
            window.location.hash;

        window.history.replaceState({}, '', newUrl);
    }
}