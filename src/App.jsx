import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ServiceCatalogue from "./pages/ServiceCatalogue";
import KPIStandards from "./pages/KPIStandards";
import SLAConfiguration from "./pages/SLAConfiguration";
import HolidayCalendar from "./pages/HolidayCalendar";
import EvaluationPeriods from "./pages/EvaluationPeriods";
import OPCRCommitments from "./pages/OPCRCommitments";
import { isAuthenticated } from "./services/auth";
import { useAppStore } from "./store/useAppStore";

const ARMS_URL = import.meta.env.VITE_ARMS_URL || 'http://localhost:5173';

const PAGES = {
    dashboard: <Dashboard />,
    serviceCatalogue: <ServiceCatalogue />,
    kpiStandards: <KPIStandards />,
    slaConfiguration: <SLAConfiguration />,
    holidayCalendar: <HolidayCalendar />,
    evaluationPeriods: <EvaluationPeriods />,
    opcrCommitments: <OPCRCommitments />,
};

export default function App() {
    const [active, setActive] = useState("dashboard");
    const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useAppStore();

    if (!isAuthenticated()) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                gap: 16,
                fontFamily: '"DM Sans", sans-serif',
                textAlign: "center",
                padding: 24,
            }}>
                <h2>Session not found</h2>
                <p>Please log in through ARMS first to access the Planning &amp; Standards System.</p>
                <a
                    href={ARMS_URL}
                    style={{
                        background: "#500000",
                        color: "#fff",
                        padding: "10px 24px",
                        borderRadius: 6,
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    Go to ARMS Login
                </a>
            </div>
        );
    }

    const handleNavigate = (pageKey) => {
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
                active={active}
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
                    {PAGES[active] || PAGES.dashboard}
                </div>
            </div>
        </div>
    );
}
