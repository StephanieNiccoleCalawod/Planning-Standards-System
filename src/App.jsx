import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ServiceCatalogue from "./pages/ServiceCatalogue";
import KPIStandards from "./pages/KPIStandards";
import SLAConfiguration from "./pages/SLAConfiguration";
import HolidayCalendar from "./pages/HolidayCalendar";
import EvaluationPeriods from "./pages/EvaluationPeriods";
import OPCRCommitments from "./pages/OPCRCommitments";
import Users from "./pages/Users";
import OfficeSettings from "./pages/OfficeSettings";
import VersionHistory from "./pages/VersionHistory";

const PAGES = {
  dashboard: <Dashboard />,
  serviceCatalogue: <ServiceCatalogue />,
  kpiStandards: <KPIStandards />,
  slaConfiguration: <SLAConfiguration />,
  holidayCalendar: <HolidayCalendar />,
  evaluationPeriods: <EvaluationPeriods />,
  opcrCommitments: <OPCRCommitments />,
  users: <Users />,
  officeSettings: <OfficeSettings />,
  versionHistory: <VersionHistory />,
};

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the sidebar when navigation occurs
  const handleNavigate = (pageKey) => {
    setActive(pageKey);
    setSidebarOpen(false);
  };

  return (
    <div className="lib-page" style={{ height: "100vh", overflow: "hidden", display: "flex", width: "100vw" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .main-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100vh;
          overflow: hidden;
          margin-left: 260px;
          transition: margin-left 0.3s ease-in-out;
          min-width: 0;
        }
        @media (max-width: 960px) {
          .main-container {
            margin-left: 0;
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
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="main-container">
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
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
