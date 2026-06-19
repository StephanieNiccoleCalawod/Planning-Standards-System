import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ServiceCatalogue from "./pages/ServiceCatalogue";
import KPIStandards from "./pages/KPIStandards";
import SLAConfiguration from "./pages/SLAConfiguration";
import HolidayCalendar from "./pages/HolidayCalendar";
import EvaluationPeriods from "./pages/EvaluationPeriods";
import OPCRCommitments from "./pages/OPCRCommitments";
import SLAComputation from "./pages/SLAComputation";
import { isAuthenticated, PREDEFINED_MOCK_USERS } from "./services/auth";
import { useAppStore } from "./store/useAppStore";

const ARMS_URL = import.meta.env.VITE_ARMS_URL || 'http://localhost:5173';

const ROLE_COLORS = {
    'Staff': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    'Office Head': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    'Campus Director / Evaluator': { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
};

const OFFICE_COLORS = {
    'ACAD': { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    'OSAS': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
    'ADMIN': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    'ALL': { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
};

function DevBypassScreen() {
    const { loginAsMockUser } = useAppStore();
    const [hoveredId, setHoveredId] = useState(null);

    const handleLoginAs = (user) => {
        loginAsMockUser(user);
    };

    const groupedUsers = [
        { office: 'ACAD', users: PREDEFINED_MOCK_USERS.filter(u => u.office === 'ACAD') },
        { office: 'OSAS', users: PREDEFINED_MOCK_USERS.filter(u => u.office === 'OSAS') },
        { office: 'ADMIN', users: PREDEFINED_MOCK_USERS.filter(u => u.office === 'ADMIN') },
        { office: 'Cross-Office', users: PREDEFINED_MOCK_USERS.filter(u => u.office === 'ALL') },
    ];

    const officeFullNames = {
        'ACAD': 'Academic Affairs Office',
        'OSAS': 'Student Affairs Office (OSAS)',
        'ADMIN': 'Administration Office',
        'Cross-Office': 'Cross-Office Access',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #580000 0%, #3B0000 40%, #1a0000 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            fontFamily: '"DM Sans", sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorative circles */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 820 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 100,
                        padding: '6px 16px',
                        marginBottom: 16,
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            PSS — Planning & Standards System
                        </span>
                    </div>
                    <h1 style={{ color: '#ffffff', fontSize: 28, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Session not found
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
                        Select a mock user below to simulate a session.
                    </p>
                </div>

                {/* Main card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                }}>
                    {/* Developer Bypass Section */}
                    <div style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px', whiteSpace: 'nowrap' }}>
                                🛠 Developer Bypass
                            </span>
                            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                        </div>

                        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                            Select a mock user to simulate that user's session. Tokens are base64-encoded and decoded dynamically — no backend redeploy needed.
                        </p>

                        {/* Mock user registry grouped by office */}
                        {groupedUsers.map(({ office, users }) => (
                            <div key={office} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: '#64748B',
                                    }}>
                                        {officeFullNames[office] || office}
                                    </span>
                                    <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                                    {users.map((user) => {
                                        const roleColor = ROLE_COLORS[user.roleLabel] || ROLE_COLORS['Staff'];
                                        const officeColor = OFFICE_COLORS[user.office] || OFFICE_COLORS['ACAD'];
                                        const isHovered = hoveredId === user.id;
                                        return (
                                            <button
                                                key={user.id}
                                                id={`bypass-btn-${user.id}`}
                                                onMouseEnter={() => setHoveredId(user.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                                onClick={() => handleLoginAs(user)}
                                                style={{
                                                    padding: '12px 14px',
                                                    border: `1.5px solid ${isHovered ? '#580000' : '#E2E8F0'}`,
                                                    borderRadius: 10,
                                                    background: isHovered ? '#FEF2F2' : '#FAFAFA',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.18s ease',
                                                    transform: isHovered ? 'translateY(-1px)' : 'none',
                                                    boxShadow: isHovered ? '0 4px 12px rgba(88,0,0,0.12)' : 'none',
                                                }}
                                            >
                                                {/* Avatar row */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    <div style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        background: isHovered ? '#580000' : '#E2E8F0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 11,
                                                        fontWeight: 800,
                                                        color: isHovered ? '#fff' : '#475569',
                                                        flexShrink: 0,
                                                        transition: 'all 0.18s ease',
                                                    }}>
                                                        {user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{user.displayName}</p>
                                                        <p style={{ margin: 0, fontSize: 10, color: '#64748B', lineHeight: 1.2 }}>@{user.username}</p>
                                                    </div>
                                                </div>
                                                {/* Tags */}
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                                                        background: roleColor.bg, color: roleColor.text, border: `1px solid ${roleColor.border}`,
                                                    }}>
                                                        {user.roleLabel}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                                                        background: officeColor.bg, color: officeColor.text, border: `1px solid ${officeColor.border}`,
                                                    }}>
                                                        {user.office}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
                    PUP Caloocan — Planning & Standards System v1.0
                </p>
            </div>
        </div>
    );
}

export default function App() {
    const [active, setActive] = useState("dashboard");
    const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen, permissions } = useAppStore();

    if (!isAuthenticated()) {
        return <DevBypassScreen />;
    }

    // Staff users cannot access opcrCommitments — redirect to dashboard silently
    const safeActive = (active === 'opcrCommitments' && !permissions.canViewCommitments)
        ? 'dashboard'
        : active;

    const PAGES = {
        dashboard: <Dashboard />,
        serviceCatalogue: <ServiceCatalogue />,
        kpiStandards: <KPIStandards />,
        slaConfiguration: <SLAConfiguration />,
        holidayCalendar: <HolidayCalendar />,
        evaluationPeriods: <EvaluationPeriods />,
        opcrCommitments: permissions.canViewCommitments ? <OPCRCommitments /> : <Dashboard />,
        slaComputation: <SLAComputation />,
    };

    const handleNavigate = (pageKey) => {
        // Block Staff from navigating to opcrCommitments
        if (pageKey === 'opcrCommitments' && !permissions.canViewCommitments) return;
        setActive(pageKey);
        setSidebarMobileOpen(false);
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
        </div>
    );
}