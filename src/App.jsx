import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import FloatingICSA from "./components/FloatingICSA";
import Dashboard from "./pages/Dashboard";
import ServiceCatalogue from "./pages/ServiceCatalogue";
import KPIStandards from "./pages/KPIStandards";
import SLAConfiguration from "./pages/SLAConfiguration";
import HolidayCalendar from "./pages/HolidayCalendar";
import EvaluationPeriods from "./pages/EvaluationPeriods";
import OPCRCommitments from "./pages/OPCRCommitments";
import PlanningHub from "./pages/PlanningHub";
import ServiceModes from "./pages/ServiceModes";
import CampusOpcrTracker from "./pages/CampusOpcrTracker";
import { isAuthenticated, PREDEFINED_MOCK_USERS, encodeMockToken } from "./services/auth";
import { useAppStore } from "./store/useAppStore";

const ARMS_URL = import.meta.env.VITE_ARMS_URL || 'http://localhost:5173';

const ROLE_COLORS = {
    'Staff': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    'Office Head': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    'Campus Director / Evaluator': { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
    'Campus Director': { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
    'OPCR Evaluator': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
    'Planning Officer': { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
    'Super Admin': { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

const OFFICE_COLORS = {
    'ACAD': { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    'OSAS': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
    'ADMIN': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    'ALL': { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
};

function DevBypassScreen() {
    const { loginAsMockUser } = useAppStore();
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleLoginAs = (user) => {
        // Store the default landing page based on ARMS role before reloading
        // Default landing page per role (per Module Access Matrix)
        const ROLE_DEFAULT_PAGE = {
            'SUPER_ADMIN': 'dashboard',        // /admin/dashboard — full overview
            'PLANNING_OFFICER': 'planningHub', // /planning/hub — primary workspace for Planning Officer
            'SUBSYSTEM_ADMIN': 'dashboard',        // /dashboard — office overview
            'STAFF': 'serviceCatalogue', // /services — only accessible module
            'OPCR_EVALUATOR': 'opcrCommitments',  // /campus-opcr — only job is to review
            'CAMPUS_DIRECTOR': 'dashboard',       // /dashboard — campus-wide overview (AC9)
        };
        const defaultPage = ROLE_DEFAULT_PAGE[user.armsRole] || 'dashboard';
        localStorage.setItem('pss_default_page', defaultPage);
        loginAsMockUser(user);
    };

    const groupedOffices = ['ACAD', 'OSAS', 'ADMIN', 'Cross-Office'];

    const officeFullNames = {
        'ACAD': 'Academic Affairs Office',
        'OSAS': 'Student Affairs Office (OSAS)',
        'ADMIN': 'Administration Office',
        'Cross-Office': 'Cross-Office Access',
    };

    const getOfficeColors = (office) => {
        switch (office) {
            case 'ACAD':
                return { color: 'var(--acad)', soft: 'var(--acad-soft)' };
            case 'OSAS':
                return { color: 'var(--osas)', soft: 'var(--osas-soft)' };
            case 'ADMIN':
                return { color: 'var(--admin)', soft: 'var(--admin-soft)' };
            default:
                return { color: 'var(--accent)', soft: 'var(--accent-soft)' };
        }
    };

    const getFilteredUsers = (officeKey) => {
        return PREDEFINED_MOCK_USERS.filter((user) => {
            const matchesOffice = (officeKey === 'Cross-Office' ? user.office === 'ALL' : user.office === officeKey);
            if (!matchesOffice) return false;

            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;

            const haystack = `${user.displayName} @${user.username} ${user.roleLabel} ${officeFullNames[officeKey] || officeKey}`.toLowerCase();
            return haystack.includes(q);
        });
    };

    return (
        <div className="bypass-bg">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

                .bypass-bg {
                    --bg: #F5F6F8;
                    --surface: #FFFFFF;
                    --ink: #12151C;
                    --ink-muted: #5B6472;
                    --ink-faint: #9AA1AC;
                    --line: #E6E8EC;

                    --accent: #7A1125;
                    --accent-soft: #F3E1E4;
                    --accent-deep: #56091A;

                    --acad: #3955C9;
                    --acad-soft: #E9ECFB;
                    --osas: #128A63;
                    --osas-soft: #DFF5EC;
                    --admin: #A8790F;
                    --admin-soft: #FBF0D8;

                    --shadow-rest: 0 2px 8px rgba(18, 21, 28, 0.04), 0 1px 2px rgba(18, 21, 28, 0.02);
                    --shadow-hover: 0 12px 28px rgba(18, 21, 28, 0.09), 0 4px 10px rgba(18, 21, 28, 0.04);

                    min-height: 100vh;
                    height: 100vh;
                    overflow-y: auto;
                    background:
                        radial-gradient(circle at 1px 1px, rgba(18,21,28,0.05) 1px, transparent 0) 0 0/22px 22px,
                        var(--bg);
                    color: var(--ink);
                    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    padding: 64px 24px 140px;
                }

                .mono { font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace; }

                .wrap {
                    max-width: 880px;
                    margin: 0 auto;
                }

                .header {
                    text-align: center;
                    margin-bottom: 48px;
                }

                .eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 14px;
                    border-radius: var(--radius-full);
                    background: var(--accent-soft);
                    color: var(--accent-deep);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    margin-bottom: 22px;
                }
                .eyebrow::before {
                    content: '';
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--accent);
                    flex-shrink: 0;
                }

                .bypass-title {
                    font-size: 42px;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                    line-height: 1.08;
                    margin: 0 0 14px;
                    color: var(--ink);
                }
                
                .subcopy {
                    font-size: 16px;
                    color: var(--ink-muted);
                    max-width: 440px;
                    margin: 0 auto;
                    line-height: 1.55;
                }

                .search-row {
                    max-width: 480px;
                    margin: 32px auto 0;
                    position: relative;
                }
                .search-row::before {
                    content: '>';
                    position: absolute;
                    left: 18px; top: 50%; transform: translateY(-50%);
                    color: var(--ink-faint);
                    font-weight: 700;
                    font-size: 14px;
                }
                #search {
                    width: 100%;
                    padding: 13px 16px 13px 36px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--line);
                    background: var(--surface);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13.5px;
                    color: var(--ink);
                    outline: none;
                    box-shadow: var(--shadow-rest);
                    transition: border-color .15s ease, box-shadow .15s ease;
                }
                #search::placeholder { color: var(--ink-faint); }
                #search:focus {
                    border-color: var(--ink);
                    box-shadow: var(--shadow-hover);
                }

                .panel {
                    background: var(--surface);
                    border: 1px solid var(--line);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-md);
                    padding: 36px 40px 28px;
                    margin-top: 40px;
                }

                .panel-head {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 18px;
                }
                .panel-head .rule {
                    flex: 1; height: 1px; background: var(--line);
                }
                .panel-head .tag {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--ink-faint);
                    display: flex; align-items: center; gap: 7px;
                    white-space: nowrap;
                }

                .info-box {
                    border: 1px dashed var(--line);
                    border-radius: var(--radius-md);
                    padding: 14px 16px;
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: var(--ink-muted);
                    background: #FBFBFC;
                    margin-bottom: 34px;
                    text-align: left;
                }
                .info-box b { color: var(--ink); font-weight: 600; }

                .office {
                    margin-bottom: 32px;
                    text-align: left;
                }
                .office:last-child { margin-bottom: 8px; }

                .office-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 11.5px;
                    font-weight: 700;
                    letter-spacing: 0.09em;
                    text-transform: uppercase;
                    color: var(--ink-faint);
                    margin-bottom: 14px;
                }
                .office-label .dot {
                    width: 7px; height: 7px; border-radius: 2px;
                }
                .office-label .count {
                    margin-left: auto;
                    font-weight: 500;
                    color: var(--ink-faint);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                }

                .cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
                    gap: 12px;
                    justify-content: center;
                }

                .card {
                    position: relative;
                    text-align: left;
                    background: var(--surface);
                    border: 1px solid var(--line);
                    border-left: 3px solid var(--office-color, var(--ink-faint));
                    border-radius: var(--radius-lg);
                    padding: 16px 16px 14px;
                    cursor: pointer;
                    box-shadow: var(--shadow-rest);
                    transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
                    font: inherit;
                    color: inherit;
                    display: block;
                    width: 100%;
                    outline: none;
                }
                .card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-hover);
                }
                .card:focus-visible {
                    outline: 2px solid var(--ink);
                    outline-offset: 2px;
                }
                .card.selected {
                    box-shadow: var(--shadow-hover);
                    border-color: var(--office-color, var(--ink));
                }
                .card.selected::after {
                    content: '✓';
                    position: absolute;
                    top: 14px; right: 14px;
                    width: 20px; height: 20px;
                    border-radius: 50%;
                    background: var(--office-color, var(--ink));
                    color: #fff;
                    font-size: 11px;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700;
                }

                .card-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 13px;
                }

                .avatar {
                    width: 42px; height: 42px;
                    border-radius: var(--radius-md);
                    background: var(--office-soft, #EEF0F3);
                    color: var(--office-color, var(--ink-muted));
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    font-size: 13.5px;
                    flex-shrink: 0;
                    transition: background 0.15s ease, color 0.15s ease;
                }

                .name-block .name {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--ink);
                    line-height: 1.3;
                }
                .name-block .handle {
                    font-size: 12px;
                    color: var(--ink-faint);
                    font-family: 'JetBrains Mono', monospace;
                    margin-top: 1px;
                }

                .badges {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-bottom: 10px;
                }
                .badge {
                    font-size: 10.5px;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    padding: 4px 9px;
                    border-radius: var(--radius-full);
                    font-family: 'JetBrains Mono', monospace;
                }
                .badge.role-staff { background: #EEF0F3; color: #4B5563; }
                .badge.role-head { background: var(--office-soft, #EEF0F3); color: var(--office-color, var(--ink-muted)); }
                .badge.role-dept { background: #F3F4F6; color: #6B7280; }
                .badge.role-planner { background: #EFF6FF; color: #1D4ED8; }
                .badge.role-superadmin { background: #FEF3C7; color: #92400E; }

                .token-line {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10.5px;
                    color: var(--ink-faint);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-height: 0;
                    opacity: 0;
                    transition: max-height .18s ease, opacity .18s ease, margin-top .18s ease;
                    text-align: left;
                }
                .card:hover .token-line, .card.selected .token-line {
                    max-height: 16px;
                    opacity: 1;
                    margin-top: 2px;
                }
                .token-line::before { content: 'token  '; color: var(--ink-faint); opacity: .6; }

                .continue-bar {
                    position: fixed;
                    left: 0; right: 0; bottom: 0;
                    display: flex;
                    justify-content: center;
                    padding: 18px 24px;
                    pointer-events: none;
                    z-index: 100;
                }
                .continue-bar .inner {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: var(--ink);
                    color: #fff;
                    border-radius: var(--radius-lg);
                    padding: 10px 12px 10px 18px;
                    box-shadow: 0 14px 32px rgba(18,21,28,0.28);
                    transform: translateY(120%);
                    opacity: 0;
                    transition: transform .22s ease, opacity .22s ease;
                }
                .continue-bar .inner.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                .continue-bar .label {
                    font-size: 13px;
                    font-family: 'JetBrains Mono', monospace;
                    color: #C7CBD3;
                    white-space: nowrap;
                }
                .continue-bar .label b { color: #fff; font-weight: 600; }
                .continue-bar button {
                    background: var(--accent);
                    color: #fff;
                    border: none;
                    border-radius: var(--radius-md);
                    padding: 9px 16px;
                    font-size: 13px;
                    font-weight: 700;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: background .15s ease;
                }
                .continue-bar button:hover { background: var(--accent-deep); }

                @media (max-width: 600px) {
                    .bypass-bg { padding: 40px 16px 130px; }
                    .bypass-title { font-size: 30px; }
                    .panel { padding: 26px 20px 20px; }
                    .cards { grid-template-columns: 1fr; }
                }
            `}} />

            <div className="wrap">
                {/* Header */}
                <div className="header">
                    <span className="eyebrow mono">PSS — Planning &amp; Standards System</span>
                    <h1 className="bypass-title">Session not found</h1>
                    <p className="subcopy">Select a mock user below to simulate a session.</p>

                    <div className="search-row">
                        <input
                            id="search"
                            className="mono"
                            type="text"
                            placeholder="search by name, handle, or office..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Panel */}
                <div className="panel">
                    <div className="panel-head">
                        <div className="rule"></div>
                        <div className="tag mono">⚙ Developer bypass</div>
                        <div className="rule"></div>
                    </div>

                    <div className="info-box mono">
                        Select a mock user to simulate that user's session. <b>Tokens are base64-encoded</b> and decoded dynamically — no backend redeploy needed.
                    </div>

                    <div id="officeList">
                        {groupedOffices.map((officeKey) => {
                            const filteredUsers = getFilteredUsers(officeKey);
                            if (filteredUsers.length === 0) return null;

                            const officeColors = getOfficeColors(officeKey);

                            return (
                                <div key={officeKey} className="office" data-office={officeKey.toLowerCase()}>
                                    <div className="office-label">
                                        <span className="dot" style={{ background: officeColors.color }}></span>
                                        {officeFullNames[officeKey] || officeKey}
                                        <span className="count mono">{filteredUsers.length}</span>
                                    </div>

                                    <div className="cards">
                                        {filteredUsers.map((user) => {
                                            const isSelected = selectedUser?.id === user.id;
                                            const token = encodeMockToken({
                                                userId: user.id,
                                                username: user.username,
                                                displayName: user.displayName,
                                                armsRole: user.armsRole,
                                                office: user.office,
                                                isCrossOffice: user.isCrossOffice,
                                            });

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    className={`card ${isSelected ? 'selected' : ''}`}
                                                    style={{
                                                        '--office-color': officeColors.color,
                                                        '--office-soft': officeColors.soft,
                                                    }}
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    <div className="card-top">
                                                        <div className="avatar">
                                                            {user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div className="name-block">
                                                            <div className="name">{user.displayName}</div>
                                                            <div className="handle">@{user.username}</div>
                                                        </div>
                                                    </div>

                                                    <div className="badges">
                                                        {user.roleLabel === 'Staff' && <span className="badge role-staff">Staff</span>}
                                                        {user.roleLabel === 'Office Head' && <span className="badge role-head">Office Head</span>}
                                                        {user.roleLabel === 'Campus Director / Evaluator' && <span className="badge role-head">Director</span>}
                                                        {user.roleLabel === 'Planning Officer' && <span className="badge role-planner">Planning Officer</span>}
                                                        {user.roleLabel === 'Super Admin' && <span className="badge role-superadmin">Super Admin</span>}
                                                        <span className="badge role-dept">{user.office}</span>
                                                    </div>

                                                    <div className="token-line">{token}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sticky Continue Bar */}
            <div className="continue-bar">
                <div className={`inner ${selectedUser ? 'show' : ''}`} id="bar">
                    <span className="label mono" id="barLabel">
                        Continue as <b>{selectedUser ? selectedUser.displayName : '—'}</b>
                    </span>
                    <button id="continueBtn" type="button" onClick={() => handleLoginAs(selectedUser)}>
                        Continue →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    // Read default page set by Developer Bypass role-redirect, then clear it
    const initialPage = (() => {
        const saved = localStorage.getItem('pss_default_page');
        if (saved) {
            localStorage.removeItem('pss_default_page');
            if (window.location.pathname !== '/') {
                window.history.replaceState(null, '', '/');
            }
            return saved;
        }
        if (window.location.pathname === '/planning/hub') {
            return 'planningHub';
        }
        if (window.location.pathname === '/planning/opcr-tracker') {
            return 'opcrTracker';
        }
        return 'dashboard';
    })();
    const [active, setActive] = useState(initialPage);
    const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen, permissions } = useAppStore();

    useEffect(() => {
        const handlePopState = () => {
            if (window.location.pathname === '/planning/hub') {
                setActive('planningHub');
            } else if (window.location.pathname === '/planning/opcr-tracker') {
                setActive('opcrTracker');
            } else if (window.location.pathname === '/' || window.location.pathname === '') {
                setActive('dashboard');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    if (!isAuthenticated()) {
        return <DevBypassScreen />;
    }

    // Users without commitment sidebar access (e.g. Staff, Planning Officer) redirect appropriately
    const safeActive = (active === 'opcrCommitments' && !permissions.canSeeCommitmentsInSidebar)
        ? (permissions.canSeePlanningHub ? 'planningHub' : 'dashboard')
        : active;

    const handleNavigate = (pageKey) => {
        // Block navigation to opcrCommitments if not allowed in sidebar
        if (pageKey === 'opcrCommitments' && !permissions.canSeeCommitmentsInSidebar) return;
        if (pageKey === 'planningHub') {
            if (window.location.pathname !== '/planning/hub') {
                window.history.pushState(null, '', '/planning/hub');
            }
        } else if (pageKey === 'opcrTracker') {
            if (window.location.pathname !== '/planning/opcr-tracker') {
                window.history.pushState(null, '', '/planning/opcr-tracker');
            }
        } else if (window.location.pathname === '/planning/hub' || window.location.pathname === '/planning/opcr-tracker') {
            window.history.pushState(null, '', '/');
        }
        setActive(pageKey);
        setSidebarMobileOpen(false);
    };

    const PAGES = {
        planningHub: <PlanningHub onNavigate={handleNavigate} />,
        opcrTracker: <CampusOpcrTracker onNavigate={handleNavigate} />,
        dashboard: <Dashboard />,
        serviceCatalogue: <ServiceCatalogue />,
        kpiStandards: <KPIStandards />,
        slaConfiguration: <SLAConfiguration />,
        holidayCalendar: <HolidayCalendar />,
        evaluationPeriods: <EvaluationPeriods />,
        serviceModes: <ServiceModes />,
        opcrCommitments: permissions.canViewCommitments ? <OPCRCommitments /> : <Dashboard />,
    };

    return (
        <div className="lib-page" style={{ height: "100vh", overflow: "hidden", display: "flex", width: "100vw" }}>
            <style dangerouslySetInnerHTML={{
                __html: `
        .main-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100vh;
          overflow: hidden;
          min-width: 0;
        }
        @media (max-width: 960px) {
          .main-container {
            margin-left: 0 !important;
          }
        }
        .mobile-header {
          display: none;
          height: 56px;
          background: #500000;
          color: #ffffff;
          align-items: center;
          padding: 0 16px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 99;
          gap: 16px;
        }
        @media (max-width: 960px) {
          .mobile-header {
            display: flex;
          }
        }
        .menu-btn {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.15s ease;
        }
        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      `}} />
            <Sidebar
                active={safeActive}
                setActive={handleNavigate}
                isOpen={sidebarMobileOpen}
                onClose={() => setSidebarMobileOpen(false)}
            />
            <div
                className="main-container"
                style={{
                    marginLeft: sidebarCollapsed ? '64px' : '256px',
                    transition: 'margin-left 0.3s ease-in-out'
                }}
            >
                <div className="mobile-header">
                    <button className="menu-btn" onClick={() => setSidebarMobileOpen(true)}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="15" y2="18" />
                        </svg>
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.5px', fontFamily: '"DM Sans", sans-serif' }}>PUP Caloocan</span>
                </div>
                <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
                    {PAGES[safeActive] || PAGES.dashboard}
                </div>
            </div>
            <FloatingICSA activePage={safeActive} />
        </div>
    );
}